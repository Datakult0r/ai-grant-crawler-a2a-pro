/**
 * Validation middleware for API endpoints
 * Provides reusable validation functions for common patterns
 */

/**
 * Validates email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates URL format
 */
export function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Middleware to validate required fields in request body
 * @param {Array<string>} fields - Array of required field names
 */
export function requireFields(...fields) {
  return (req, res, next) => {
    const missing = fields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === "";
    });

    if (missing.length > 0) {
      return res.status(400).json({
        error: "Missing required fields",
        fields: missing,
      });
    }

    next();
  };
}

/**
 * Middleware to validate email in request body
 * @param {string} fieldName - Name of email field (default: 'email')
 */
export function validateEmailField(fieldName = "email") {
  return (req, res, next) => {
    const email = req.body[fieldName];

    if (!email) {
      return res.status(400).json({
        error: `${fieldName} is required`,
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: `Invalid ${fieldName} format`,
      });
    }

    // Normalize email to lowercase
    req.body[fieldName] = email.toLowerCase().trim();
    next();
  };
}

/**
 * Middleware to validate URL in request body
 * @param {string} fieldName - Name of URL field
 */
export function validateUrlField(fieldName) {
  return (req, res, next) => {
    const url = req.body[fieldName];

    if (!url) {
      return res.status(400).json({
        error: `${fieldName} is required`,
      });
    }

    if (!validateUrl(url)) {
      return res.status(400).json({
        error: `Invalid ${fieldName} format`,
      });
    }

    next();
  };
}

/**
 * Middleware to sanitize string inputs (prevent XSS)
 * @param {Array<string>} fields - Array of field names to sanitize
 */
export function sanitizeStrings(...fields) {
  return (req, res, next) => {
    fields.forEach((field) => {
      if (req.body[field] && typeof req.body[field] === "string") {
        // Remove HTML tags and trim
        req.body[field] = req.body[field].replace(/<[^>]*>/g, "").trim();
      }
    });
    next();
  };
}

/**
 * Middleware to validate numeric ranges
 * @param {string} fieldName - Name of numeric field
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 */
export function validateRange(fieldName, min, max) {
  return (req, res, next) => {
    const value = req.body[fieldName];

    if (value === undefined || value === null) {
      return next(); // Skip validation if field is optional
    }

    const numValue = Number(value);

    if (isNaN(numValue)) {
      return res.status(400).json({
        error: `${fieldName} must be a number`,
      });
    }

    if (numValue < min || numValue > max) {
      return res.status(400).json({
        error: `${fieldName} must be between ${min} and ${max}`,
      });
    }

    next();
  };
}

/**
 * Middleware to validate enum values
 * @param {string} fieldName - Name of field
 * @param {Array} allowedValues - Array of allowed values
 */
export function validateEnum(fieldName, allowedValues) {
  return (req, res, next) => {
    const value = req.body[fieldName];

    if (value === undefined || value === null) {
      return next(); // Skip validation if field is optional
    }

    if (!allowedValues.includes(value)) {
      return res.status(400).json({
        error: `Invalid ${fieldName}. Allowed values: ${allowedValues.join(", ")}`,
      });
    }

    next();
  };
}

/**
 * Middleware to validate date formats (ISO 8601)
 * @param {string} fieldName - Name of date field
 */
export function validateDate(fieldName) {
  return (req, res, next) => {
    const value = req.body[fieldName];

    if (value === undefined || value === null) {
      return next(); // Skip validation if field is optional
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return res.status(400).json({
        error: `Invalid ${fieldName} format. Use ISO 8601 format (YYYY-MM-DD)`,
      });
    }

    next();
  };
}

/**
 * Middleware to validate pagination parameters
 */
export function validatePagination(req, res, next) {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        error: "Invalid page parameter. Must be a positive integer.",
      });
    }
    req.query.page = pageNum;
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: "Invalid limit parameter. Must be between 1 and 100.",
      });
    }
    req.query.limit = limitNum;
  }

  next();
}

/**
 * Middleware to validate UUID in request params
 * @param {string} paramName - Name of the parameter (default: 'id')
 */
export function validateUUID(paramName = "id") {
  return (req, res, next) => {
    const uuid = req.params[paramName];
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuid || !uuidRegex.test(uuid)) {
      return res.status(400).json({
        error: `Invalid ${paramName}. Must be a valid UUID.`,
      });
    }
    next();
  };
}
