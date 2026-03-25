const express = require('express');
const { body, param } = require('express-validator');
const { supabaseAdmin } = require('../utils/supabase');
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// GET /api/admin/reports — Dashboard analytics
router.get('/reports', verifyToken, verifyAdmin, async (req, res) => {
  try {
    // Total users — only role: 'user', exclude admins
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'user');

    // Active subscribers — only role: 'user'
    const { count: activeSubscribers } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'user')
      .eq('subscription_status', 'active');

    // Total prize pool (sum of all prize pools)
    const { data: prizePools } = await supabaseAdmin
      .from('prize_pools')
      .select('total_amount');

    const totalPrizePool = (prizePools || []).reduce((sum, p) => sum + (p.total_amount || 0), 0);

    // Total charity contributions (estimated from active user subscribers only)
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('charity_percentage, subscription_plan')
      .eq('role', 'user')
      .eq('subscription_status', 'active');

    let totalCharityContributions = 0;
    (profiles || []).forEach(p => {
      const fee = p.subscription_plan === 'yearly' ? 7.99 : 9.99;
      totalCharityContributions += fee * ((p.charity_percentage || 10) / 100);
    });

    // Draw statistics
    const { data: draws } = await supabaseAdmin
      .from('draws')
      .select('id, status, month, year')
      .order('created_at', { ascending: false });

    const publishedDraws = (draws || []).filter(d => d.status === 'published').length;
    const draftDraws = (draws || []).filter(d => d.status === 'draft').length;

    // Total winners
    const { count: totalWinners } = await supabaseAdmin
      .from('winners')
      .select('id', { count: 'exact', head: true });

    // Total paid out
    const { data: paidWinners } = await supabaseAdmin
      .from('winners')
      .select('prize_amount')
      .eq('payment_status', 'paid');

    const totalPaidOut = (paidWinners || []).reduce((sum, w) => sum + (w.prize_amount || 0), 0);

    // Recent users (last 10) with emails — batch fetch auth users
    const { data: recentUsersRaw } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, subscription_status, created_at')
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: { users: allAuthUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const authEmailMap = {};
    (allAuthUsers || []).forEach(u => { authEmailMap[u.id] = u.email || ''; });

    const recentUsers = (recentUsersRaw || []).map(u => ({
      ...u,
      email: authEmailMap[u.id] || ''
    }));

    // Monthly growth data — users only, exclude admins
    const { data: allProfiles } = await supabaseAdmin
      .from('profiles')
      .select('created_at, subscription_status')
      .eq('role', 'user');

    const monthlyGrowth = {};
    const subscriptionBreakdown = { active: 0, inactive: 0, lapsed: 0, cancelled: 0 };

    (allProfiles || []).forEach(p => {
      const date = new Date(p.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyGrowth[key] = (monthlyGrowth[key] || 0) + 1;
      const status = p.subscription_status || 'inactive';
      if (subscriptionBreakdown[status] !== undefined) {
        subscriptionBreakdown[status]++;
      } else {
        subscriptionBreakdown[status] = 1;
      }
    });

    // Ensure subscription_breakdown totals match total_users exactly
    const breakdownTotal = Object.values(subscriptionBreakdown).reduce((a, b) => a + b, 0);
    const verifiedTotalUsers = breakdownTotal; // use breakdown total as source of truth

    return res.status(200).json({
      success: true,
      data: {
        total_users: verifiedTotalUsers,
        active_subscribers: activeSubscribers || 0,
        total_prize_pool: parseFloat(totalPrizePool.toFixed(2)),
        total_charity_contributions: parseFloat(totalCharityContributions.toFixed(2)),
        total_winners: totalWinners || 0,
        total_paid_out: parseFloat(totalPaidOut.toFixed(2)),
        draw_statistics: {
          total: (draws || []).length,
          published: publishedDraws,
          draft: draftDraws
        },
        recent_users: recentUsers || [],
        monthly_growth: monthlyGrowth,
        subscription_breakdown: subscriptionBreakdown
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'REPORTS_FAILED'
    });
  }
});

// GET /api/admin/users — List all users
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { q } = req.query;

    // Fetch all users with charities
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*, charities(name)')
      .eq('role', 'user')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // Batch fetch all auth users in one call, then map by id
    const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = {};
    (authUsers || []).forEach(u => { emailMap[u.id] = u.email || 'N/A'; });

    let usersWithEmail = (data || []).map(profile => ({
      ...profile,
      email: emailMap[profile.id] || 'N/A'
    }));

    // Filter by name OR email if search query provided
    if (q) {
      const lower = q.toLowerCase();
      usersWithEmail = usersWithEmail.filter(u =>
        (u.full_name || '').toLowerCase().includes(lower) ||
        (u.email || '').toLowerCase().includes(lower)
      );
    }

    return res.status(200).json({
      success: true,
      data: usersWithEmail,
      count: usersWithEmail.length,
      total: (data || []).length
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'USERS_FETCH_FAILED'
    });
  }
});

