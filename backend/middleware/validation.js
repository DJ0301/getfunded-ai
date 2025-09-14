/**
 * Validation middleware for API endpoints
 */

/**
 * Validate founder input data
 */
function validateFounderInput(req, res, next) {
  const {
    startupName,
    description,
    stage,
    founderEmail
  } = req.body;

  const errors = [];

  if (!startupName || startupName.trim().length < 2) {
    errors.push('Startup name is required and must be at least 2 characters');
  }

  if (!description || description.trim().length < 10) {
    errors.push('Description is required and must be at least 10 characters');
  }

  if (!stage || !['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+'].includes(stage)) {
    errors.push('Valid funding stage is required');
  }

  if (!founderEmail || !isValidEmail(founderEmail)) {
    errors.push('Valid email address is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
      message: 'Validation failed'
    });
  }

  next();
}

/**
 * Validate email request
 */
function validateEmailRequest(req, res, next) {
  const { to, subject, content } = req.body;
  const errors = [];

  if (!to || !isValidEmail(to)) {
    errors.push('Valid recipient email is required');
  }

  if (!subject || subject.trim().length < 3) {
    errors.push('Email subject is required and must be at least 3 characters');
  }

  if (!content || content.trim().length < 10) {
    errors.push('Email content is required and must be at least 10 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
      message: 'Email validation failed'
    });
  }

  next();
}

/**
 * Helper function to validate email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = {
  validateFounderInput,
  validateEmailRequest
};
