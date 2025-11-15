/**
 * Cookie Banner Protector
 * Warns users BEFORE they click "Accept All" and shows them what they're giving up
 */

// Cache native DOM methods
if (typeof window.PrivacyGuardNative === 'undefined') {
  window.PrivacyGuardNative = {
    createElement: Document.prototype.createElement.bind(document),
    appendChild: Node.prototype.appendChild,
    insertBefore: Node.prototype.insertBefore,
    querySelector: Document.prototype.querySelector.bind(document),
    querySelectorAll: Document.prototype.querySelectorAll.bind(document),
    addEventListener: EventTarget.prototype.addEventListener,
  };
}

const nativeCreateElement = window.PrivacyGuardNative.createElement;
const nativeAppendChild = window.PrivacyGuardNative.appendChild;
const nativeInsertBefore = window.PrivacyGuardNative.insertBefore;
const nativeQuerySelector = window.PrivacyGuardNative.querySelector;
const nativeQuerySelectorAll = window.PrivacyGuardNative.querySelectorAll;
const nativeAddEventListener = window.PrivacyGuardNative.addEventListener;

/**
 * Detect "Accept All" buttons on cookie banners
 */
function detectAcceptAllButtons() {
  const acceptPatterns = [
    // English
    /accept\s*all/i,
    /allow\s*all/i,
    /agree\s*(to\s*)?all/i,
    /consent\s*all/i,
    /ok/i,
    /i\s*agree/i,
    /got\s*it/i,
    /understood/i,
    
    // Common button text
    /^(accept|allow|agree|ok|yes)$/i,
  ];

  const buttons = Array.from(nativeQuerySelectorAll.call(document, 'button, a[role="button"], div[role="button"]'));
  const dangerousButtons = [];

  for (const button of buttons) {
    const text = (button.textContent || button.innerText || '').trim();
    const ariaLabel = button.getAttribute('aria-label') || '';
    const title = button.getAttribute('title') || '';
    const fullText = `${text} ${ariaLabel} ${title}`.toLowerCase();

    // Check if it matches "accept all" patterns
    const isAcceptAll = acceptPatterns.some(pattern => pattern.test(fullText));
    
    // Check if it's part of a cookie banner (look for parent with cookie-related text)
    const parent = button.closest('[class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"], [class*="banner"], [id*="banner"], [class*="gdpr"], [id*="gdpr"]');
    
    if (isAcceptAll && parent) {
      dangerousButtons.push({
        button,
        text,
        parent,
      });
    }
  }

  return dangerousButtons;
}

/**
 * Analyze what the user is giving up
 */
async function analyzePrivacyImpact() {
  try {
    // Get all cookies that will be set
    const allCookies = await chrome.runtime.sendMessage({ type: 'GET_COOKIES' });
    
    // Estimate tracking impact
    const trackerDomains = [
      'google', 'facebook', 'doubleclick', 'analytics', 'ads',
      'tracking', 'twitter', 'linkedin', 'pinterest', 'tiktok'
    ];
    
    let trackingCookies = 0;
    if (allCookies && allCookies.cookies) {
      trackingCookies = allCookies.cookies.filter(c => 
        trackerDomains.some(d => c.domain.includes(d))
      ).length;
    }

    // Detect third-party scripts
    const scripts = Array.from(nativeQuerySelectorAll.call(document, 'script[src]'));
    const thirdPartyScripts = scripts.filter(s => {
      const src = s.src || '';
      const currentDomain = window.location.hostname;
      return src && !src.includes(currentDomain);
    });

    // Check for common trackers
    const trackerScripts = thirdPartyScripts.filter(s => {
      const src = (s.src || '').toLowerCase();
      return trackerDomains.some(d => src.includes(d));
    });

    return {
      estimated_cookies: Math.max(20, trackingCookies || 30), // Estimate if we can't count
      third_party_scripts: thirdPartyScripts.length,
      known_trackers: trackerScripts.length,
      will_track_browsing: trackerScripts.length > 0,
      will_profile_you: trackerScripts.length > 2,
      risk_level: trackerScripts.length >= 5 ? 'HIGH' : trackerScripts.length >= 2 ? 'MEDIUM' : 'LOW'
    };
  } catch (error) {
    console.error('Privacy impact analysis failed:', error);
    // Return conservative estimate
    return {
      estimated_cookies: 30,
      third_party_scripts: 10,
      known_trackers: 5,
      will_track_browsing: true,
      will_profile_you: true,
      risk_level: 'MEDIUM'
    };
  }
}

