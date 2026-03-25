const express = require('express');
const { body } = require('express-validator');
const { supabaseAdmin } = require('../utils/supabase');
const validateRequest = require('../middleware/validateRequest');
const verifyToken = require('../middleware/verifyToken');
const { sendWelcomeEmail, sendOtpEmail } = require('../utils/emailService');

const router = express.Router();

// Helper: wait for trigger to create profile, then upsert with full data
async function ensureProfile(userId, fullName) {
  // Retry up to 5 times with 200ms delay — trigger is async
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existing) {
      // Profile exists — update name
      await supabaseAdmin
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', userId);
      return;
    }

    // Profile not yet created by trigger — insert it directly
    if (i === 4) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName,
          role: 'user',
          subscription_status: 'inactive',
          charity_percentage: 10
        });
      if (error && error.code !== '23505') throw new Error(error.message);
      return;
    }

    await new Promise(r => setTimeout(r, 200));
  }
}

// ── POST /api/auth/register ──────────────────────────────────
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').trim().notEmpty().withMessage('Full name is required').isLength({ max: 100 }),
  validateRequest
], async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    // Check if email already registered
    const { data: { users: existing } } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    // Note: we can't search by email in listUsers, so we attempt createUser and handle the error

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (authError) {
      const msg = authError.message.toLowerCase();
      const isAlreadyRegistered = msg.includes('already') || msg.includes('exists') || authError.code === 'email_exists';
      return res.status(400).json({
        success: false,
        error: isAlreadyRegistered ? 'An account with this email already exists' : authError.message,
        code: isAlreadyRegistered ? 'EMAIL_EXISTS' : 'REGISTRATION_FAILED'
      });
    }

    // Ensure profile exists with correct name (handles trigger race condition)
    try {
      await ensureProfile(authData.user.id, full_name.trim());
    } catch (profileErr) {
      console.error('Profile setup error (non-fatal):', profileErr.message);
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, full_name).catch(() => {});

    // Sign in immediately to return session
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      return res.status(201).json({
        success: true,
        data: { user: authData.user, session: null },
        message: 'Account created. Please log in.'
      });
    }

    // Fetch full profile for response
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*, charities(name, image_url)')
      .eq('id', authData.user.id)
      .single();

    return res.status(201).json({
      success: true,
      data: {
        user: { ...signInData.user, profile },
        session: signInData.session
      },
      message: 'Account created successfully'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, code: 'SERVER_ERROR' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
], async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'LOGIN_FAILED'
      });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*, charities(name, image_url)')
      .eq('id', data.user.id)
      .single();

    return res.status(200).json({
      success: true,
      data: { user: { ...data.user, profile }, session: data.session },
      message: 'Login successful'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, code: 'SERVER_ERROR' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*, charities(name, image_url)')
      .eq('id', req.user.id)
      .single();

    if (error) {
      // Profile missing — create it on the fly
      await ensureProfile(req.user.id, req.user.email?.split('@')[0] || '');
      const { data: newProfile } = await supabaseAdmin
        .from('profiles')
        .select('*, charities(name, image_url)')
        .eq('id', req.user.id)
        .single();
      return res.status(200).json({ success: true, data: { ...req.user, profile: newProfile } });
    }

    return res.status(200).json({ success: true, data: { ...req.user, profile } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, code: 'SERVER_ERROR' });
  }
});

// ── PUT /api/auth/profile ────────────────────────────────────
router.put('/profile', verifyToken, [
  body('full_name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('new_password').optional().isLength({ min: 6 }),
  validateRequest
], async (req, res) => {
  try {
    const { full_name, new_password, current_password } = req.body;

    if (full_name) {
      const { error } = await supabaseAdmin
        .from('profiles').update({ full_name }).eq('id', req.user.id);
      if (error) throw new Error(error.message);
    }

    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ success: false, error: 'Current password required', code: 'CURRENT_PASSWORD_REQUIRED' });
      }
      const { error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
        email: req.user.email, password: current_password
      });
      if (verifyError) {
        return res.status(400).json({ success: false, error: 'Current password is incorrect', code: 'WRONG_PASSWORD' });
      }
      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, { password: new_password });
      if (pwError) throw new Error(pwError.message);
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('*, charities(name, image_url)').eq('id', req.user.id).single();

    return res.status(200).json({ success: true, data: { ...req.user, profile }, message: 'Profile updated' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, code: 'PROFILE_UPDATE_FAILED' });
  }
});

// ── POST /api/auth/forgot-password ──────────────────────────
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  validateRequest
], async (req, res) => {
  try {
    const { email } = req.body;

    let authUser = null;
    let page = 1;
    while (!authUser) {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) break;
      authUser = users.find(u => u.email === email);
      if (users.length < 1000) break;
      page++;
    }

    // Always return success — prevent email enumeration
    if (!authUser) {
      return res.status(200).json({ success: true, message: 'If that email exists, an OTP has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from('profiles')
      .update({ reset_otp: otp, reset_otp_expires: expiresAt })
      .eq('id', authUser.id);

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('full_name').eq('id', authUser.id).single();

    sendOtpEmail(email, profile?.full_name || 'there', otp).catch(() => {});

    return res.status(200).json({ success: true, message: 'If that email exists, an OTP has been sent.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, code: 'FORGOT_PASSWORD_FAILED' });
  }
});

// ── POST /api/auth/verify-otp ────────────────────────────────
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
  validateRequest
], async (req, res) => {
  try {
    const { email, otp } = req.body;

    let authUser = null;
    let page = 1;
    while (!authUser) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      authUser = users.find(u => u.email === email);
      if (users.length < 1000) break;
      page++;
    }

    if (!authUser) return res.status(400).json({ success: false, error: 'Invalid OTP', code: 'INVALID_OTP' });

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('reset_otp, reset_otp_expires').eq('id', authUser.id).single();

    if (!profile?.reset_otp || profile.reset_otp !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP', code: 'INVALID_OTP' });
    }
    if (new Date() > new Date(profile.reset_otp_expires)) {
      return res.status(400).json({ success: false, error: 'OTP expired. Request a new one.', code: 'OTP_EXPIRED' });
    }

    return res.status(200).json({ success: true, message: 'OTP verified' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, code: 'VERIFY_OTP_FAILED' });
  }
});

// ── POST /api/auth/reset-password ───────────────────────────
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
  body('new_password').isLength({ min: 6 }),
  validateRequest
], async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;

    let authUser = null;
    let page = 1;
    while (!authUser) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      authUser = users.find(u => u.email === email);
      if (users.length < 1000) break;
      page++;
    }

    if (!authUser) return res.status(400).json({ success: false, error: 'Invalid request', code: 'INVALID_REQUEST' });

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('reset_otp, reset_otp_expires').eq('id', authUser.id).single();

    if (!profile?.reset_otp || profile.reset_otp !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP', code: 'INVALID_OTP' });
    }
    if (new Date() > new Date(profile.reset_otp_expires)) {
      return res.status(400).json({ success: false, error: 'OTP expired', code: 'OTP_EXPIRED' });
    }

    const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, { password: new_password });
    if (pwError) throw new Error(pwError.message);

    await supabaseAdmin
      .from('profiles')
      .update({ reset_otp: null, reset_otp_expires: null })
      .eq('id', authUser.id);

    return res.status(200).json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, code: 'RESET_PASSWORD_FAILED' });
  }
});

module.exports = router;
