/**
 * Caching system for analysis results
 * Uses chrome.storage.local with TTL
 */

const CACHE_KEY = 'privacyGuardCache';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

/**
 * Get cached analysis result
 * @param {string} url - Document URL
 * @returns {Promise<object|null>} Cached result or null
 */
export async function getCachedAnalysis(url) {
  try {
    const { [CACHE_KEY]: cache = {} } = await chrome.storage.local.get(CACHE_KEY);
    const entry = cache[url];
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      // Clean up expired entry
      delete cache[url];
      await chrome.storage.local.set({ [CACHE_KEY]: cache });
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Store analysis result in cache
 * @param {string} url - Document URL
 * @param {object} data - Analysis result
 */
export async function setCachedAnalysis(url, data) {
  try {
    const { [CACHE_KEY]: cache = {} } = await chrome.storage.local.get(CACHE_KEY);
    
    cache[url] = {
      data,
      timestamp: Date.now(),
    };

    // Limit cache size (keep last 100 entries)
    const entries = Object.entries(cache);
    if (entries.length > 100) {
      // Sort by timestamp and keep most recent
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      const limited = Object.fromEntries(entries.slice(0, 100));
      await chrome.storage.local.set({ [CACHE_KEY]: limited });
    } else {
      await chrome.storage.local.set({ [CACHE_KEY]: cache });
    }
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Clear all cached analyses
 */
export async function clearCache() {
  try {
    await chrome.storage.local.remove(CACHE_KEY);
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const { [CACHE_KEY]: cache = {} } = await chrome.storage.local.get(CACHE_KEY);
    const entries = Object.entries(cache);
    const now = Date.now();
    
    const stats = {
      total: entries.length,
      expired: 0,
      valid: 0,
      oldest: null,
      newest: null,
    };

    for (const [url, entry] of entries) {
      const age = now - entry.timestamp;
      if (age > CACHE_TTL_MS) {
        stats.expired++;
      } else {
        stats.valid++;
      }

      if (!stats.oldest || entry.timestamp < stats.oldest) {
        stats.oldest = entry.timestamp;
      }
      if (!stats.newest || entry.timestamp > stats.newest) {
        stats.newest = entry.timestamp;
      }
    }

    return stats;
  } catch (error) {
    console.error('Cache stats error:', error);
    return null;
  }
}

