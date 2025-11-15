/**
 * Privacy Guard Service Worker
 * Main background script for Manifest V3
 */

// CRITICAL: Register message listener FIRST, before any imports
// This ensures the listener is always available, even during module loading
let handlersReady = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Always respond immediately, even during initialization
  try {
    if (!handlersReady) {
      console.log('Message received before handlers ready:', message.type);
      // For TEST messages, respond immediately to wake up the service worker
      if (message.type === 'TEST') {
        const result = sendResponse({ 
          success: true, 
          message: 'Service worker is initializing',
          timestamp: Date.now()
        });
        return result !== false;
      }
      // For other messages, queue them for processing once handlers are ready
      // But still respond to prevent Chrome error dialog
      const result = sendResponse({ 
        success: false, 
        error: 'Service worker still initializing. Please wait a moment and try again.',
        retry: true
      });
      return result !== false;
    }
    // Once handlers are ready, use the main handler
    return mainMessageHandler(message, sender, sendResponse);
  } catch (error) {
    // Channel already closed or error sending response
    console.warn('Error in message listener:', error);
    try {
      sendResponse({ success: false, error: error.message });
    } catch (e) {
      // Channel closed, ignore
    }
    return false;
  }
});

// Now import modules (listener is already registered above)
import { analyzeDocument, analyzeCookies } from './analyzer.js';
import { initializeBlocking, enableTrackerBlocking, disableTrackerBlocking, blockNonEssentialCookies as runCookieBlocker, autoDeclineCookies as runAutoDecline } from './blocker.js';
import { APIManager } from '../lib/api-manager.js';
import { logActivity } from '../lib/activity-log.js';

// Initialize API manager lazily (not at module level to avoid initialization errors)
let apiManager = null;

function getAPIManager() {
  if (!apiManager) {
    try {
      apiManager = new APIManager();
    } catch (error) {
      console.error('Failed to initialize API manager:', error);
      // Return a minimal fallback
      return null;
    }
  }
  return apiManager;
}

function normalizeDomain(domain) {
  if (!domain) return '';
  try {
    return domain.toLowerCase();
  } catch (_e) {
    return (domain || '').trim().toLowerCase();
  }
}

function domainMatchesCriticalList(domain, list = []) {
  const normalized = normalizeDomain(domain);
  if (!normalized) return false;
  return list.some((entry) => {
    const normalizedEntry = normalizeDomain(entry);
    return normalized === normalizedEntry || normalized.endsWith(`.${normalizedEntry}`);
  });
}

async function shouldAllowAutomation(action, domain, { force = false } = {}) {
  const normalizedDomain = normalizeDomain(domain);
  if (!normalizedDomain) {
    return { allowed: true };
  }

  const { autoDeclineConfirmations = true, criticalSiteList = [] } = await chrome.storage.local.get([
    'autoDeclineConfirmations',
    'criticalSiteList',
  ]);

  const isCritical = domainMatchesCriticalList(normalizedDomain, criticalSiteList);

  if (isCritical && autoDeclineConfirmations && !force) {
    await logActivity('automation_blocked', { action, domain: normalizedDomain, reason: 'critical_site' });
    return { allowed: false, reason: 'critical_site', domain: normalizedDomain };
  }

  if (isCritical && force) {
    await logActivity('automation_forced', { action, domain: normalizedDomain });
  }

  return { allowed: true, domain: normalizedDomain };
}

// Error handler for uncaught errors (only in service worker context)
if (typeof self !== 'undefined') {
  self.addEventListener('error', (event) => {
    console.error('Service worker error:', event.error);
  });

  self.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}

// Log that service worker is loading
console.log('Privacy Guard service worker loading...');

// Initialize on install
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    console.log('onInstalled triggered:', details.reason);
    
    // CRITICAL: Mark handlers as ready BEFORE opening onboarding
    // This ensures service worker is ready when user tries to use extension
    handlersReady = true;
    console.log('✅ Service worker ready for onboarding');
    
    if (details.reason === 'install') {
      // Set default preferences
      await chrome.storage.local.set({
        blockTrackers: false,
        blockNonEssentialCookies: false,
        autoDeclineCookies: false,
        autoDeclineConfirmations: true,
        enforceNoNetworkMode: false,
        criticalSiteList: [],
        analysisMode: 'hybrid',
        preferredApiProvider: 'auto',
      });

      // Small delay to ensure service worker is fully initialized
      await new Promise(resolve => setTimeout(resolve, 500));

      // Open onboarding page
      try {
        chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/onboarding.html') });
      } catch (error) {
        console.log('Could not open onboarding:', error);
      }
    }

    try {
      if (initializeBlocking) {
        await initializeBlocking();
      } else {
        console.warn('initializeBlocking not available');
      }
    } catch (error) {
      console.error('Error initializing blocking:', error);
    }
  } catch (error) {
    // Log but don't crash service worker
    console.error('Error in onInstalled:', error);
  }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('onStartup triggered');
  if (initializeBlocking) {
    initializeBlocking().catch(error => {
      console.error('Error in onStartup:', error);
    });
  }
});

