/**
 * Cookie consent banner detector
 * Detects and can auto-decline cookie banners
 */

// Cache native DOM methods before websites can modify them
const nativeCreateElement = Document.prototype.createElement;
const nativeAppendChild = Node.prototype.appendChild;

let bannerDetected = false;

/**
 * Detect cookie banners on page
 */
async function detectBanners() {
  const banners = detectCookieBannerLocal();
  
  if (banners.length > 0 && !bannerDetected) {
    bannerDetected = true;
    
    chrome.runtime.sendMessage({
      type: 'COOKIE_BANNER_DETECTED',
      payload: {
        url: window.location.href,
        framework: banners[0].framework,
        hasDeclineButton: findDeclineButtonsLocal(banners[0].element).length > 0,
      },
    });

    // Show overlay option
    await showBannerOverlay(banners[0]);
  }
}

/**
 * Local cookie banner detection
 */
function detectCookieBannerLocal() {
  const banners = [];
  const selectors = {
    onetrust: ['#onetrust-consent-sdk', '#onetrust-banner-sdk'],
    cookiebot: ['#CybotCookiebotDialog'],
    osano: ['#osano-cm-dom-info-dialog-open'],
    custom: ['[id*="cookie"]', '[class*="cookie"]', '[id*="consent"]'],
  };

  for (const [framework, frameworkSelectors] of Object.entries(selectors)) {
    for (const selector of frameworkSelectors) {
      const element = document.querySelector(selector);
      if (element && isVisible(element)) {
        banners.push({ framework, element, selector });
      }
    }
  }

  return banners;
}

function isVisible(element) {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

function findDeclineButtonsLocal(bannerElement) {
  const buttons = [];
  const declineTexts = ['decline', 'reject', 'reject all', 'necessary only', 'essential only'];
  const allButtons = bannerElement.querySelectorAll('button, a, [role="button"]');
  
  for (const button of allButtons) {
    const buttonText = button.textContent.toLowerCase().trim();
    if (declineTexts.some(text => buttonText.includes(text))) {
      buttons.push(button);
    }
  }
  
  return buttons;
}

/**
 * Show overlay with decline option
 */
async function showBannerOverlay(banner) {
  const { autoDeclineCookies } = await chrome.storage.local.get('autoDeclineCookies');
  
  if (autoDeclineCookies) {
    // Auto-decline if enabled
    const declineButtons = findDeclineButtonsLocal(banner.element);
    if (declineButtons.length > 0) {
      declineButtons[0].click();
      return;
    }
  }

  // Show manual option - use cached native DOM methods
  let overlay;
  try {
    overlay = nativeCreateElement.call(document, 'div');
  } catch (error) {
    overlay = document.createElement('div');
  }
  
  overlay.className = 'privacy-guard-banner-overlay';
  overlay.innerHTML = `
    <div class="privacy-guard-banner-overlay-content">
      <p>Cookie banner detected. Would you like to decline all non-essential cookies?</p>
      <div class="privacy-guard-banner-overlay-actions">
        <button class="privacy-guard-btn-decline">Decline All</button>
        <button class="privacy-guard-btn-dismiss">Dismiss</button>
      </div>
    </div>
  `;

  const declineBtn = overlay.querySelector('.privacy-guard-btn-decline');
  if (declineBtn) {
    declineBtn.addEventListener('click', () => {
      const declineButtons = findDeclineButtonsLocal(banner.element);
      if (declineButtons.length > 0) {
        declineButtons[0].click();
      }
      overlay.remove();
    });
  }

  const dismissBtn = overlay.querySelector('.privacy-guard-btn-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      overlay.remove();
    });
  }

  // Wait for body to be available (in case script runs early)
  if (!document.body) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        try {
          nativeAppendChild.call(document.body, overlay);
        } catch (error) {
          document.body.appendChild(overlay);
        }
      });
      return;
    }
  }
  
  try {
    nativeAppendChild.call(document.body, overlay);
  } catch (error) {
    document.body.appendChild(overlay);
  }
}

// Detect on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => detectBanners());
} else {
  detectBanners();
}

// Re-detect on dynamic content
const observer = new MutationObserver(() => {
  if (!bannerDetected) {
    detectBanners().catch(err => console.error('Banner detection error:', err));
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

