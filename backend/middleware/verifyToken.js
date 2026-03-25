const { supabaseAdmin } = require('../utils/supabase');

/**
 * Verifies the Supabase JWT from the Authorization header.
 * Attaches the verified user to req.user.
 * Uses supabaseAdmin.auth.getUser() which validates against Supabase Auth.
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer "

    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format',
        code: 'INVALID_TOKEN'
      });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('verifyToken error:', err.message);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
}

module.exports = verifyToken;