// Keep service worker alive by listening to events
chrome.runtime.onConnect.addListener((port) => {
  console.log('Port connected:', port.name);
  port.onDisconnect.addListener(() => {
    console.log('Port disconnected:', port.name);
  });
});

// Log successful load
console.log('Privacy Guard service worker loaded successfully');

/**
 * Handle document analysis request
 */
async function handleAnalyzeDocument(payload) {
  try {
    const { url, text, mode, provider } = payload;
    if (!analyzeDocument) {
      throw new Error('Analyzer not loaded. Please reload extension.');
    }
    return await analyzeDocument({ url, text, mode, provider });
  } catch (error) {
    console.error('Error in handleAnalyzeDocument:', error);
    throw error;
  }
}

/**
 * Handle cookie analysis request
 */
async function handleAnalyzeCookies(payload) {
  try {
    const { tabId } = payload;
    if (typeof analyzeCookies !== 'function') {
      console.error('analyzeCookies is not a function:', typeof analyzeCookies);
      throw new Error('Analyzer not loaded. Please reload extension.');
    }
    return await analyzeCookies(tabId);
  } catch (error) {
    console.error('Error in handleAnalyzeCookies:', error);
    throw error;
  }
}

/**
 * Handle tracker blocking request
 */
async function handleBlockTrackers(payload) {
  const { enabled } = payload;
  await chrome.storage.local.set({ blockTrackers: enabled });
  
  if (enabled) {
    await enableTrackerBlocking();
  } else {
    await disableTrackerBlocking();
  }
}

/**
 * Handle cookie blocking request
 */
async function handleBlockCookies(payload) {
  const { enabled, domain, force = false } = payload;
  await chrome.storage.local.set({ blockNonEssentialCookies: enabled });

  if (!enabled || !domain) {
    return { allowed: true };
  }

  const guard = await shouldAllowAutomation('block_cookies', domain, { force });
  if (!guard.allowed) {
    return { allowed: false, reason: guard.reason, domain: guard.domain };
  }

  if (runCookieBlocker) {
    try {
      await runCookieBlocker(domain);
      await logActivity('automation_run', { action: 'block_cookies', domain: guard.domain || normalizeDomain(domain) });
    } catch (error) {
      console.error('Failed to run cookie blocker:', error);
      throw error;
    }
  }

  return { allowed: true };
}

/**
 * Handle auto-decline cookies request
 */
async function handleAutoDeclineCookies(payload) {
  const { tabId, force = false } = payload;
  if (!tabId) {
    throw new Error('Tab ID required');
  }

  let domain = '';
  try {
    const tab = await chrome.tabs.get(tabId);
    domain = new URL(tab.url).hostname;
  } catch (error) {
    console.warn('Unable to resolve tab domain for auto-decline:', error);
  }

  const guard = await shouldAllowAutomation('auto_decline', domain, { force });
  if (!guard.allowed) {
    return { allowed: false, reason: guard.reason, domain: guard.domain };
  }

  if (runAutoDecline) {
    await runAutoDecline(tabId);
    await logActivity('automation_run', { action: 'auto_decline', domain: guard.domain || normalizeDomain(domain) });
  } else {
    console.warn('autoDeclineCookies not available');
  }

  return { allowed: true };
}

/**
 * Handle dashboard data request
 */
async function handleGetDashboardData() {
  const { privacyGuardCache } = await chrome.storage.local.get('privacyGuardCache');
  const { privacyGuardHistory } = await chrome.storage.local.get('privacyGuardHistory') || {};
  
  const history = privacyGuardHistory || {};
  const sites = Object.keys(history);
  
  return {
    totalSites: sites.length,
    totalAnalyses: sites.length,
    averagePrivacyScore: calculateAveragePrivacyScore(history),
    totalTrackersBlocked: await getTotalTrackersBlocked(),
    riskDistribution: calculateRiskDistribution(history),
  };
}

