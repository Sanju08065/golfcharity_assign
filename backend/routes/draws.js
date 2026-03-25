const express = require('express');
const { body, param } = require('express-validator');
const { supabaseAdmin } = require('../utils/supabase');
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');
const validateRequest = require('../middleware/validateRequest');
const { generateRandomDraw, generateAlgorithmicDraw, findWinners } = require('../utils/drawEngine');
const { calculatePrizePools, calculateWinnerPrizes } = require('../utils/prizeCalculator');
const { sendDrawResultEmail } = require('../utils/emailService');

const router = express.Router();

// Helper: Get next draw date (last day of current month at 8 PM)
function getNextDrawDate() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  lastDay.setHours(20, 0, 0, 0);
  return lastDay.toISOString();
}

// ─────────────────────────────────────────────────────────────
// SPECIFIC NAMED ROUTES FIRST — always before /:id param route
// ─────────────────────────────────────────────────────────────

// GET /api/draws/current — Get current/upcoming draw (PUBLIC)
router.get('/current', async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const { data, error } = await supabaseAdmin
      .from('draws')
      .select('*, prize_pools(*)')
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);

    // Get active subscriber count for prize pool estimate
    const { count: activeCount } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'active');

    // Get last published draw's carried over amount
    const { data: lastDraw } = await supabaseAdmin
      .from('draws')
      .select('carried_over_amount')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const carriedOver = lastDraw?.carried_over_amount || 0;
    const estimatedPools = calculatePrizePools(activeCount || 0, carriedOver);

    return res.status(200).json({
      success: true,
      data: {
        draw: data,
        activeSubscribers: activeCount || 0,
        estimatedPools,
        nextDrawDate: getNextDrawDate()
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'CURRENT_DRAW_FAILED'
    });
  }
});

// GET /api/draws/user/history — Get user's draw history (protected)
router.get('/user/history', verifyToken, async (req, res) => {
  try {
    // Get all published draws
    const { data: draws, error } = await supabaseAdmin
      .from('draws')
      .select('*, prize_pools(*)')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // Get user's winners
    const { data: userWins } = await supabaseAdmin
      .from('winners')
      .select('*')
      .eq('user_id', req.user.id);

    // Get user's scores for matching
    const { data: userScores } = await supabaseAdmin
      .from('scores')
      .select('score')
      .eq('user_id', req.user.id);

    const scores = (userScores || []).map(s => s.score);

    const history = (draws || []).map(draw => {
      const win = (userWins || []).find(w => w.draw_id === draw.id);
      const winningNumbers = draw.winning_numbers || [];
      const matchCount = scores.filter(s => winningNumbers.includes(s)).length;

      return {
        ...draw,
        user_match_count: matchCount,
        user_win: win || null
      };
    });

    return res.status(200).json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'DRAW_HISTORY_FAILED'
    });
  }
});

// POST /api/draws/admin/create — Create new draw (admin only)
router.post('/admin/create', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { month, year, draw_type } = req.body;
    const drawMonth = month || new Date().getMonth() + 1;
    const drawYear = year || new Date().getFullYear();
    const type = draw_type || 'random';

    // Check if draw already exists for this month
    const { data: existing } = await supabaseAdmin
      .from('draws')
      .select('id')
      .eq('month', drawMonth)
      .eq('year', drawYear)
      .eq('status', 'draft')
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'A draft draw already exists for this month',
        code: 'DRAW_EXISTS'
      });
    }

    // Get carried over amount from last published draw
    const { data: lastDraw } = await supabaseAdmin
      .from('draws')
      .select('id, carried_over_amount')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const carriedOver = lastDraw?.carried_over_amount || 0;

    // Create the draw
    const { data: draw, error } = await supabaseAdmin
      .from('draws')
      .insert({
        month: drawMonth,
        year: drawYear,
        status: 'draft',
        draw_type: type,
        carried_over_amount: carriedOver,
        carried_over_from: lastDraw?.id || null
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Create prize pool record
    const { count: activeCount } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'active');

    const pools = calculatePrizePools(activeCount || 0, carriedOver);

    await supabaseAdmin
      .from('prize_pools')
      .insert({
        draw_id: draw.id,
        total_amount: pools.total,
        five_match_pool: pools.fiveMatch,
        four_match_pool: pools.fourMatch,
        three_match_pool: pools.threeMatch
      });

    return res.status(201).json({
      success: true,
      data: { ...draw, pools },
      message: 'Draw created successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'DRAW_CREATE_FAILED'
    });
  }
});