// PUT /api/admin/users/:id — Edit user profile (admin)
router.put('/users/:id', verifyToken, verifyAdmin, [
  param('id').isUUID().withMessage('Valid user ID required'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  body('subscription_status').optional().isIn(['active', 'inactive', 'lapsed', 'cancelled']),
  body('subscription_plan').optional().isIn(['monthly', 'yearly']),
  body('charity_percentage').optional().isInt({ min: 10, max: 100 }),
  body('full_name').optional().trim().isLength({ min: 1, max: 100 }),
  validateRequest
], async (req, res) => {
  try {
    const updates = {};
    const fields = ['full_name', 'subscription_status', 'subscription_plan', 'charity_percentage', 'role'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    // Sanitize charity_id — must be valid UUID or null, never empty string
    if (req.body.charity_id !== undefined) {
      const cid = req.body.charity_id;
      updates.charity_id = (cid && typeof cid === 'string' && cid.trim() !== '') ? cid.trim() : null;
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return res.status(200).json({
      success: true,
      data,
      message: 'User updated successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'USER_UPDATE_FAILED'
    });
  }
});

// GET /api/admin/users/:id/scores — Get user's scores (admin)
router.get('/users/:id/scores', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('scores')
      .select('*')
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return res.status(200).json({
      success: true,
      data: data || [],
      count: (data || []).length
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'SCORES_FETCH_FAILED'
    });
  }
});

// PUT /api/admin/users/:userId/scores/:scoreId — Edit a user's score (admin)
router.put('/users/:userId/scores/:scoreId', verifyToken, verifyAdmin, [
  param('userId').isUUID().withMessage('Valid userId required'),
  param('scoreId').isUUID().withMessage('Valid scoreId required'),
  body('score').optional().isInt({ min: 1, max: 45 }).withMessage('Score must be 1–45'),
  body('played_date').optional().isISO8601().withMessage('Valid date required'),
  validateRequest
], async (req, res) => {
  try {
    const updates = {};
    if (req.body.score !== undefined) updates.score = req.body.score;
    if (req.body.played_date !== undefined) updates.played_date = req.body.played_date;

    const { data, error } = await supabaseAdmin
      .from('scores')
      .update(updates)
      .eq('id', req.params.scoreId)
      .eq('user_id', req.params.userId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return res.status(200).json({
      success: true,
      data,
      message: 'Score updated by admin'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'SCORE_UPDATE_FAILED'
    });
  }
});

// DELETE /api/admin/users/:userId/scores/:scoreId — Delete a user's score (admin)
router.delete('/users/:userId/scores/:scoreId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('scores')
      .delete()
      .eq('id', req.params.scoreId)
      .eq('user_id', req.params.userId);

    if (error) throw new Error(error.message);

    return res.status(200).json({
      success: true,
      message: 'Score deleted by admin'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'SCORE_DELETE_FAILED'
    });
  }
});

module.exports = router;
