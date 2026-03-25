const express = require('express');
const { body, param } = require('express-validator');
const { supabaseAdmin } = require('../utils/supabase');
const verifyToken = require('../middleware/verifyToken');
const verifySubscription = require('../middleware/verifySubscription');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// POST /api/scores — Add a new score (rolling 5 logic) — requires active subscription
router.post('/', verifyToken, verifySubscription, [
  body('score').isInt({ min: 1, max: 45 }).withMessage('Score must be between 1 and 45'),
  body('played_date').isISO8601().withMessage('Valid date required'),
  validateRequest
], async (req, res) => {
  try {
    const { score, played_date } = req.body;
    const user_id = req.user.id;

    // Check existing scores count
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('scores')
      .select('id, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: true });

    if (fetchError) throw new Error(fetchError.message);

    // If user already has 5 scores, delete the oldest one
    if (existing && existing.length >= 5) {
      const { error: deleteError } = await supabaseAdmin
        .from('scores')
        .delete()
        .eq('id', existing[0].id);

      if (deleteError) throw new Error(deleteError.message);
    }

    // Insert new score
    const { data: newScore, error: insertError } = await supabaseAdmin
      .from('scores')
      .insert({
        user_id,
        score,
        played_date
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    return res.status(201).json({
      success: true,
      data: newScore,
      message: existing && existing.length >= 5
        ? 'Score added. Oldest score was replaced.'
        : 'Score added successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'SCORE_ADD_FAILED'
    });
  }
});

// GET /api/scores/:user_id — Get latest 5 scores (own scores only — IDOR fix)
router.get('/:user_id', verifyToken, [
  param('user_id').isUUID().withMessage('Valid user ID required'),
  validateRequest
], async (req, res) => {
  try {
    const { user_id } = req.params;

    // Only allow users to fetch their own scores (admins can fetch any)
    if (user_id !== req.user.id && !req.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view these scores',
        code: 'FORBIDDEN'
      });
    }

    const { data: scores, error } = await supabaseAdmin
      .from('scores')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw new Error(error.message);

    return res.status(200).json({
      success: true,
      data: scores,
      count: scores.length
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'SCORES_FETCH_FAILED'
    });
  }
});

// PUT /api/scores/:id — Edit a score
router.put('/:id', verifyToken, [
  param('id').isUUID().withMessage('Valid score ID required'),
  body('score').optional().isInt({ min: 1, max: 45 }).withMessage('Score must be between 1 and 45'),
  body('played_date').optional().isISO8601().withMessage('Valid date required'),
  validateRequest
], async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (req.body.score !== undefined) updates.score = req.body.score;
    if (req.body.played_date !== undefined) updates.played_date = req.body.played_date;

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('scores')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || (existing.user_id !== req.user.id && !req.isAdmin)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to edit this score',
        code: 'FORBIDDEN'
      });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('scores')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Score updated successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'SCORE_UPDATE_FAILED'
    });
  }
});

// DELETE /api/scores/:id — Delete a score
router.delete('/:id', verifyToken, [
  param('id').isUUID().withMessage('Valid score ID required'),
  validateRequest
], async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('scores')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || (existing.user_id !== req.user.id && !req.isAdmin)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this score',
        code: 'FORBIDDEN'
      });
    }

    const { error } = await supabaseAdmin
      .from('scores')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    return res.status(200).json({
      success: true,
      message: 'Score deleted successfully'
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