// POST /api/draws/admin/simulate — Run simulation without publishing (admin only)
router.post('/admin/simulate', verifyToken, verifyAdmin, [
  body('draw_id').isUUID().withMessage('Valid draw_id required'),
  validateRequest
], async (req, res) => {
  try {
    const { draw_id } = req.body;

    if (!draw_id) {
      return res.status(400).json({
        success: false,
        error: 'draw_id is required',
        code: 'MISSING_DRAW_ID'
      });
    }

    // Get the draw
    const { data: draw, error: drawError } = await supabaseAdmin
      .from('draws')
      .select('*, prize_pools(*)')
      .eq('id', draw_id)
      .single();

    if (drawError || !draw) {
      return res.status(404).json({
        success: false,
        error: 'Draw not found',
        code: 'NOT_FOUND'
      });
    }

    // Get all active subscribers
    const { data: activeUsers } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('subscription_status', 'active');

    const activeUserIds = (activeUsers || []).map(u => u.id);

    // Bulk fetch all scores — include created_at for correct per-user sorting
    const { data: allScoresData } = await supabaseAdmin
      .from('scores')
      .select('user_id, score, created_at')
      .in('user_id', activeUserIds.length > 0 ? activeUserIds : ['00000000-0000-0000-0000-000000000000']);

    // Group scores by user, sort by created_at DESC, keep latest 5 per user
    const scoresByUser = {};
    (allScoresData || []).forEach(s => {
      if (!scoresByUser[s.user_id]) scoresByUser[s.user_id] = [];
      scoresByUser[s.user_id].push(s);
    });
    Object.keys(scoresByUser).forEach(uid => {
      scoresByUser[uid] = scoresByUser[uid]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(s => s.score);
    });

    const allScoresRaw = [];
    const subscriberScores = [];
    Object.entries(scoresByUser).forEach(([user_id, scores]) => {
      allScoresRaw.push(...scores);
      subscriberScores.push({ user_id, scores });
    });

    // Generate winning numbers
    const winningNumbers = draw.draw_type === 'algorithmic'
      ? generateAlgorithmicDraw(allScoresRaw)
      : generateRandomDraw(allScoresRaw);

    // Find winners
    const winners = findWinners(subscriberScores, winningNumbers);

    const winnerCounts = {
      five: winners.filter(w => w.match_type === 5).length,
      four: winners.filter(w => w.match_type === 4).length,
      three: winners.filter(w => w.match_type === 3).length
    };

    const pools = draw.prize_pools?.[0] || calculatePrizePools(
      (activeUsers || []).length,
      draw.carried_over_amount || 0
    );

    const prizes = calculateWinnerPrizes(
      {
        fiveMatch: pools.five_match_pool || pools.fiveMatch || 0,
        fourMatch: pools.four_match_pool || pools.fourMatch || 0,
        threeMatch: pools.three_match_pool || pools.threeMatch || 0
      },
      winnerCounts
    );

    return res.status(200).json({
      success: true,
      data: {
        winning_numbers: winningNumbers,
        total_participants: subscriberScores.length,
        winners: winners.map(w => ({
          ...w,
          prize_amount: w.match_type === 5 ? prizes.fiveMatchPrize
            : w.match_type === 4 ? prizes.fourMatchPrize
            : prizes.threeMatchPrize
        })),
        winner_counts: winnerCounts,
        prize_breakdown: prizes,
        pools,
        jackpot_rollover: prizes.jackpotRollover
      },
      message: 'Simulation complete — results not published'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'SIMULATION_FAILED'
    });
  }
});

