/**
 * Floating overlay UI for Privacy Guard
 * Shows quick actions and analysis preview
 */

// Cache native DOM methods before websites can modify them
const nativeCreateElement = Document.prototype.createElement;
const nativeAppendChild = Node.prototype.appendChild;

let overlayVisible = false;

/**
 * Create floating overlay
 * Uses safe DOM methods to work even when websites modify prototypes
 */
function createOverlay() {
  // Use cached native DOM methods (captured before website code runs)
  let overlay;
  try {
    overlay = nativeCreateElement.call(document, 'div');
  } catch (error) {
    // Fallback if native method fails
    overlay = document.createElement('div');
  }
  
  overlay.id = 'privacy-guard-overlay';
  overlay.className = 'privacy-guard-overlay';
  overlay.innerHTML = `
    <div class="privacy-guard-overlay-header">
      <span class="privacy-guard-overlay-icon">🛡️</span>
      <span class="privacy-guard-overlay-title">Privacy Guard</span>
      <button class="privacy-guard-overlay-close" aria-label="Close overlay">×</button>
    </div>
    <div class="privacy-guard-overlay-content">
      <div class="privacy-guard-overlay-loading">Analyzing page...</div>
    </div>
  `;

  const closeBtn = overlay.querySelector('.privacy-guard-overlay-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideOverlay();
    });
  }

  // Wait for body to be available (in case script runs early)
  if (!document.body) {
    // If body doesn't exist yet, wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        try {
          nativeAppendChild.call(document.body, overlay);
        } catch (error) {
          document.body.appendChild(overlay);
        }
      });
      return overlay;
    }
  }
  
  try {
    nativeAppendChild.call(document.body, overlay);
  } catch (error) {
    // Fallback
    document.body.appendChild(overlay);
  }
  
  return overlay;
}

/**
 * Show overlay with analysis
 */
function showOverlay(analysis) {
  let overlay = document.getElementById('privacy-guard-overlay');
  if (!overlay) {
    overlay = createOverlay();
  }

  const content = overlay.querySelector('.privacy-guard-overlay-content');
  
  if (analysis) {
    content.innerHTML = `
      <div class="privacy-guard-overlay-summary">
        <div class="privacy-guard-overlay-risk risk-${analysis.risk?.toLowerCase() || 'watch'}">
          Risk: ${analysis.risk || 'Watch'}
        </div>
        <p class="privacy-guard-overlay-tldr">${analysis.tldr || 'Analysis complete'}</p>
        <div class="privacy-guard-overlay-actions">
          <button class="privacy-guard-overlay-btn" data-action="view-details">View Details</button>
          <button class="privacy-guard-overlay-btn" data-action="block-trackers">Block Trackers</button>
        </div>
      </div>
    `;

    // Add button handlers
    content.querySelector('[data-action="view-details"]').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
    });

    content.querySelector('[data-action="block-trackers"]').addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'BLOCK_TRACKERS',
        payload: { enabled: true },
      });
    });
  }

  overlay.classList.add('visible');
  overlayVisible = true;
}

/**
 * Hide overlay
 */
function hideOverlay() {
  const overlay = document.getElementById('privacy-guard-overlay');
  if (overlay) {
    overlay.classList.remove('visible');
    overlayVisible = false;
  }
}

/**
 * Toggle overlay
 */
function toggleOverlay() {
  if (overlayVisible) {
    hideOverlay();
  } else {
    // Trigger analysis
    chrome.runtime.sendMessage({
      type: 'ANALYZE_DOCUMENT',
      payload: {
        url: window.location.href,
        text: document.body?.textContent || '',
      },
    }, (response) => {
      if (response?.success) {
        showOverlay(response);
      }
    });
  }
}

// Keyboard shortcut (Ctrl+Shift+P)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'P') {
    e.preventDefault();
    toggleOverlay();
  }
});

