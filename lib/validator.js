/**
 * API Response Validator
 * Validates API responses to prevent malformed or malicious data
 */

/**
 * Validate analysis response structure
 * @param {object} response - API response to validate
 * @returns {object} { valid: boolean, errors: string[] }
 */
export function validateAnalysisResponse(response) {
  const errors = [];
  
  if (!response || typeof response !== 'object') {
    errors.push('Response must be an object');
    return { valid: false, errors };
  }
  
  // Required fields
  const requiredFields = ['tldr', 'bullets', 'red_flags', 'risk', 'privacy_score'];
  for (const field of requiredFields) {
    if (!(field in response)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate tldr
  if (response.tldr !== undefined) {
    if (typeof response.tldr !== 'string') {
      errors.push('tldr must be a string');
    } else if (response.tldr.length > 1000) {
      errors.push('tldr is too long (max 1000 chars)');
    }
  }
  
  // Validate bullets
  if (response.bullets !== undefined) {
    if (!Array.isArray(response.bullets)) {
      errors.push('bullets must be an array');
    } else {
      if (response.bullets.length > 20) {
        errors.push('Too many bullets (max 20)');
      }
      response.bullets.forEach((bullet, idx) => {
        if (typeof bullet !== 'string') {
          errors.push(`Bullet ${idx} must be a string`);
        } else if (bullet.length > 500) {
          errors.push(`Bullet ${idx} is too long (max 500 chars)`);
        }
      });
    }
  }
  
  // Validate red_flags
  if (response.red_flags !== undefined) {
    if (typeof response.red_flags !== 'object' || Array.isArray(response.red_flags)) {
      errors.push('red_flags must be an object');
    } else {
      const flagCount = Object.keys(response.red_flags).length;
      if (flagCount > 50) {
        errors.push('Too many red flags (max 50)');
      }
    }
  }
  
  // Validate risk
  if (response.risk !== undefined) {
    const validRisks = ['Safe', 'Watch', 'Risky'];
    if (!validRisks.includes(response.risk)) {
      errors.push(`Invalid risk value: ${response.risk}. Must be one of: ${validRisks.join(', ')}`);
    }
  }
  
  // Validate privacy_score
  if (response.privacy_score !== undefined) {
    if (typeof response.privacy_score !== 'number') {
      errors.push('privacy_score must be a number');
    } else if (response.privacy_score < 0 || response.privacy_score > 100) {
      errors.push('privacy_score must be between 0 and 100');
    }
  }
  
  // Validate readability_score (optional)
  if (response.readability_score !== undefined) {
    if (typeof response.readability_score !== 'number') {
      errors.push('readability_score must be a number');
    } else if (response.readability_score < 0 || response.readability_score > 30) {
      errors.push('readability_score must be between 0 and 30');
    }
  }
  
  // Validate trust_score (optional)
  if (response.trust_score !== undefined) {
    if (typeof response.trust_score !== 'number') {
      errors.push('trust_score must be a number');
    } else if (response.trust_score < 0 || response.trust_score > 100) {
      errors.push('trust_score must be between 0 and 100');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize and validate analysis response
 * @param {object} response - API response
 * @returns {object} Sanitized response
 */
export function sanitizeAnalysisResponse(response) {
  // Validate first
  const validation = validateAnalysisResponse(response);
  if (!validation.valid) {
    console.warn('Invalid API response:', validation.errors);
    // Return a safe default
    return {
      tldr: 'Unable to analyze (invalid response format)',
      bullets: ['The API returned an invalid response'],
      red_flags: {},
      risk: 'Watch',
      privacy_score: 50,
      readability_score: 12,
      error: true
    };
  }
  
  // Sanitize strings (truncate if needed)
  const sanitized = {
    tldr: String(response.tldr || '').substring(0, 1000),
    bullets: Array.isArray(response.bullets) 
      ? response.bullets.slice(0, 20).map(b => String(b || '').substring(0, 500))
      : [],
    red_flags: response.red_flags || {},
    risk: response.risk || 'Watch',
    privacy_score: Math.max(0, Math.min(100, Number(response.privacy_score) || 50)),
    readability_score: response.readability_score !== undefined 
      ? Math.max(0, Math.min(30, Number(response.readability_score)))
      : 12,
    trust_score: response.trust_score !== undefined
      ? Math.max(0, Math.min(100, Number(response.trust_score)))
      : undefined,
    provider: response.provider || 'Unknown',
  };
  
  return sanitized;
}

/**
 * Validate HTTP response headers
 * @param {Response} response - Fetch API response
 * @returns {boolean} Valid or not
 */
export function validateResponseHeaders(response) {
  // Check Content-Type
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    console.warn('Unexpected Content-Type:', contentType);
    return false;
  }
  
  return true;
}

/**
 * Safe JSON parse with validation
 * @param {string} jsonString - JSON string to parse
 * @param {object} defaultValue - Default value if parse fails
 * @returns {object} Parsed object or default
 */
export function parseJSONSafe(jsonString, defaultValue = null) {
  try {
    const parsed = JSON.parse(jsonString);
    // Prevent prototype pollution
    if (parsed && typeof parsed === 'object') {
      delete parsed.__proto__;
      delete parsed.constructor;
      delete parsed.prototype;
    }
    return parsed;
  } catch (error) {
    console.warn('JSON parse error:', error);
    return defaultValue;
  }
}