/**
 * Create warning overlay on "Accept All" button
 */
function createWarningOverlay(buttonInfo, privacyImpact) {
  const { button, parent } = buttonInfo;
  
  // Check if warning already exists
  if (button.hasAttribute('data-privacy-guard-warned')) {
    return;
  }
  
  button.setAttribute('data-privacy-guard-warned', 'true');

  // Create warning container
  const warning = nativeCreateElement.call(document, 'div');
  warning.className = 'privacy-guard-cookie-warning';
  warning.setAttribute('data-privacy-guard', 'warning');
  
  // Style based on risk level
  const riskColors = {
    HIGH: '#dc2626',
    MEDIUM: '#f59e0b',
    LOW: '#3b82f6'
  };
  
  const riskEmojis = {
    HIGH: '🚨',
    MEDIUM: '⚠️',
    LOW: 'ℹ️'
  };

  warning.innerHTML = `
    <div class="privacy-guard-warning-content">
      <div class="privacy-guard-warning-header">
        <span class="privacy-guard-warning-icon">${riskEmojis[privacyImpact.risk_level]}</span>
        <strong>Wait! Think Before You Click</strong>
      </div>
      
      <div class="privacy-guard-warning-body">
        <p class="privacy-guard-warning-title">By clicking "Accept All" you're giving up:</p>
        
        <ul class="privacy-guard-warning-list">
          <li>📊 <strong>${privacyImpact.estimated_cookies}+ tracking cookies</strong> will follow you across websites</li>
          ${privacyImpact.will_track_browsing ? '<li>👁️ <strong>Your browsing history</strong> will be tracked and recorded</li>' : ''}
          ${privacyImpact.will_profile_you ? '<li>🎯 <strong>Your profile will be built</strong> for targeted advertising</li>' : ''}
          <li>📤 <strong>${privacyImpact.third_party_scripts} third-party companies</strong> will get your data</li>
          ${privacyImpact.known_trackers > 0 ? `<li>🔍 <strong>${privacyImpact.known_trackers} known trackers</strong> detected (Google, Facebook, etc.)</li>` : ''}
        </ul>

        <div class="privacy-guard-warning-tip">
          <strong>💡 Better Choice:</strong> Click "Reject All" or "Necessary Only" instead
        </div>
      </div>

      <div class="privacy-guard-warning-actions">
        <button class="privacy-guard-btn privacy-guard-btn-safe" data-action="find-decline">
          ✅ Find "Decline All" for Me
        </button>
        <button class="privacy-guard-btn privacy-guard-btn-dismiss" data-action="dismiss">
          I Understand the Risk
        </button>
      </div>
    </div>
  `;

  // Add styles
  if (!document.getElementById('privacy-guard-cookie-warning-styles')) {
    const styles = nativeCreateElement.call(document, 'style');
    styles.id = 'privacy-guard-cookie-warning-styles';
    styles.textContent = `
      .privacy-guard-cookie-warning {
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        z-index: 2147483647 !important;
        background: white !important;
        border-radius: 12px !important;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
        max-width: 500px !important;
        width: 90% !important;
        padding: 0 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        animation: privacy-guard-slide-in 0.3s ease-out !important;
      }

      @keyframes privacy-guard-slide-in {
        from {
          opacity: 0;
          transform: translate(-50%, -40%);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
      }

      .privacy-guard-warning-content {
        padding: 24px !important;
      }

      .privacy-guard-warning-header {
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        margin-bottom: 16px !important;
        padding-bottom: 16px !important;
        border-bottom: 2px solid #e5e7eb !important;
      }

      .privacy-guard-warning-icon {
        font-size: 32px !important;
        line-height: 1 !important;
      }

      .privacy-guard-warning-header strong {
        font-size: 20px !important;
        color: #111827 !important;
        font-weight: 700 !important;
      }

      .privacy-guard-warning-body {
        margin-bottom: 20px !important;
      }

      .privacy-guard-warning-title {
        font-size: 15px !important;
        color: #374151 !important;
        margin: 0 0 12px 0 !important;
        font-weight: 600 !important;
      }

      .privacy-guard-warning-list {
        list-style: none !important;
        padding: 0 !important;
        margin: 0 0 16px 0 !important;
      }

      .privacy-guard-warning-list li {
        padding: 8px 12px !important;
        margin: 6px 0 !important;
        background: #fef2f2 !important;
        border-left: 3px solid ${riskColors[privacyImpact.risk_level]} !important;
        border-radius: 4px !important;
        font-size: 14px !important;
        color: #1f2937 !important;
        line-height: 1.5 !important;
      }

      .privacy-guard-warning-list li strong {
        color: ${riskColors[privacyImpact.risk_level]} !important;
        font-weight: 600 !important;
      }

      .privacy-guard-warning-tip {
        background: #f0fdf4 !important;
        border: 2px solid #22c55e !important;
        border-radius: 8px !important;
        padding: 12px !important;
        font-size: 14px !important;
        color: #166534 !important;
        line-height: 1.5 !important;
      }

      .privacy-guard-warning-tip strong {
        font-weight: 700 !important;
      }

      .privacy-guard-warning-actions {
        display: flex !important;
        gap: 12px !important;
        padding-top: 20px !important;
        border-top: 2px solid #e5e7eb !important;
      }

      .privacy-guard-btn {
        flex: 1 !important;
        padding: 12px 16px !important;
        border: none !important;
        border-radius: 8px !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
        font-family: inherit !important;
      }

      .privacy-guard-btn-safe {
        background: #22c55e !important;
        color: white !important;
      }

      .privacy-guard-btn-safe:hover {
        background: #16a34a !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3) !important;
      }

      .privacy-guard-btn-dismiss {
        background: #e5e7eb !important;
        color: #6b7280 !important;
      }

      .privacy-guard-btn-dismiss:hover {
        background: #d1d5db !important;
      }

      /* Backdrop */
      .privacy-guard-warning-backdrop {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.5) !important;
        z-index: 2147483646 !important;
        animation: privacy-guard-fade-in 0.3s ease-out !important;
      }

      @keyframes privacy-guard-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* Highlight safe button */
      .privacy-guard-safe-button-highlight {
        outline: 3px solid #22c55e !important;
        outline-offset: 4px !important;
        animation: privacy-guard-pulse 2s infinite !important;
      }

      @keyframes privacy-guard-pulse {
        0%, 100% { outline-color: #22c55e; }
        50% { outline-color: #16a34a; }
      }
    `;
    nativeAppendChild.call(document.head, styles);
  }

  // Create backdrop
  const backdrop = nativeCreateElement.call(document, 'div');
  backdrop.className = 'privacy-guard-warning-backdrop';
  backdrop.setAttribute('data-privacy-guard', 'backdrop');

  // Add to page
  nativeAppendChild.call(document.body, backdrop);
  nativeAppendChild.call(document.body, warning);

  // Handle button clicks
  const findDeclineBtn = warning.querySelector('[data-action="find-decline"]');
  const dismissBtn = warning.querySelector('[data-action="dismiss"]');

  nativeAddEventListener.call(findDeclineBtn, 'click', () => {
    findAndHighlightDeclineButton(parent);
    removeWarning(warning, backdrop);
  });

  nativeAddEventListener.call(dismissBtn, 'click', () => {
    removeWarning(warning, backdrop);
  });

  // Close on backdrop click
  nativeAddEventListener.call(backdrop, 'click', () => {
    removeWarning(warning, backdrop);
  });

  // Log event
  chrome.runtime.sendMessage({
    type: 'COOKIE_WARNING_SHOWN',
    payload: {
      url: window.location.href,
      risk_level: privacyImpact.risk_level,
      estimated_cookies: privacyImpact.estimated_cookies,
      known_trackers: privacyImpact.known_trackers
    }
  }).catch(() => {});
}

