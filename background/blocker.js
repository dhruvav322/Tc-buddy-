/**
 * Cookie and tracker blocking system
 */

// Tracker domains will be loaded dynamically
let trackerDomains = null;

async function loadTrackerDomains() {
  if (trackerDomains) return trackerDomains;
  const response = await fetch(chrome.runtime.getURL('data/tracker-domains.json'));
  trackerDomains = await response.json();
  return trackerDomains;
}

/**
 * Initialize blocking rules
 */
export async function initializeBlocking() {
  try {
    const { blockTrackers, blockNonEssentialCookies } = await chrome.storage.local.get([
      'blockTrackers',
      'blockNonEssentialCookies',
    ]);

    if (blockTrackers) {
      try {
        await enableTrackerBlocking();
      } catch (error) {
        console.error('Error enabling tracker blocking:', error);
      }
    }

    if (blockNonEssentialCookies) {
      try {
        await enableCookieBlocking();
      } catch (error) {
        console.error('Error enabling cookie blocking:', error);
      }
    }
  } catch (error) {
    console.error('Error in initializeBlocking:', error);
    // Don't throw - allow service worker to continue
  }
}

/**
 * Enable tracker blocking
 */
export async function enableTrackerBlocking() {
  // Update declarative net request rules
  const rules = await buildBlockingRules();
  
  try {
    // Remove existing rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    if (existingRules.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRules.map(r => r.id),
      });
    }

    // Add new rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules,
    });
  } catch (error) {
    console.error('Failed to enable tracker blocking:', error);
  }
}

/**
 * Disable tracker blocking
 */
export async function disableTrackerBlocking() {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    if (existingRules.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRules.map(r => r.id),
      });
    }
  } catch (error) {
    console.error('Failed to disable tracker blocking:', error);
  }
}

/**
 * Build blocking rules from tracker domains
 */
async function buildBlockingRules() {
  const rules = [];
  let ruleId = 1;

  const domains = await loadTrackerDomains();
  
  // Block all tracker categories
  const allTrackers = [
    ...domains.analytics,
    ...domains.advertising,
    ...domains.social,
    ...domains.fingerprinting,
    ...domains.data_collection,
  ];

  for (const domain of allTrackers) {
    rules.push({
      id: ruleId++,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: `*://*.${domain}/*`,
        resourceTypes: ['script', 'image', 'xmlhttprequest', 'sub_frame'],
      },
    });
  }

  return rules;
}

/**
 * Block non-essential cookies
 */
export async function blockNonEssentialCookies(domain) {
  try {
    const cookies = await chrome.cookies.getAll({ domain });
    
    for (const cookie of cookies) {
      // Check if cookie is non-essential
      if (isNonEssentialCookie(cookie)) {
        const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
        await chrome.cookies.remove({
          url,
          name: cookie.name,
        });
      }
    }
  } catch (error) {
    console.error('Failed to block cookies:', error);
  }
}

/**
 * Check if cookie is non-essential
 */
function isNonEssentialCookie(cookie) {
  const name = cookie.name.toLowerCase();
  
  // Essential cookies (don't block)
  if (name.includes('session') || 
      name.includes('auth') || 
      name.includes('token') ||
      name.includes('csrf')) {
    return false;
  }

  // Non-essential (block)
  if (name.includes('_ga') ||
      name.includes('_gid') ||
      name.includes('_fbp') ||
      name.includes('_fbc') ||
      name.includes('tracking') ||
      name.includes('analytics')) {
    return true;
  }

  // Default: block unknown cookies
  return true;
}

/**
 * Auto-decline cookie banners
 */
export async function autoDeclineCookies(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: declineCookieBanner,
    });
  } catch (error) {
    console.error('Failed to auto-decline cookies:', error);
  }
}

/**
 * Function injected into page to decline cookie banner
 */
function declineCookieBanner() {
  const declineTexts = [
    'decline',
    'reject',
    'reject all',
    'necessary only',
    'essential only',
    'refuse',
    'deny',
    'no thanks',
  ];

  // Find all buttons
  const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
  
  for (const button of buttons) {
    const text = button.textContent.toLowerCase().trim();
    if (declineTexts.some(declineText => text.includes(declineText))) {
      button.click();
      return true;
    }
  }

  return false;
}

/**
 * Get blocking statistics
 */
export async function getBlockingStats() {
  try {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    return {
      rulesActive: rules.length,
      trackersBlocked: rules.length,
    };
  } catch (error) {
    console.error('Failed to get blocking stats:', error);
    return { rulesActive: 0, trackersBlocked: 0 };
  }
}

