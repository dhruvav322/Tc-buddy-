/**
 * Document type detector
 * Identifies Terms & Conditions, Privacy Policies, Cookie pages
 */

// Cache native DOM methods before websites can modify them
const nativeCreateElement = Document.prototype.createElement;
const nativeAppendChild = Node.prototype.appendChild;

/**
 * Detect document type on current page
 */
function detectPageType() {
  const url = window.location.href;
  const pageText = document.body?.textContent || '';
  
  const types = detectDocumentTypeLocal(url, pageText);
  
  if (types.length > 0) {
    // Notify background script
    chrome.runtime.sendMessage({
      type: 'PAGE_TYPE_DETECTED',
      payload: {
        url,
        types,
        timestamp: Date.now(),
      },
    });

    // Show floating badge
    showDetectionBadge(types);
  }
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
    badge = nativeCreateElement.call(document, 'div');
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

// Re-detect on SPA navigation
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(detectPageType, 1000);
  }
}).observe(document, { subtree: true, childList: true });