/**
 * Remove warning overlay
 */
function removeWarning(warning, backdrop) {
  warning.style.animation = 'privacy-guard-slide-out 0.2s ease-in';
  backdrop.style.animation = 'privacy-guard-fade-out 0.2s ease-in';
  
  setTimeout(() => {
    warning.remove();
    backdrop.remove();
  }, 200);
}

/**
 * Find and highlight "Decline All" or "Reject All" buttons
 */
function findAndHighlightDeclineButton(parent) {
  const declinePatterns = [
    /reject\s*all/i,
    /decline\s*all/i,
    /deny\s*all/i,
    /refuse\s*all/i,
    /necessary\s*only/i,
    /essential\s*only/i,
    /no\s*thanks/i,
    /^(reject|decline|deny|no)$/i,
  ];

  const buttons = Array.from(parent.querySelectorAll('button, a[role="button"], div[role="button"]'));
  
  for (const button of buttons) {
    const text = (button.textContent || button.innerText || '').trim();
    const ariaLabel = button.getAttribute('aria-label') || '';
    const fullText = `${text} ${ariaLabel}`.toLowerCase();

    if (declinePatterns.some(pattern => pattern.test(fullText))) {
      // Found decline button! Highlight it
      button.classList.add('privacy-guard-safe-button-highlight');
      
      // Scroll to it
      button.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Show success message
      showToast('✅ Safe option highlighted! Click the green outlined button.');
      
      return;
    }
  }

  // If no decline button found, look for "Manage" or "Settings"
  const managePatterns = [
    /manage\s*(cookies|preferences|settings)/i,
    /cookie\s*settings/i,
    /customize/i,
    /preferences/i,
  ];

  for (const button of buttons) {
    const text = (button.textContent || button.innerText || '').trim();
    const fullText = `${text}`.toLowerCase();

    if (managePatterns.some(pattern => pattern.test(fullText))) {
      button.classList.add('privacy-guard-safe-button-highlight');
      button.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('⚙️ Settings button highlighted! Click to customize your privacy.');
      return;
    }
  }

  showToast('⚠️ No decline button found. Try closing the banner or looking for settings.');
}

