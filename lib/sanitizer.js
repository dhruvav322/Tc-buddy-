/**
 * Input Sanitizer - Lightweight XSS prevention
 * Sanitizes HTML and text inputs to prevent injection attacks
 */

/**
 * Sanitize HTML content (basic protection without external library)
 * @param {string} html - HTML content to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html) {
  if (!html) return '';
  
  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.textContent = html; // textContent automatically escapes HTML
  
  return temp.innerHTML;
}

/**
 * Sanitize text content (escape HTML entities)
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeText(text) {
  if (!text) return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return String(text).replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize URL (prevent javascript:, data:, vbscript: schemes)
 * @param {string} url - URL to sanitize
 * @returns {string|null} Sanitized URL or null if dangerous
 */
export function sanitizeURL(url) {
  if (!url) return null;
  
  const urlStr = String(url).trim().toLowerCase();
  
  // Block dangerous URL schemes
  const dangerousSchemes = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
  ];
  
  for (const scheme of dangerousSchemes) {
    if (urlStr.startsWith(scheme)) {
      console.warn('Blocked dangerous URL scheme:', scheme);
      return null;
    }
  }
  
  // Only allow http://, https://, and relative URLs
  if (urlStr.startsWith('http://') || urlStr.startsWith('https://') || urlStr.startsWith('/') || urlStr.startsWith('./')) {
    return url;
  }
  
  // Relative URLs without scheme are OK
  if (!urlStr.includes(':')) {
    return url;
  }
  
  console.warn('Blocked suspicious URL:', url);
  return null;
}

/**
 * Sanitize object for safe display (removes functions, limits depth)
 * @param {any} obj - Object to sanitize
 * @param {number} maxDepth - Maximum nesting depth
 * @returns {any} Sanitized object
 */
export function sanitizeObject(obj, maxDepth = 5) {
  if (maxDepth <= 0) return '[Max Depth Reached]';
  
  if (obj === null || obj === undefined) return obj;
  
  // Primitive types are safe
  if (typeof obj !== 'object') {
    if (typeof obj === 'function') return '[Function]';
    return obj;
  }
  
  // Arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, maxDepth - 1));
  }
  
  // Objects
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip functions and symbols
    if (typeof value === 'function' || typeof value === 'symbol') {
      continue;
    }
    // Recursively sanitize
    sanitized[sanitizeText(key)] = sanitizeObject(value, maxDepth - 1);
  }
  
  return sanitized;
}

/**
 * Safe innerHTML setter - automatically sanitizes content
 * @param {HTMLElement} element - Target element
 * @param {string} html - HTML content
 */
export function setInnerHTMLSafe(element, html) {
  if (!element) return;
  
  // Use textContent by default (safest)
  element.textContent = html;
}

/**
 * Create element with sanitized attributes
 * @param {string} tag - HTML tag name
 * @param {object} attributes - Attributes to set
 * @param {string} textContent - Text content
 * @returns {HTMLElement} Created element
 */
export function createElementSafe(tag, attributes = {}, textContent = '') {
  const element = document.createElement(tag);
  
  // Whitelist of safe attributes
  const safeAttributes = ['id', 'class', 'href', 'src', 'alt', 'title', 'aria-label', 'role', 'type', 'name', 'value', 'placeholder'];
  
  for (const [key, value] of Object.entries(attributes)) {
    if (safeAttributes.includes(key)) {
      if (key === 'href' || key === 'src') {
        const safeURL = sanitizeURL(value);
        if (safeURL) {
          element.setAttribute(key, safeURL);
        }
      } else {
        element.setAttribute(key, sanitizeText(String(value)));
      }
    }
  }
  
  if (textContent) {
    element.textContent = textContent;
  }
  
  return element;
}

/**
 * Sanitize user input from form fields
 * @param {string} input - User input
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized input
 */
export function sanitizeUserInput(input, options = {}) {
  const {
    maxLength = 10000,
    allowNewlines = true,
    trimWhitespace = true,
  } = options;
  
  if (!input) return '';
  
  let sanitized = String(input);
  
  // Trim whitespace
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove newlines if not allowed
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Escape HTML
  sanitized = sanitizeText(sanitized);
  
  return sanitized;
}

/**
 * Validate and sanitize API key
 * @param {string} apiKey - API key to validate
 * @returns {string|null} Sanitized key or null if invalid
 */
export function sanitizeAPIKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') return null;
  
  const trimmed = apiKey.trim();
  
  // Check for common placeholder values
  const placeholders = ['your-api-key', 'api-key-here', 'enter-key', 'paste-key-here', '...'];
  if (placeholders.includes(trimmed.toLowerCase())) {
    return null;
  }
  
  // Check for masked values
  if (trimmed.includes('*') || trimmed.includes('•')) {
    return null;
  }
  
  // API keys should be reasonable length (10-200 chars)
  if (trimmed.length < 10 || trimmed.length > 200) {
    return null;
  }
  
  // API keys should only contain alphanumeric, dash, underscore
  if (!/^[a-zA-Z0-9\-_]+$/.test(trimmed)) {
    console.warn('API key contains unexpected characters');
    return null;
  }
  
  return trimmed;
}

