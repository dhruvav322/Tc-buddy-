/**
 * Rate limiter for API calls
 * Prevents excessive API usage and potential abuse
 */

class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests; // Max requests per window
    this.windowMs = windowMs; // Time window in milliseconds (default: 1 minute)
    this.requests = new Map(); // Store request timestamps by provider
  }

  /**
   * Check if request is allowed
   * @param {string} provider - API provider name
   * @returns {object} { allowed: boolean, retryAfter: number }
   */
  checkLimit(provider = 'default') {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get requests for this provider
    if (!this.requests.has(provider)) {
      this.requests.set(provider, []);
    }
    
    const providerRequests = this.requests.get(provider);
    
    // Remove requests outside the current window
    const recentRequests = providerRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(provider, recentRequests);
    
    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const retryAfter = Math.ceil((oldestRequest + this.windowMs - now) / 1000);
      return { 
        allowed: false, 
        retryAfter,
        current: recentRequests.length,
        limit: this.maxRequests
      };
    }
    
    // Record this request
    recentRequests.push(now);
    this.requests.set(provider, recentRequests);
    
    return { 
      allowed: true, 
      remaining: this.maxRequests - recentRequests.length,
      limit: this.maxRequests
    };
  }

  /**
   * Reset limits for a provider
   * @param {string} provider - API provider name
   */
  reset(provider = 'default') {
    this.requests.delete(provider);
  }

  /**
   * Reset all limits
   */
  resetAll() {
    this.requests.clear();
  }

  /**
   * Get current usage stats
   * @param {string} provider - API provider name
   */
  getStats(provider = 'default') {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const providerRequests = this.requests.get(provider) || [];
    const recentRequests = providerRequests.filter(timestamp => timestamp > windowStart);
    
    return {
      current: recentRequests.length,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - recentRequests.length),
      windowMs: this.windowMs
    };
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

/**
 * Enforce rate limit for API calls
 * @param {string} provider - API provider name
 * @throws {Error} If rate limit exceeded
 */
export function enforceRateLimit(provider) {
  const result = rateLimiter.checkLimit(provider);
  
  if (!result.allowed) {
    throw new Error(
      `Rate limit exceeded for ${provider}. ` +
      `Limit: ${result.limit} requests per minute. ` +
      `Please try again in ${result.retryAfter} seconds.`
    );
  }
  
  // Log remaining requests
  console.log(`API rate limit: ${result.remaining}/${result.limit} remaining`);
  
  return result;
}

