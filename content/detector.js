/**
 * Document type detector
 * Identifies Terms & Conditions, Privacy Policies, Cookie pages
 */

// Cache native DOM methods before websites can modify them (use shared namespace to avoid conflicts)
if (typeof window.PrivacyGuardNative === 'undefined') {
  window.PrivacyGuardNative = {
    createElement: Document.prototype.createElement,
    appendChild: Node.prototype.appendChild,
  };
}
// Use var to allow redeclaration across multiple content scripts
var nativeCreateElement = window.PrivacyGuardNative.createElement.bind(document);
var nativeAppendChild = window.PrivacyGuardNative.appendChild;

/**
 * Detect document type on current page
 * Also scans for privacy issues on ANY page
 */
function detectPageType() {
  const url = window.location.href;
  const pageText = document.body?.textContent || '';
  
  const types = detectDocumentTypeLocal(url, pageText);
  
  // Always scan for privacy issues, not just on T&C/Privacy pages
  if (types.length > 0) {
    // Notify background script (fire and forget - no response needed)
    chrome.runtime.sendMessage({
      type: 'PAGE_TYPE_DETECTED',
      payload: {
        url,
        types,
        timestamp: Date.now(),
      },
    }).catch(() => {
      // Ignore errors - this is just a notification
    });

    // Show floating badge
    showDetectionBadge(types);
  }
  
  // Always scan for privacy issues on any page
  scanPageForPrivacyIssues();
}

/**
 * Scan current page for privacy issues (cookies, trackers, etc.)
 * Works on ANY page, not just T&C/Privacy Policy pages
 */
function scanPageForPrivacyIssues() {
  const url = window.location.href;
  const issues = [];
  
  // Check for tracking scripts
  const scripts = document.querySelectorAll('script[src]');
  const trackingDomains = [
    'google-analytics.com',
    'googletagmanager.com',
    'facebook.net',
    'doubleclick.net',
    'scorecardresearch.com',
    'quantserve.com',
    'adservice.google',
    'adsystem.amazon',
  ];
  
  scripts.forEach(script => {
    const src = script.src.toLowerCase();
    trackingDomains.forEach(domain => {
      if (src.includes(domain)) {
        issues.push({
          type: 'tracker',
          domain: domain,
          severity: 'medium',
        });
      }
    });
  });
  
  // Check for iframes (often used for tracking)
  const iframes = document.querySelectorAll('iframe[src]');
  iframes.forEach(iframe => {
    const src = iframe.src.toLowerCase();
    trackingDomains.forEach(domain => {
      if (src.includes(domain)) {
        issues.push({
          type: 'tracker',
          domain: domain,
          severity: 'medium',
        });
      }
    });
  });
  
  // Check for data collection forms
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input[type="email"], input[type="tel"], input[name*="email"], input[name*="phone"]');
    if (inputs.length > 0) {
      issues.push({
        type: 'data_collection',
        element: 'form',
        severity: 'low',
      });
    }
  });
  
  // If privacy issues found, notify background and show badge
  if (issues.length > 0) {
    // Notify background script (fire and forget - no response needed)
    chrome.runtime.sendMessage({
      type: 'PRIVACY_ISSUES_DETECTED',
      payload: {
        url,
        issues,
        timestamp: Date.now(),
      },
    }).catch(() => {
      // Ignore errors - this is just a notification
    });
    
    // Show privacy warning badge
    showPrivacyWarningBadge(issues);
  }
}

/**
 * Show privacy warning badge for any page with privacy issues
 */
