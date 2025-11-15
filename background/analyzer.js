/**
 * Analysis engine for Privacy Guard
 * Coordinates API calls, caching, and result processing
 */

import { APIManager } from '../lib/api-manager.js';
import { getCachedAnalysis, setCachedAnalysis } from './cache.js';
import { analyzeWithHeuristics } from '../lib/heuristics.js';

// Initialize API manager lazily to avoid initialization errors
let apiManager = null;

function getAPIManager() {
  if (!apiManager) {
    try {
      apiManager = new APIManager();
    } catch (error) {
      console.error('Failed to initialize API manager:', error);
      return null;
    }
  }
  return apiManager;
}

/**
 * Analyze document text
 * @param {object} params - Analysis parameters
 * @param {string} params.url - Document URL
 * @param {string} params.text - Document text
 * @param {string} params.mode - Analysis mode ('ai', 'local', 'hybrid')
 * @param {string} params.provider - Preferred API provider
 * @returns {Promise<object>} Analysis result
 */
export async function analyzeDocument({ url, text, mode = 'hybrid', provider = 'auto' }) {
  if (!url || !text || text.length < 100) {
    throw new Error('Invalid document: URL and at least 100 characters of text required');
  }

  // Check cache first
  const cached = await getCachedAnalysis(url);
  if (cached) {
    return { ...cached, source: 'cache' };
  }

  let result;

  // Hybrid mode: quick local scan first, then AI if needed
  if (mode === 'hybrid') {
    const localResult = await analyzeLocally(text);
    
    // If local scan shows high risk or many flags, use AI for detailed analysis
    const flagCount = Object.values(localResult.red_flags || {}).filter(v => v.startsWith('Yes')).length;
    if (flagCount >= 3 || localResult.risk === 'Risky') {
      try {
        result = await analyzeWithAI(text, provider);
        result.local_preview = localResult;
      } catch (error) {
        console.warn('AI analysis failed, using local:', error);
        result = localResult;
      }
    } else {
      result = localResult;
    }
  } else if (mode === 'ai') {
    result = await analyzeWithAI(text, provider);
  } else {
    result = await analyzeLocally(text);
  }

  // Enhance with additional metadata
  result.url = url;
  result.analyzed_at = new Date().toISOString();
  result.mode = mode;

  // Cache result
  await setCachedAnalysis(url, result);

  return { ...result, source: mode === 'local' ? 'local' : 'api' };
}

/**
 * Analyze with AI provider
 */
async function analyzeWithAI(text, provider) {
  const manager = getAPIManager();
  if (!manager) {
    throw new Error('API manager not available. Please use Local mode.');
  }
  const result = await manager.analyze(text, provider);
  
  // Ensure all required fields are present
  return {
    tldr: result.tldr || 'Analysis completed',
    bullets: result.bullets || [],
    red_flags: result.red_flags || {},
    risk: result.risk || 'Watch',
    privacy_score: result.privacy_score ?? 50,
    readability_score: result.readability_score ?? 12,
    trust_score: result.trust_score ?? 50,
    provider: result.provider || 'AI',
  };
}

/**
 * Analyze locally using heuristics
 */
async function analyzeLocally(text) {
  return await analyzeWithHeuristics(text);
}

/**
 * Analyze cookies on current page
 */
export async function analyzeCookies(tabId) {
  try {
    const cookies = await chrome.cookies.getAll({});
    const tab = await chrome.tabs.get(tabId);
    const domain = new URL(tab.url).hostname;

    // Filter cookies for current domain and related domains
    const relevantCookies = cookies.filter(cookie => {
      return cookie.domain === domain || 
             cookie.domain === `.${domain}` ||
             domain.endsWith(cookie.domain.replace(/^\./, ''));
    });

    // Categorize cookies
    const categorized = categorizeCookies(relevantCookies);
    
    return {
      total: relevantCookies.length,
      by_category: categorized,
      third_party: relevantCookies.filter(c => isThirdParty(c, domain)).length,
      trackers: detectTrackers(relevantCookies),
    };
  } catch (error) {
    console.error('Cookie analysis error:', error);
    return {
      total: 0,
      by_category: {},
      third_party: 0,
      trackers: [],
    };
  }
}

/**
 * Categorize cookies
 */
function categorizeCookies(cookies) {
  const categories = {
    essential: [],
    functional: [],
    analytics: [],
    marketing: [],
    advertising: [],
    unknown: [],
  };

  for (const cookie of cookies) {
    const name = cookie.name.toLowerCase();
    const domain = cookie.domain.toLowerCase();

    if (name.includes('session') || name.includes('auth') || name.includes('token')) {
      categories.essential.push(cookie);
    } else if (name.includes('preference') || name.includes('setting')) {
      categories.functional.push(cookie);
    } else if (name.includes('_ga') || name.includes('analytics') || domain.includes('google-analytics')) {
      categories.analytics.push(cookie);
    } else if (name.includes('_fbp') || name.includes('facebook') || domain.includes('facebook')) {
      categories.marketing.push(cookie);
    } else if (name.includes('ad') || domain.includes('doubleclick') || domain.includes('ads')) {
      categories.advertising.push(cookie);
    } else {
      categories.unknown.push(cookie);
    }
  }

  return Object.fromEntries(
    Object.entries(categories).map(([key, value]) => [key, value.length])
  );
}

/**
 * Check if cookie is third-party
 */
function isThirdParty(cookie, firstPartyDomain) {
  return !cookie.domain.includes(firstPartyDomain) && 
         !firstPartyDomain.includes(cookie.domain.replace(/^\./, ''));
}

/**
 * Detect known trackers
 */
function detectTrackers(cookies) {
  const trackerDomains = [
    'google-analytics',
    'doubleclick',
    'facebook',
    'twitter',
    'linkedin',
    'pinterest',
  ];

  return cookies
    .filter(c => trackerDomains.some(td => c.domain.includes(td)))
    .map(c => ({ name: c.name, domain: c.domain }));
}

