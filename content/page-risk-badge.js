/**
 * Page Risk Badge
 * Shows a persistent badge indicating the privacy risk level of the current page
 * Educates users about privacy risks without them needing to click anything
 */

// Cache native DOM methods
if (typeof window.PrivacyGuardNative === 'undefined') {
  window.PrivacyGuardNative = {
    createElement: Document.prototype.createElement.bind(document),
    appendChild: Node.prototype.appendChild,
    querySelector: Document.prototype.querySelector.bind(document),
    querySelectorAll: Document.prototype.querySelectorAll.bind(document),
    addEventListener: EventTarget.prototype.addEventListener,
  };
}

const nativeCreateElement = window.PrivacyGuardNative.createElement;
const nativeAppendChild = window.PrivacyGuardNative.appendChild;
const nativeQuerySelector = window.PrivacyGuardNative.querySelector;
const nativeQuerySelectorAll = window.PrivacyGuardNative.querySelectorAll;
const nativeAddEventListener = window.PrivacyGuardNative.addEventListener;

let currentBadge = null;
let badgeTimeout = null;

/**
 * Quick privacy scan of current page
 */
async function quickPrivacyScan() {
  const risks = {
    score: 100,
    level: 'SAFE',
    issues: [],
    trackers: 0,
    cookies: 0,
    thirdParty: 0
  };

  try {
    // 1. Check for known tracker domains in scripts
    const trackerDomains = [
      'google-analytics', 'googletagmanager', 'doubleclick',
      'facebook.net', 'connect.facebook', 'fbcdn',
      'twitter.com/widgets', 'platform.twitter',
      'ads.', 'ad.', 'analytics', 'tracking', 'tracker',
      'adservice', 'advertising', 'pixel', 'tag'
    ];

    const scripts = Array.from(nativeQuerySelectorAll.call(document, 'script[src]'));
    const trackerScripts = scripts.filter(s => {
      const src = (s.src || '').toLowerCase();
      return trackerDomains.some(d => src.includes(d));
    });

    risks.trackers = trackerScripts.length;

    // 2. Check for third-party resources
    const currentDomain = window.location.hostname;
    const allScripts = scripts.filter(s => {
      const src = s.src || '';
      try {
        const url = new URL(src);
        return url.hostname !== currentDomain;
      } catch {
        return false;
      }
    });

    risks.thirdParty = allScripts.length;

    // 3. Check for cookie banner (indicates tracking)
    const cookieBannerSelectors = [
      '[class*="cookie"]', '[id*="cookie"]',
      '[class*="consent"]', '[id*="consent"]',
      '[class*="gdpr"]', '[id*="gdpr"]',
      '[aria-label*="cookie"]', '[aria-label*="consent"]'
    ];

    const hasCookieBanner = cookieBannerSelectors.some(selector => {
      try {
        return nativeQuerySelector.call(document, selector) !== null;
      } catch {
        return false;
      }
    });

    if (hasCookieBanner) {
      risks.issues.push('Cookie banner detected - site wants to track you');
      risks.score -= 15;
    }

    // 4. Calculate risk based on trackers
    if (risks.trackers >= 10) {
      risks.issues.push(`${risks.trackers} tracking scripts detected`);
      risks.score -= 30;
      risks.level = 'DANGER';
    } else if (risks.trackers >= 5) {
      risks.issues.push(`${risks.trackers} tracking scripts detected`);
      risks.score -= 20;
      risks.level = 'WARNING';
    } else if (risks.trackers >= 2) {
      risks.issues.push(`${risks.trackers} tracking scripts found`);
      risks.score -= 10;
      risks.level = 'CAUTION';
    }

    // 5. Check for known privacy-invasive patterns
    const pageText = document.body?.textContent || '';
    const privacyPatterns = [
      { text: 'we sell your data', score: -40, issue: 'Site may sell your data' },
      { text: 'share with partners', score: -15, issue: 'Shares data with third parties' },
      { text: 'personalized ads', score: -10, issue: 'Uses targeted advertising' },
      { text: 'track your activity', score: -10, issue: 'Tracks your activity' },
    ];

    privacyPatterns.forEach(({ text, score, issue }) => {
      if (pageText.toLowerCase().includes(text)) {
        risks.score += score;
        risks.issues.push(issue);
      }
    });

    // 6. Final risk level calculation
    if (risks.score >= 80) {
      risks.level = 'SAFE';
    } else if (risks.score >= 60) {
      risks.level = 'CAUTION';
    } else if (risks.score >= 40) {
      risks.level = 'WARNING';
    } else {
      risks.level = 'DANGER';
    }

    return risks;

  } catch (error) {
    console.error('Quick privacy scan failed:', error);
    return {
      score: 70,
      level: 'CAUTION',
      issues: ['Unable to fully scan page'],
      trackers: 0,
      cookies: 0,
      thirdParty: 0
    };
  }
}

