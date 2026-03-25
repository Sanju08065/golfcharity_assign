const { supabaseAdmin } = require('../utils/supabase');

/**
 * Verifies the user has role = 'admin' in the profiles table.
 * Must run AFTER verifyToken.
 * Caches profile on req.profile to avoid duplicate DB calls.
 */
async function verifyAdmin(req, res, next) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Reuse cached profile if already fetched by verifySubscription
    if (req.profile) {
      if (req.profile.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
          code: 'FORBIDDEN'
        });
      }
      req.isAdmin = true;
      return next();
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role, subscription_status')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('verifyAdmin DB error:', error.message);
      return res.status(403).json({
        success: false,
        error: 'Authorization check failed',
        code: 'AUTH_CHECK_FAILED'
      });
    }

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'FORBIDDEN'
      });
    }

    req.isAdmin = true;
    req.profile = profile;
    next();
  } catch (err) {
    console.error('verifyAdmin error:', err.message);
    return res.status(403).json({
      success: false,
      error: 'Authorization check failed',
      code: 'AUTH_CHECK_FAILED'
    });
  }
}

module.exports = verifyAdmin;