function showPrivacyWarningBadge(issues) {
  // Remove existing badge
  const existing = document.getElementById('privacy-guard-warning-badge');
  if (existing) existing.remove();
  
  const trackerCount = issues.filter(i => i.type === 'tracker').length;
  const dataCollectionCount = issues.filter(i => i.type === 'data_collection').length;
  
  let warningText = 'Privacy issues detected: ';
  const warnings = [];
  if (trackerCount > 0) warnings.push(`${trackerCount} tracker${trackerCount > 1 ? 's' : ''}`);
  if (dataCollectionCount > 0) warnings.push(`${dataCollectionCount} data collection form${dataCollectionCount > 1 ? 's' : ''}`);
  warningText += warnings.join(', ');
  
  // Use cached native DOM methods
  let badge;
  try {
    badge = nativeCreateElement('div');
  } catch (error) {
    badge = document.createElement('div');
  }
  
  badge.id = 'privacy-guard-warning-badge';
  badge.className = 'privacy-guard-badge privacy-guard-warning';
  badge.innerHTML = `
    <span class="privacy-guard-badge-icon">⚠️</span>
    <span class="privacy-guard-badge-text">${warningText}</span>
    <button class="privacy-guard-badge-close" aria-label="Close">×</button>
  `;
  
  const closeBtn = badge.querySelector('.privacy-guard-badge-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      badge.remove();
    });
  }
  
  // Wait for body to be available
  if (!document.body) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        try {
          nativeAppendChild.call(document.body, badge);
        } catch (error) {
          document.body.appendChild(badge);
        }
      });
      return;
    }
  }
  
  try {
    nativeAppendChild.call(document.body, badge);
  } catch (error) {
    document.body.appendChild(badge);
  }
  
  // Auto-hide after 15 seconds
  setTimeout(() => {
    if (badge.parentNode) {
      badge.style.opacity = '0';
      setTimeout(() => badge.remove(), 300);
    }
  }, 15000);
}

/**
 * Show floating detection badge
 */
function showDetectionBadge(types) {
  // Remove existing badge
  const existing = document.getElementById('privacy-guard-badge');
  if (existing) existing.remove();

  // Use cached native DOM methods to avoid conflicts with modified prototypes
  let badge;
  try {
    badge = nativeCreateElement('div');
  } catch (error) {
    badge = document.createElement('div');
  }
  
  badge.id = 'privacy-guard-badge';
  badge.className = 'privacy-guard-badge';
  badge.innerHTML = `
    <span class="privacy-guard-badge-icon">🛡️</span>
    <span class="privacy-guard-badge-text">Privacy Guard detected: ${types.join(', ')}</span>
    <button class="privacy-guard-badge-close" aria-label="Close">×</button>
  `;

  const closeBtn = badge.querySelector('.privacy-guard-badge-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      badge.remove();
    });
  }

  // Wait for body to be available (in case script runs early)
  if (!document.body) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        try {
          nativeAppendChild.call(document.body, badge);
        } catch (error) {
          document.body.appendChild(badge);
        }
      });
      return;
    }
  }
  
  try {
    nativeAppendChild.call(document.body, badge);
  } catch (error) {
    document.body.appendChild(badge);
  }

  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (badge.parentNode) {
      badge.style.opacity = '0';
      setTimeout(() => badge.remove(), 300);
    }
  }, 10000);
}

/**
 * Local document type detection (inline version of patterns.js)
 */
function detectDocumentTypeLocal(url, pageText) {
  const urlLower = url.toLowerCase();
  const textLower = pageText.toLowerCase();
  const types = [];

  const termsPatterns = [
    /terms\s+of\s+service/i,
    /terms\s+and\s+conditions/i,
    /terms\s+of\s+use/i,
    /user\s+agreement/i,
  ];

  const privacyPatterns = [
    /privacy\s+policy/i,
    /privacy\s+notice/i,
    /data\s+protection/i,
  ];

  const cookiePatterns = [
    /cookie\s+policy/i,
    /cookie\s+consent/i,
  ];

  if (termsPatterns.some(p => p.test(urlLower)) || termsPatterns.some(p => p.test(textLower))) {
    types.push('terms');
  }
  if (privacyPatterns.some(p => p.test(urlLower)) || privacyPatterns.some(p => p.test(textLower))) {
    types.push('privacy');
  }
  if (cookiePatterns.some(p => p.test(urlLower)) || cookiePatterns.some(p => p.test(textLower))) {
    types.push('cookies');
  }

  return [...new Set(types)];
}

// Run detection when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectPageType);
} else {
  detectPageType();
}

// Re-detect on SPA navigation (observe document, not body, so it always works)
let lastUrl = location.href;
let urlObserver = null;

function setupUrlObserver() {
  if (urlObserver) return; // Already set up
  
  try {
    urlObserver = new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(detectPageType, 1000);
      }
    });
    
    // Observe document instead of body - document always exists
    urlObserver.observe(document, { subtree: true, childList: true });
  } catch (error) {
    console.warn('Failed to setup URL observer:', error);
  }
}

// Set up observer when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupUrlObserver, { once: true });
} else {
  setupUrlObserver();
}