// POST /api/draws/admin/publish — Publish draw results (admin only)
router.post('/admin/publish', verifyToken, verifyAdmin, [
  body('draw_id').isUUID().withMessage('Valid draw_id required'),
  validateRequest
], async (req, res) => {
  try {
    const { draw_id, winning_numbers } = req.body;

    // Validate winning_numbers if provided (skip if null/undefined — backend will generate)
    if (winning_numbers != null) {
      if (
        !Array.isArray(winning_numbers) ||
        winning_numbers.length !== 5 ||
        !winning_numbers.every(n => Number.isInteger(n) && n >= 1 && n <= 45) ||
        new Set(winning_numbers).size !== 5
      ) {
        return res.status(400).json({
          success: false,
          error: 'winning_numbers must be exactly 5 unique integers between 1 and 45',
          code: 'INVALID_WINNING_NUMBERS'
        });
      }
    }

    // Get the draw
    const { data: draw, error: drawError } = await supabaseAdmin
      .from('draws')
      .select('*, prize_pools(*)')
      .eq('id', draw_id)
      .single();

    if (drawError || !draw) {
      return res.status(404).json({
        success: false,
        error: 'Draw not found',
        code: 'NOT_FOUND'
      });
    }

    if (draw.status === 'published') {
      return res.status(400).json({
        success: false,
        error: 'Draw already published',
        code: 'ALREADY_PUBLISHED'
      });
    }

    // Get all active subscribers' scores — bulk fetch in one query
    const { data: activeUsers } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('subscription_status', 'active');

    const activeUserIds = (activeUsers || []).map(u => u.id);

    const { data: allScoresData } = await supabaseAdmin
      .from('scores')
      .select('user_id, score, created_at')
      .in('user_id', activeUserIds.length > 0 ? activeUserIds : ['00000000-0000-0000-0000-000000000000']);

    // Group by user, sort by created_at DESC, keep latest 5 — correct per-user ordering
    const scoresByUser = {};
    (allScoresData || []).forEach(s => {
      if (!scoresByUser[s.user_id]) scoresByUser[s.user_id] = [];
      scoresByUser[s.user_id].push(s);
    });
    Object.keys(scoresByUser).forEach(uid => {
      scoresByUser[uid] = scoresByUser[uid]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(s => s.score);
    });

    const allScoresRaw = [];
    const subscriberScores = [];
    Object.entries(scoresByUser).forEach(([user_id, scores]) => {
      allScoresRaw.push(...scores);
      subscriberScores.push({ user_id, scores });
    });

    // Use provided winning numbers or generate new ones
    const finalWinningNumbers = winning_numbers || (
      draw.draw_type === 'algorithmic'
        ? generateAlgorithmicDraw(allScoresRaw)
        : generateRandomDraw(allScoresRaw)
    );

    // Find all winners
    const winners = findWinners(subscriberScores, finalWinningNumbers);

    const winnerCounts = {
      five: winners.filter(w => w.match_type === 5).length,
      four: winners.filter(w => w.match_type === 4).length,
      three: winners.filter(w => w.match_type === 3).length
    };

    // Recalculate prize pool at publish time using live subscriber count
    const { count: liveActiveCount } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'active');

    const livePools = calculatePrizePools(liveActiveCount || 0, draw.carried_over_amount || 0);

    // Update prize_pools record with fresh numbers
    const existingPool = draw.prize_pools?.[0];
    if (existingPool) {
      await supabaseAdmin
        .from('prize_pools')
        .update({
          total_amount: livePools.total,
          five_match_pool: livePools.fiveMatch,
          four_match_pool: livePools.fourMatch,
          three_match_pool: livePools.threeMatch
        })
        .eq('id', existingPool.id);
    } else {
      await supabaseAdmin
        .from('prize_pools')
        .insert({
          draw_id: draw.id,
          total_amount: livePools.total,
          five_match_pool: livePools.fiveMatch,
          four_match_pool: livePools.fourMatch,
          three_match_pool: livePools.threeMatch
        });
    }

    const poolData = {
      fiveMatch: livePools.fiveMatch,
      fourMatch: livePools.fourMatch,
      threeMatch: livePools.threeMatch
    };

    const prizes = calculateWinnerPrizes(poolData, winnerCounts);

    // Create winner records in DB
    const winnerRecords = winners.map(w => ({
      draw_id: draw.id,
      user_id: w.user_id,
      match_type: w.match_type,
      prize_amount: w.match_type === 5 ? prizes.fiveMatchPrize
        : w.match_type === 4 ? prizes.fourMatchPrize
        : prizes.threeMatchPrize,
      verification_status: 'pending',
      payment_status: 'pending'
    }));

    if (winnerRecords.length > 0) {
      const { error: winnersError } = await supabaseAdmin
        .from('winners')
        .insert(winnerRecords);
      if (winnersError) throw new Error(winnersError.message);
    }

    // Handle jackpot rollover — carry forward if no 5-match winner
    const updateData = {
      status: 'published',
      winning_numbers: finalWinningNumbers,
      published_at: new Date().toISOString(),
      jackpot_amount: winnerCounts.five === 0 ? poolData.fiveMatch : 0,
      carried_over_amount: winnerCounts.five === 0 ? poolData.fiveMatch : 0
    };

    const { error: updateError } = await supabaseAdmin
      .from('draws')
      .update(updateData)
      .eq('id', draw.id);

    if (updateError) throw new Error(updateError.message);

    // If jackpot rolls over, update the next draft draw's carried_over_amount
    if (winnerCounts.five === 0 && poolData.fiveMatch > 0) {
      const { data: nextDraft } = await supabaseAdmin
        .from('draws')
        .select('id, carried_over_amount')
        .eq('status', 'draft')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextDraft) {
        const newCarryOver = (nextDraft.carried_over_amount || 0) + poolData.fiveMatch;
        await supabaseAdmin
          .from('draws')
          .update({ carried_over_amount: newCarryOver, carried_over_from: draw.id })
          .eq('id', nextDraft.id);
        // Prize pool for next draw will be recalculated fresh at publish time
      }
    }

    // Send draw result emails to all active subscribers (non-blocking, fire-and-forget)
    setImmediate(async () => {
      try {
        const { data: allProfiles } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name')
          .eq('subscription_status', 'active');

        if (!allProfiles || allProfiles.length === 0) return;

        // Paginate auth users to get all emails (avoid 50-user default limit)
        const emailMap = {};
        let page = 1;
        const perPage = 1000;
        while (true) {
          const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
          (authData?.users || []).forEach(u => { emailMap[u.id] = u.email; });
          if ((authData?.users || []).length < perPage) break;
          page++;
        }

        const winnerMap = {};
        winnerRecords.forEach(w => { winnerMap[w.user_id] = w; });

        for (const profile of allProfiles) {
          const email = emailMap[profile.id];
          if (!email) continue;
          const userScores = scoresByUser[profile.id] || [];
          const matchCount = userScores.filter(s => finalWinningNumbers.includes(s)).length;
          const winRecord = winnerMap[profile.id];
          const prizeAmount = winRecord?.prize_amount || 0;
          // stagger sends slightly to avoid rate limits
          await sendDrawResultEmail(email, profile.full_name || 'Player', draw.month, draw.year, finalWinningNumbers, matchCount, prizeAmount);
        }
        console.log(`Draw result emails sent to ${allProfiles.length} subscribers`);
      } catch (emailErr) {
        console.error('Failed to send draw result emails:', emailErr.message);
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        draw_id: draw.id,
        winning_numbers: finalWinningNumbers,
        winners: winnerRecords,
        winner_counts: winnerCounts,
        prize_breakdown: prizes,
        jackpot_rolled_over: winnerCounts.five === 0,
        jackpot_rollover_amount: winnerCounts.five === 0 ? poolData.fiveMatch : 0
      },
      message: 'Draw published successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'PUBLISH_FAILED'
    });
  }
});

// ─────────────────────────────────────────────────────────────
// PARAM ROUTES LAST — after all named routes
// ─────────────────────────────────────────────────────────────

// GET /api/draws — List all draws (protected)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('draws')
      .select('*, prize_pools(*)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return res.status(200).json({
      success: true,
      data,
      count: data.length
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'DRAWS_FETCH_FAILED'
    });
  }
});

// GET /api/draws/:id — Single draw with results (protected)
router.get('/:id', verifyToken, [
  param('id').isUUID().withMessage('Valid draw ID required'),
  validateRequest
], async (req, res) => {
  try {
    const { data: draw, error } = await supabaseAdmin
      .from('draws')
      .select('*, prize_pools(*)')
      .eq('id', req.params.id)
      .single();

    if (error || !draw) {
      return res.status(404).json({
        success: false,
        error: 'Draw not found',
        code: 'NOT_FOUND'
      });
    }

    // Get winners for this draw
    const { data: winners } = await supabaseAdmin
      .from('winners')
      .select('*, profiles(full_name)')
      .eq('draw_id', draw.id);

    return res.status(200).json({
      success: true,
      data: { ...draw, winners: winners || [] }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'DRAW_FETCH_FAILED'
    });
  }
});

module.exports = router;
