const express = require('express');
const { body, param } = require('express-validator');
const multer = require('multer');
const { supabaseAdmin } = require('../utils/supabase');
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');
const validateRequest = require('../middleware/validateRequest');
const { sendWinnerVerifiedEmail, sendPaymentEmail } = require('../utils/emailService');

const router = express.Router();

// Only allow image MIME types — reject everything else
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// Safe extension from MIME type — never trust originalname
const MIME_TO_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

// GET /api/winners/my — Get current user's winnings
router.get('/my', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('winners')
      .select('*, draws(month, year, winning_numbers)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const totalWon = (data || []).reduce((sum, w) => sum + (w.prize_amount || 0), 0);

    return res.status(200).json({
      success: true,
      data: data || [],
      total_won: parseFloat(totalWon.toFixed(2)),
      count: (data || []).length
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'WINNINGS_FETCH_FAILED'
    });
  }
});

// POST /api/winners/proof — Upload proof screenshot
// IMPORTANT: multer runs FIRST to parse multipart body, THEN validators read req.body
router.post('/proof', verifyToken, upload.single('proof'), [
  body('winner_id').isUUID().withMessage('Valid winner_id required'),
  validateRequest
], async (req, res) => {
  try {
    const { winner_id } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded', code: 'NO_FILE' });
    }

    // Ownership check BEFORE any storage operation
    const { data: winner } = await supabaseAdmin
      .from('winners').select('user_id').eq('id', winner_id).single();

    if (!winner || winner.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized', code: 'FORBIDDEN' });
    }

    // Extension from MIME type — never from user-controlled originalname
    const ext = MIME_TO_EXT[file.mimetype] || 'jpg';
    const fileName = `proofs/${req.user.id}/${winner_id}_${Date.now()}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('winner-proofs')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) throw new Error(uploadError.message);

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('winner-proofs')
      .getPublicUrl(fileName);

    // Update winner record
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('winners')
      .update({
        proof_url: urlData.publicUrl,
        verification_status: 'submitted'
      })
      .eq('id', winner_id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Proof uploaded successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'PROOF_UPLOAD_FAILED'
    });
  }
});

// GET /api/admin/winners — List all winners (admin)
router.get('/admin/all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('winners')
      .select('*, profiles(full_name), draws(month, year)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // Fetch emails from auth
    const winnersWithEmail = await Promise.all(
      (data || []).map(async (winner) => {
        try {
          const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(winner.user_id);
          return { ...winner, user_email: user?.email || 'N/A' };
        } catch {
          return { ...winner, user_email: 'N/A' };
        }
      })
    );

    return res.status(200).json({
      success: true,
      data: winnersWithEmail,
      count: winnersWithEmail.length
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'WINNERS_FETCH_FAILED'
    });
  }
});

// PUT /api/admin/winners/:id/verify — Approve or reject
router.put('/admin/:id/verify', verifyToken, verifyAdmin, [
  param('id').isUUID().withMessage('Valid winner ID required'),
  validateRequest
], async (req, res) => {
  try {
    const { status, reason } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be approved or rejected',
        code: 'INVALID_STATUS'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('winners')
      .update({
        verification_status: status,
        rejection_reason: status === 'rejected' ? reason : null
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Send email notification to winner (non-blocking)
    try {
      const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
      const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', data.user_id).single();
      if (authUser?.email) {
        sendWinnerVerifiedEmail(authUser.email, profile?.full_name || 'Player', status, data.prize_amount, reason);
      }
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
    }

    return res.status(200).json({
      success: true,
      data,
      message: `Winner ${status} successfully`
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'VERIFY_FAILED'
    });
  }
});

// PUT /api/admin/winners/:id/pay — Mark as paid (only if approved)
router.put('/admin/:id/pay', verifyToken, verifyAdmin, [
  param('id').isUUID().withMessage('Valid winner ID required'),
  validateRequest
], async (req, res) => {
  try {
    // Fetch current winner to check approval status
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('winners')
      .select('verification_status, payment_status, user_id, prize_amount')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Winner not found',
        code: 'NOT_FOUND'
      });
    }

    if (existing.verification_status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Cannot mark as paid — winner proof has not been approved yet',
        code: 'NOT_APPROVED'
      });
    }

    if (existing.payment_status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Winner has already been marked as paid',
        code: 'ALREADY_PAID'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('winners')
      .update({ payment_status: 'paid' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Send payment confirmation email (non-blocking)
    try {
      const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
      const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', data.user_id).single();
      if (authUser?.email) {
        sendPaymentEmail(authUser.email, profile?.full_name || 'Player', data.prize_amount);
      }
    } catch (emailErr) {
      console.error('Failed to send payment email:', emailErr.message);
    }

    return res.status(200).json({
      success: true,
      data,
      message: 'Winner marked as paid'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: 'PAY_FAILED'
    });
  }
});

module.exports = router;