function calculateAveragePrivacyScore(history) {
  const scores = Object.values(history)
    .map(entry => entry.privacy_score)
    .filter(score => typeof score === 'number');
  
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function calculateRiskDistribution(history) {
  const distribution = { Safe: 0, Watch: 0, Risky: 0 };
  
  for (const entry of Object.values(history)) {
    const risk = entry.risk || 'Watch';
    distribution[risk] = (distribution[risk] || 0) + 1;
  }
  
  return distribution;
}

async function getTotalTrackersBlocked() {
  const { trackerBlockCount } = await chrome.storage.local.get('trackerBlockCount');
  return trackerBlockCount || 0;
}

/**
 * Handle AI Q&A question
 */
async function handleAskQuestion(payload) {
  const { question, context, provider } = payload;
  
  const prompt = `Based on this privacy policy/terms analysis:\n\n${JSON.stringify(context, null, 2)}\n\nQuestion: ${question}\n\nProvide a clear, concise answer.`;
  
  try {
    const manager = getAPIManager();
    if (!manager) {
      throw new Error('API manager not available');
    }
    const result = await manager.analyze(prompt, provider);
    return {
      answer: result.tldr || result.bullets?.[0] || 'Unable to answer question.',
    };
  } catch (error) {
    throw new Error(`Failed to get answer: ${error.message}`);
  }
}

// Track navigation to update badge
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return; // Only main frame
  
  try {
    const tab = await chrome.tabs.get(details.tabId);
    const url = new URL(tab.url);
    
    // Check if this is a privacy/terms page
    const isPrivacyPage = /privacy|terms|cookie/i.test(url.pathname);
    
    if (isPrivacyPage) {
      chrome.action.setBadgeText({
        tabId: details.tabId,
        text: '!',
      });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    }
  } catch (error) {
    // Ignore errors (e.g., chrome:// pages)
  }
});

// Update badge with tracker count
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  
  try {
    const cookieData = await analyzeCookies(tabId);
    const trackerCount = cookieData.trackers?.length || 0;
    
    if (trackerCount > 0) {
      chrome.action.setBadgeText({
        tabId,
        text: trackerCount > 99 ? '99+' : String(trackerCount),
      });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    } else {
      chrome.action.setBadgeText({ tabId, text: '' });
    }
  } catch (error) {
    // Ignore errors
  }
});

// Helper to safely send response with timeout protection
function safeSendResponse(sendResponse, response, timeout = 25000) {
  if (!sendResponse) {
    console.warn('sendResponse is not available');
    return;
  }

  let responded = false;
  let timeoutId = null;
  
  // Set up timeout
  timeoutId = setTimeout(() => {
    if (!responded) {
      responded = true;
      try {
        const result = sendResponse({ success: false, error: 'Response timeout' });
        if (result === false) {
          // Channel already closed, that's fine
        }
      } catch (e) {
        // Channel already closed, ignore silently
      }
    }
  }, timeout);
  
  try {
    // Try to send response immediately
    const result = sendResponse(response);
    responded = true;
    if (timeoutId) clearTimeout(timeoutId);
    
    // If sendResponse returns false, the channel is already closed
    // This is expected in some cases (e.g., page navigated away)
    if (result === false) {
      // Channel closed - this is fine, don't log as error
    }
  } catch (error) {
    // Channel is closed or sendResponse threw an error
    if (!responded) {
      if (timeoutId) clearTimeout(timeoutId);
      // This is expected if the channel closes (e.g., page navigated)
      // Only log unexpected errors
      if (error && error.message && !error.message.includes('closed') && !error.message.includes('Extension context invalidated')) {
        console.warn('Could not send response:', error.message);
      }
    }
  }
}

