/**
 * Analysis engine for Privacy Guard
 * Coordinates API calls, caching, and result processing
 */

import { APIManager } from '../lib/api-manager.js';
import { getCachedAnalysis, setCachedAnalysis } from './cache.js';
import { analyzeWithHeuristics } from '../lib/heuristics.js';
import { enforceRateLimit } from '../lib/rate-limiter.js';

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
 * Check if API is configured for the given provider
 */
async function checkApiConfigured(provider) {
  const manager = getAPIManager();
  if (!manager) {
    console.log('❌ API manager not available');
    return false;
  }
  
  if (provider === 'auto') {
    // Check if any provider is configured
    const available = await manager.getAvailableProviders();
    console.log('🔍 Available providers:', available.map(p => `${p.key}: ${p.configured ? '✅' : '❌'}`).join(', '));
    const hasConfigured = available.some(p => p.configured && p.key !== 'local');
    console.log('🔑 Auto mode - API configured:', hasConfigured);
    return hasConfigured;
  }
  
  const providerObj = manager.providers[provider];
  if (!providerObj) {
    console.log(`❌ Provider "${provider}" not found`);
    return false;
  }
  
  const isConfigured = await providerObj.isConfigured();
  console.log(`🔑 Provider "${provider}" configured:`, isConfigured);
  return isConfigured;
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
  if (!url || !text || text.length < 50) {
    throw new Error('Invalid document: URL and at least 50 characters of text required');
  }

  const { enforceNoNetworkMode = false } = await chrome.storage.local.get('enforceNoNetworkMode');
  const originalMode = mode;
  let effectiveMode = mode;
  let effectiveProvider = provider;
  let forcedLocal = false;

  if (enforceNoNetworkMode) {
    effectiveMode = 'local';
    effectiveProvider = 'local';
    forcedLocal = originalMode !== 'local';
  }

  // Check cache first, but only if mode matches (don't use cached local result for AI mode)
  const cached = await getCachedAnalysis(url);
  if (cached && cached.mode === effectiveMode && cached.provider === effectiveProvider) {
    console.log('📦 Using cached result (mode:', effectiveMode, ', provider:', effectiveProvider, ')');
    return { ...cached, source: 'cache' };
  } else if (cached) {
    console.log('🔄 Cache mismatch - mode:', cached.mode, 'vs', effectiveMode, ', provider:', cached.provider, 'vs', effectiveProvider);
    console.log('🔄 Getting fresh analysis...');
  }

  let result;

  // Hybrid mode: Use AI if configured, otherwise use local (no confusing switching)
  if (effectiveMode === 'hybrid') {
    const hasApiConfigured = await checkApiConfigured(effectiveProvider);
    
    if (hasApiConfigured) {
      console.log('🤖 Hybrid mode: Using AI analysis (API configured)');
      try {
        result = await analyzeWithAI(text, effectiveProvider);
      } catch (error) {
        console.warn('AI analysis failed, falling back to local:', error);
        result = await analyzeLocally(text);
        result.warning = `AI analysis failed: ${error.message}. Using local analysis instead.`;
      }
    } else {
      console.log('📍 Hybrid mode: Using local analysis (API not configured)');
      result = await analyzeLocally(text);
    }
  } else if (effectiveMode === 'ai') {
    console.log('🤖 AI mode: Using API analysis');
    console.log('🔍 Checking API configuration for provider:', effectiveProvider);
    
    // Check if API is configured before attempting
    const hasApiConfigured = await checkApiConfigured(effectiveProvider);
    console.log('🔑 API configured:', hasApiConfigured);
    
    if (!hasApiConfigured) {
      console.warn('⚠️ AI mode selected but no API key configured. Falling back to local analysis.');
      console.warn('💡 Please add an API key in Options page to use AI mode.');
      console.warn('💡 Make sure:');
      console.warn('   1. API key is saved in Options page');
      console.warn('   2. Provider is set correctly (not "auto" if you want specific provider)');
      console.warn('   3. Reload extension after saving key');
      result = await analyzeLocally(text);
      result.warning = 'AI mode selected but no API key configured. Using local analysis instead.';
      result.mode = mode; // Keep the selected mode for debugging
    } else {
      try {
        console.log('🚀 Starting AI analysis...');
        // Enforce rate limiting before API call
        enforceRateLimit(effectiveProvider);
        result = await analyzeWithAI(text, effectiveProvider);
        console.log('✅ AI analysis completed successfully');
        console.log('📊 Result provider:', result.provider);
      } catch (error) {
        console.error('❌ AI analysis failed:', error);
        console.error('❌ Error details:', error.message);
        console.warn('Falling back to local analysis');
        result = await analyzeLocally(text);
        result.warning = `AI analysis failed: ${error.message}. Using local analysis instead.`;
        result.mode = mode; // Keep the selected mode for debugging
      }
    }
  } else {
    console.log('📊 Local mode: Using heuristic analysis');
    result = await analyzeLocally(text);
  }

  // Enhance with additional metadata
  result.url = url;
  result.analyzed_at = new Date().toISOString();
  result.mode = effectiveMode;

  // Set source based on actual provider used, not just mode
  // If provider name contains "Local" or "Heuristics", it's local analysis
  const actualSource = (result.provider && (result.provider.includes('Local') || result.provider.includes('Heuristics'))) 
    ? 'local' 
    : 'api';
  result.source = actualSource;

  // Cache result
  if (forcedLocal) {
    const warning = 'No-network mode is enabled. Analysis used local heuristics only.';
    result.warning = result.warning ? `${result.warning} ${warning}` : warning;
  }

  await setCachedAnalysis(url, { ...result, mode: effectiveMode, provider: result.provider || effectiveProvider });

  return result;
}

/**
 * Analyze with AI provider
 */
async function analyzeWithAI(text, provider) {
  const manager = getAPIManager();
  if (!manager) {
    throw new Error('API manager not available. Please use Local mode.');
  }
  
  console.log('🤖 Using AI analysis with provider:', provider);
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
    provider: result.provider || provider || 'AI',
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