/**
 * Show toast message
 */
function showToast(message) {
  const toast = nativeCreateElement.call(document, 'div');
  toast.className = 'privacy-guard-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    background: #111827 !important;
    color: white !important;
    padding: 16px 24px !important;
    border-radius: 8px !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
    z-index: 2147483647 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    animation: privacy-guard-toast-in 0.3s ease-out !important;
  `;

  nativeAppendChild.call(document.body, toast);

  setTimeout(() => {
    toast.style.animation = 'privacy-guard-toast-out 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Intercept "Accept All" button clicks
 */
function interceptAcceptAllClicks() {
  const dangerousButtons = detectAcceptAllButtons();
  
  if (dangerousButtons.length === 0) return;

  console.log(`🛡️ Privacy Guard: Found ${dangerousButtons.length} "Accept All" button(s)`);

  dangerousButtons.forEach(async (buttonInfo) => {
    const { button } = buttonInfo;
    
    // Analyze privacy impact
    const privacyImpact = await analyzePrivacyImpact();

    // Add click interceptor
    nativeAddEventListener.call(button, 'click', (e) => {
      // Only intercept if user hasn't been warned yet
      if (!button.hasAttribute('data-privacy-guard-clicked-through')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Show warning
        createWarningOverlay(buttonInfo, privacyImpact);
        
        // Mark as warned (dismiss button will allow click-through)
        button.setAttribute('data-privacy-guard-clicked-through', 'true');
      }
    }, { capture: true });
  });
}

/**
 * Initialize cookie banner protector
 */
function initCookieBannerProtector() {
  console.log('🛡️ Privacy Guard: Cookie Banner Protector active');
  
  // Initial scan
  interceptAcceptAllClicks();

  // Watch for dynamically added cookie banners
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        interceptAcceptAllClicks();
      }
    }
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    // Wait for body
    const bodyObserver = new MutationObserver(() => {
      if (document.body) {
        bodyObserver.disconnect();
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        interceptAcceptAllClicks();
      }
    });
    bodyObserver.observe(document.documentElement, { childList: true });
  }
}

// Start protection when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCookieBannerProtector);
} else {
  initCookieBannerProtector();
}

// Also scan after a short delay (some banners load late)
setTimeout(initCookieBannerProtector, 1000);
setTimeout(initCookieBannerProtector, 3000);

