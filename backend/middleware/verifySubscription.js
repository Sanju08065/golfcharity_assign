const { supabaseAdmin } = require('../utils/supabase');

/**
 * Verifies the user has an active subscription.
 * Admins bypass this check automatically.
 * Must run AFTER verifyToken.
 * Caches profile on req.profile to avoid duplicate DB calls.
 */
async function verifySubscription(req, res, next) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('subscription_status, role')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('verifySubscription DB error:', error.message);
      return res.status(403).json({
        success: false,
        error: 'Subscription check failed',
        code: 'SUBSCRIPTION_CHECK_FAILED'
      });
    }

    if (!profile) {
      return res.status(403).json({
        success: false,
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    // Admins always bypass subscription requirement
    if (profile.role === 'admin') {
      req.profile = profile;
      req.isAdmin = true;
      return next();
    }

    if (profile.subscription_status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Active subscription required to access this feature',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    req.profile = profile;
    next();
  } catch (err) {
    console.error('verifySubscription error:', err.message);
    return res.status(403).json({
      success: false,
      error: 'Subscription check failed',
      code: 'SUBSCRIPTION_CHECK_FAILED'
    });
  }
}

module.exports = verifySubscription;