/**
 * Create risk badge UI
 */
function createRiskBadge(risks) {
  // Remove existing badge if any
  if (currentBadge) {
    currentBadge.remove();
    currentBadge = null;
  }

  const badge = nativeCreateElement.call(document, 'div');
  badge.className = 'privacy-guard-risk-badge';
  badge.setAttribute('data-privacy-guard', 'risk-badge');

  const config = {
    SAFE: {
      emoji: '✅',
      color: '#22c55e',
      bg: '#f0fdf4',
      title: 'Safe',
      message: 'This page appears privacy-friendly'
    },
    CAUTION: {
      emoji: 'ℹ️',
      color: '#3b82f6',
      bg: '#eff6ff',
      title: 'Caution',
      message: 'Some tracking detected'
    },
    WARNING: {
      emoji: '⚠️',
      color: '#f59e0b',
      bg: '#fffbeb',
      title: 'Warning',
      message: 'Significant tracking found'
    },
    DANGER: {
      emoji: '🚨',
      color: '#dc2626',
      bg: '#fef2f2',
      title: 'Danger',
      message: 'Heavy tracking detected'
    }
  };

  const style = config[risks.level];

  badge.innerHTML = `
    <div class="privacy-guard-badge-content">
      <div class="privacy-guard-badge-icon">${style.emoji}</div>
      <div class="privacy-guard-badge-text">
        <strong>${style.title}</strong>
        <span>${style.message}</span>
      </div>
      <button class="privacy-guard-badge-expand">ⓘ</button>
    </div>
    
    <div class="privacy-guard-badge-details" style="display: none;">
      <div class="privacy-guard-badge-stats">
        <div class="privacy-guard-stat">
          <span class="privacy-guard-stat-value">${risks.trackers}</span>
          <span class="privacy-guard-stat-label">Trackers</span>
        </div>
        <div class="privacy-guard-stat">
          <span class="privacy-guard-stat-value">${risks.thirdParty}</span>
          <span class="privacy-guard-stat-label">3rd Party</span>
        </div>
        <div class="privacy-guard-stat">
          <span class="privacy-guard-stat-value">${risks.score}</span>
          <span class="privacy-guard-stat-label">Privacy Score</span>
        </div>
      </div>
      
      ${risks.issues.length > 0 ? `
        <div class="privacy-guard-badge-issues">
          <strong>Issues Found:</strong>
          <ul>
            ${risks.issues.slice(0, 3).map(issue => `<li>${issue}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      <button class="privacy-guard-badge-action">
        🛡️ See Full Analysis
      </button>
    </div>

    <button class="privacy-guard-badge-close">×</button>
  `;

  // Add styles
  if (!document.getElementById('privacy-guard-risk-badge-styles')) {
    const styles = nativeCreateElement.call(document, 'style');
    styles.id = 'privacy-guard-risk-badge-styles';
    styles.textContent = `
      .privacy-guard-risk-badge {
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        z-index: 2147483645 !important;
        background: ${style.bg} !important;
        border: 2px solid ${style.color} !important;
        border-radius: 12px !important;
        padding: 16px !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        max-width: 350px !important;
        animation: privacy-guard-badge-slide-in 0.4s ease-out !important;
      }

      @keyframes privacy-guard-badge-slide-in {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .privacy-guard-badge-content {
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
      }

      .privacy-guard-badge-icon {
        font-size: 24px !important;
        line-height: 1 !important;
      }

      .privacy-guard-badge-text {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 2px !important;
      }

      .privacy-guard-badge-text strong {
        font-size: 15px !important;
        color: #111827 !important;
        font-weight: 700 !important;
      }

      .privacy-guard-badge-text span {
        font-size: 13px !important;
        color: #6b7280 !important;
      }

      .privacy-guard-badge-expand {
        background: white !important;
        border: 1px solid #d1d5db !important;
        border-radius: 50% !important;
        width: 24px !important;
        height: 24px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        font-size: 14px !important;
        color: ${style.color} !important;
        font-weight: bold !important;
        transition: all 0.2s !important;
      }

      .privacy-guard-badge-expand:hover {
        background: ${style.color} !important;
        color: white !important;
        transform: scale(1.1) !important;
      }

      .privacy-guard-badge-details {
        margin-top: 16px !important;
        padding-top: 16px !important;
        border-top: 2px solid #e5e7eb !important;
      }

      .privacy-guard-badge-stats {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 12px !important;
        margin-bottom: 16px !important;
      }

      .privacy-guard-stat {
        text-align: center !important;
        padding: 8px !important;
        background: white !important;
        border-radius: 8px !important;
      }

      .privacy-guard-stat-value {
        display: block !important;
        font-size: 20px !important;
        font-weight: 700 !important;
        color: ${style.color} !important;
      }

      .privacy-guard-stat-label {
        display: block !important;
        font-size: 11px !important;
        color: #6b7280 !important;
        margin-top: 4px !important;
      }

      .privacy-guard-badge-issues {
        background: white !important;
        padding: 12px !important;
        border-radius: 8px !important;
        margin-bottom: 12px !important;
        font-size: 13px !important;
        color: #374151 !important;
      }

      .privacy-guard-badge-issues strong {
        display: block !important;
        margin-bottom: 8px !important;
        color: #111827 !important;
      }

      .privacy-guard-badge-issues ul {
        margin: 0 !important;
        padding-left: 20px !important;
        list-style: disc !important;
      }

      .privacy-guard-badge-issues li {
        margin: 4px 0 !important;
        line-height: 1.4 !important;
      }

      .privacy-guard-badge-action {
        width: 100% !important;
        padding: 10px !important;
        background: ${style.color} !important;
        color: white !important;
        border: none !important;
        border-radius: 8px !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
        font-family: inherit !important;
      }

      .privacy-guard-badge-action:hover {
        opacity: 0.9 !important;
        transform: translateY(-1px) !important;
      }

      .privacy-guard-badge-close {
        position: absolute !important;
        top: 8px !important;
        right: 8px !important;
        background: transparent !important;
        border: none !important;
        font-size: 24px !important;
        color: #9ca3af !important;
        cursor: pointer !important;
        line-height: 1 !important;
        padding: 4px 8px !important;
        transition: color 0.2s !important;
      }

      .privacy-guard-badge-close:hover {
        color: #374151 !important;
      }

      /* Minimize badge after initial view */
      .privacy-guard-risk-badge.minimized {
        padding: 12px !important;
      }

      .privacy-guard-risk-badge.minimized .privacy-guard-badge-text span {
        display: none !important;
      }

      .privacy-guard-risk-badge.minimized .privacy-guard-badge-expand {
        display: none !important;
      }
    `;
    nativeAppendChild.call(document.head, styles);
  }

  // Add event listeners
  const expandBtn = badge.querySelector('.privacy-guard-badge-expand');
  const detailsDiv = badge.querySelector('.privacy-guard-badge-details');
  const actionBtn = badge.querySelector('.privacy-guard-badge-action');
  const closeBtn = badge.querySelector('.privacy-guard-badge-close');

  let isExpanded = false;

  nativeAddEventListener.call(expandBtn, 'click', () => {
    isExpanded = !isExpanded;
    detailsDiv.style.display = isExpanded ? 'block' : 'none';
    expandBtn.textContent = isExpanded ? '✕' : 'ⓘ';
  });

  nativeAddEventListener.call(actionBtn, 'click', () => {
    // Open extension popup
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP' }).catch(() => {});
  });

  nativeAddEventListener.call(closeBtn, 'click', () => {
    badge.style.animation = 'privacy-guard-badge-slide-out 0.3s ease-in';
    setTimeout(() => badge.remove(), 300);
  });

  // Auto-minimize after 8 seconds
  badgeTimeout = setTimeout(() => {
    if (!isExpanded) {
      badge.classList.add('minimized');
    }
  }, 8000);

  nativeAppendChild.call(document.body, badge);
  currentBadge = badge;

  // Log event
  chrome.runtime.sendMessage({
    type: 'PAGE_RISK_SHOWN',
    payload: {
      url: window.location.href,
      level: risks.level,
      score: risks.score,
      trackers: risks.trackers
    }
  }).catch(() => {});
}

/**
 * Initialize page risk badge
 */
async function initPageRiskBadge() {
  // Wait for page to be somewhat loaded
  if (document.readyState === 'loading') {
    return;
  }

  console.log('🛡️ Privacy Guard: Scanning page for privacy risks...');

  const risks = await quickPrivacyScan();
  
  // Only show badge if there are risks or tracking detected
  if (risks.level !== 'SAFE' || risks.trackers > 0) {
    createRiskBadge(risks);
  }
}

// Start badge when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initPageRiskBadge, 2000); // Wait 2s for scripts to load
  });
} else {
  setTimeout(initPageRiskBadge, 2000);
}

