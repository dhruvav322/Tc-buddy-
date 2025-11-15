/**
 * Lightweight activity log utility used for diagnostics.
 * Stores a capped array of events ( newest first ) in chrome.storage.local.
 */

const MAX_ENTRIES = 200;

/**
 * Sanitize URL for logging (remove sensitive query params)
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 */
function sanitizeURLForLog(url) {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    // Remove query parameters (may contain tokens, session IDs, etc.)
    urlObj.search = '';
    // Remove hash (may contain sensitive data)
    urlObj.hash = '';
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, just return hostname
    return url.split('?')[0].split('#')[0];
  }
}

/**
 * Sanitize details object (remove sensitive data)
 * @param {object} details - Details to sanitize
 * @returns {object} Sanitized details
 */
function sanitizeDetails(details) {
  if (!details || typeof details !== 'object') return {};
  
  const sanitized = { ...details };
  
  // Remove or sanitize URL if present
  if (sanitized.url) {
    sanitized.url = sanitizeURLForLog(sanitized.url);
  }
  
  // Remove sensitive keys
  const sensitiveKeys = ['apiKey', 'password', 'token', 'secret', 'auth', 'session'];
  for (const key of sensitiveKeys) {
    delete sanitized[key];
  }
  
  // Truncate long values
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string' && value.length > 200) {
      sanitized[key] = value.substring(0, 200) + '...';
    }
  }
  
  return sanitized;
}

export async function logActivity(event, details = {}) {
  try {
    // Check if logging is enabled (default: true for backward compatibility)
    const { activityLogEnabled = true } = await chrome.storage.local.get('activityLogEnabled');
    if (!activityLogEnabled) {
      return; // Logging disabled
    }
    
    const entry = {
      event,
      details: sanitizeDetails(details),
      timestamp: new Date().toISOString(),
    };
    const { privacyGuardActivityLog = [] } = await chrome.storage.local.get('privacyGuardActivityLog');
    const updated = [entry, ...privacyGuardActivityLog].slice(0, MAX_ENTRIES);
    await chrome.storage.local.set({ privacyGuardActivityLog: updated });
  } catch (error) {
    console.warn('Failed to log activity', event, error);
  }
}

export async function clearActivityLog() {
  await chrome.storage.local.remove('privacyGuardActivityLog');
}