// Define main message handler function (will be used once handlers are ready)
function mainMessageHandler(message, sender, sendResponse) {
  try {
    if (message.type === 'ANALYZE_DOCUMENT') {
      handleAnalyzeDocument(message.payload)
        .then(result => safeSendResponse(sendResponse, { success: true, ...result }))
        .catch(error => safeSendResponse(sendResponse, { success: false, error: error.message }));
      return true;
    }

    if (message.type === 'ANALYZE_COOKIES') {
      handleAnalyzeCookies(message.payload)
        .then(result => safeSendResponse(sendResponse, { success: true, ...result }))
        .catch(error => safeSendResponse(sendResponse, { success: false, error: error.message }));
      return true;
    }

    if (message.type === 'BLOCK_TRACKERS') {
      handleBlockTrackers(message.payload)
        .then(() => safeSendResponse(sendResponse, { success: true }))
        .catch(error => safeSendResponse(sendResponse, { success: false, error: error.message }));
      return true;
    }

    if (message.type === 'BLOCK_COOKIES') {
      handleBlockCookies(message.payload)
        .then(() => safeSendResponse(sendResponse, { success: true }))
        .catch(error => safeSendResponse(sendResponse, { success: false, error: error.message }));
      return true;
    }

    if (message.type === 'AUTO_DECLINE_COOKIES') {
      handleAutoDeclineCookies(message.payload)
        .then(() => safeSendResponse(sendResponse, { success: true }))
        .catch(error => safeSendResponse(sendResponse, { success: false, error: error.message }));
      return true;
    }

    if (message.type === 'GET_DASHBOARD_DATA') {
      handleGetDashboardData()
        .then(data => safeSendResponse(sendResponse, { success: true, data }))
        .catch(error => safeSendResponse(sendResponse, { success: false, error: error.message }));
      return true;
    }

    if (message.type === 'ASK_QUESTION') {
      handleAskQuestion(message.payload)
        .then(result => safeSendResponse(sendResponse, { success: true, ...result }))
        .catch(error => safeSendResponse(sendResponse, { success: false, error: error.message }));
      return true;
    }

    if (message.type === 'PROCESS_DOCUMENT') {
      handleAnalyzeDocument({
        url: message.payload?.url,
        text: message.payload?.text,
        mode: message.payload?.processLocally ? 'local' : 'hybrid',
        provider: 'auto',
      })
        .then(result => safeSendResponse(sendResponse, { success: true, summary: result, ...result }))
        .catch(error => safeSendResponse(sendResponse, { success: false, error: error.message }));
      return true;
    }

    if (message.type === 'HIGHLIGHT_TEXT') {
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'HIGHLIGHT_TEXT',
          payload: message.payload,
        }).catch(() => {});
      }
      safeSendResponse(sendResponse, { success: true });
      return true;
    }

    if (message.type === 'HIGHLIGHT_RED_FLAGS') {
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'HIGHLIGHT_RED_FLAGS',
          payload: message.payload,
        }).catch(() => {});
      }
      safeSendResponse(sendResponse, { success: true });
      return true;
    }

    if (message.type === 'CLEAR_HIGHLIGHTS') {
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'CLEAR_HIGHLIGHTS',
        }).catch(() => {});
      }
      safeSendResponse(sendResponse, { success: true });
      return true;
    }

    if (message.type === 'OPEN_POPUP') {
      safeSendResponse(sendResponse, { success: true });
      return true;
    }

    if (message.type === 'TEST') {
      safeSendResponse(sendResponse, { success: true, message: 'Service worker is running', timestamp: Date.now() });
      return true;
    }

    if (message.type === 'PAGE_TYPE_DETECTED') {
      // Log page type detection (for analytics/debugging)
      console.log('Page type detected:', message.payload.types);
      safeSendResponse(sendResponse, { success: true });
      return true;
    }

    if (message.type === 'PRIVACY_ISSUES_DETECTED') {
      // Log privacy issues found on page
      console.log('Privacy issues detected:', message.payload.issues);
      // Could store this for dashboard/analytics
      safeSendResponse(sendResponse, { success: true });
      return true;
    }

    if (message.type === 'GET_COOKIES') {
      // Get all cookies for the current domain
      chrome.cookies.getAll({})
        .then(cookies => safeSendResponse(sendResponse, { success: true, cookies }))
        .catch(error => safeSendResponse(sendResponse, { success: false, error: error.message }));
      return true;
    }

    if (message.type === 'COOKIE_WARNING_SHOWN') {
      // Log cookie warning shown (for analytics)
      console.log('Cookie warning shown:', message.payload);
      safeSendResponse(sendResponse, { success: true });
      return true;
    }

    if (message.type === 'PAGE_RISK_SHOWN') {
      // Log page risk badge shown (for analytics)
      console.log('Page risk badge shown:', message.payload);
      safeSendResponse(sendResponse, { success: true });
      return true;
    }

    safeSendResponse(sendResponse, { success: false, error: `Unknown message type: ${message.type}` });
    return true;
  } catch (error) {
    console.error('Error in message handler:', error);
    safeSendResponse(sendResponse, { success: false, error: error.message });
    return true;
  }
}

// Mark handlers as ready (this happens after all handler functions are defined)
// Note: This might be set earlier in onInstalled, but that's fine - it ensures readiness
if (!handlersReady) {
  handlersReady = true;
  console.log('✅ Service worker fully initialized and ready');
}

