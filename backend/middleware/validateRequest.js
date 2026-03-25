const { validationResult } = require('express-validator');

/**
 * Middleware to check express-validator results.
 * Returns 400 with validation errors if any exist.
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array().map(e => ({
        field: e.path,
        message: e.msg
      }))
    });
  }
  next();
}

module.exports = validateRequest;
