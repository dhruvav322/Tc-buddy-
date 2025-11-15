/**
 * Privacy Guard Popup Script
 * Handles UI interactions and communication with background script
 */

// State
let currentAnalysis = null;
let currentTab = null;

// Initialize
document.addEventListener('DOMContentLoaded', initialize);

/**
 * Wake up service worker by sending a ping
 */
async function wakeServiceWorker() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'TEST' }, (response) => {
      if (chrome.runtime.lastError) {
        // Service worker not ready, wait and retry
        setTimeout(() => {
          chrome.runtime.sendMessage({ type: 'TEST' }, (retryResponse) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(retryResponse);
            }
          });
        }, 500);
      } else {
        resolve(response);
      }
    });
  });
}

async function initialize() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    // Wake up service worker first
    try {
      await wakeServiceWorker();
      console.log('Service worker is awake');
    } catch (error) {
      console.warn('Service worker wake-up failed:', error);
      // Continue anyway - might work on retry
    }

    // Load settings
    await loadSettings();

    // Setup event listeners
    setupEventListeners();

    // Load initial data (with error handling)
    try {
      await loadInitialData();
    } catch (error) {
      console.warn('Failed to load initial data:', error);
    }

    // Setup tabs
    setupTabs();
  } catch (error) {
    console.error('Error initializing popup:', error);
    // Show error to user
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = 'padding: 20px; background: #fee2e2; color: #b91c1c; border-radius: 8px; margin: 20px;';
    errorMsg.textContent = `Error: ${error.message}. Please reload the extension.`;
    document.body.insertBefore(errorMsg, document.body.firstChild);
  }
}

function setupEventListeners() {
  // Analyze button
  document.getElementById('analyzeBtn').addEventListener('click', handleAnalyze);

  // Action buttons
  document.getElementById('blockTrackersBtn').addEventListener('click', handleBlockTrackers);
  document.getElementById('autoDeclineBtn').addEventListener('click', handleAutoDecline);
  document.getElementById('highlightBtn').addEventListener('click', handleHighlight);
  document.getElementById('exportBtn').addEventListener('click', handleExport);
  document.getElementById('blockCookiesBtn').addEventListener('click', handleBlockCookies);
  document.getElementById('clearHistoryBtn').addEventListener('click', handleClearHistory);
  document.getElementById('openOptionsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Settings
  document.querySelectorAll('input[name="analysisMode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      chrome.storage.local.set({ analysisMode: e.target.value });
    });
  });

  document.getElementById('apiProvider').addEventListener('change', (e) => {
    chrome.storage.local.set({ preferredApiProvider: e.target.value });
  });

  document.getElementById('saveDeepseekKey').addEventListener('click', () => {
    const key = document.getElementById('deepseekKey').value.trim();
    if (key) {
      chrome.storage.local.set({ deepseekApiKey: key });
      showNotification('Deepseek API key saved');
    }
  });

  document.getElementById('saveOpenAIKey').addEventListener('click', () => {
    const key = document.getElementById('openaiKey').value.trim();
    if (key) {
      chrome.storage.local.set({ openaiApiKey: key });
      showNotification('OpenAI API key saved');
    }
  });

  document.getElementById('blockTrackersToggle').addEventListener('change', async (e) => {
    // Wake up service worker first
    try {
      await wakeServiceWorker();
    } catch (error) {
      console.warn('Service worker wake-up failed:', error);
    }
    
    chrome.runtime.sendMessage({
      type: 'BLOCK_TRACKERS',
      payload: { enabled: e.target.checked },
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('Block trackers toggle error:', chrome.runtime.lastError.message);
      }
    });
  });

  document.getElementById('blockCookiesToggle').addEventListener('change', (e) => {
    chrome.storage.local.set({ blockNonEssentialCookies: document.getElementById('blockCookiesToggle').checked });
  });

  document.getElementById('autoDeclineToggle').addEventListener('change', (e) => {
    chrome.storage.local.set({ autoDeclineCookies: e.target.checked });
  });
}

function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;

      // Update buttons
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');

      // Update content
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`tab-${tabName}`).classList.add('active');

      // Load tab-specific data
      if (tabName === 'cookies') {
        loadCookiesTab();
      } else if (tabName === 'history') {
        loadHistoryTab();
      } else if (tabName === 'dashboard') {
        loadDashboardTab();
      }
    });
  });
}

async function loadSettings() {
  const settings = await chrome.storage.local.get([
    'analysisMode',
    'preferredApiProvider',
    'deepseekApiKey',
    'openaiApiKey',
    'blockTrackers',
    'blockNonEssentialCookies',
    'autoDeclineCookies',
  ]);

  // Set analysis mode
  if (settings.analysisMode) {
    document.querySelector(`input[name="analysisMode"][value="${settings.analysisMode}"]`).checked = true;
  }

  // Set API provider
  if (settings.preferredApiProvider) {
    document.getElementById('apiProvider').value = settings.preferredApiProvider;
  }

  // Set API keys (masked)
  if (settings.deepseekApiKey) {
    document.getElementById('deepseekKey').value = maskApiKey(settings.deepseekApiKey);
  }
  if (settings.openaiApiKey) {
    document.getElementById('openaiKey').value = maskApiKey(settings.openaiApiKey);
  }

  // Set toggles
  document.getElementById('blockTrackersToggle').checked = settings.blockTrackers || false;
  document.getElementById('blockCookiesToggle').checked = settings.blockNonEssentialCookies || false;
  document.getElementById('autoDeclineToggle').checked = settings.autoDeclineCookies || false;
}

function maskApiKey(key) {
  if (!key || key.length < 8) return key;
  return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}

async function loadInitialData() {
  // Load cookie stats
  await loadCookieStats();
}

async function loadCookieStats() {
  try {
    if (!currentTab?.id) {
      document.getElementById('trackerCount').textContent = '-';
      document.getElementById('cookieCount').textContent = '-';
      return;
    }
    
    // Wake up service worker first
    try {
      await wakeServiceWorker();
    } catch (error) {
      console.warn('Service worker wake-up failed, continuing anyway:', error);
    }
    
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'ANALYZE_COOKIES',
        payload: { tabId: currentTab.id },
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });

    if (response?.success) {
      document.getElementById('trackerCount').textContent = response.trackers?.length || 0;
      document.getElementById('cookieCount').textContent = response.total || 0;
    }
  } catch (error) {
    console.error('Failed to load cookie stats:', error);
    // Set defaults on error
    const trackerEl = document.getElementById('trackerCount');
    const cookieEl = document.getElementById('cookieCount');
    if (trackerEl) trackerEl.textContent = '-';
    if (cookieEl) cookieEl.textContent = '-';
  }
}

async function handleAnalyze() {
  showLoading(true);

  try {
    // Extract text from page
    const text = await extractTextFromPage(currentTab.id);
    if (!text || text.length < 50) {
      throw new Error('Page does not contain enough text to analyze. The page may still be loading or may not have readable content.');
    }

    // Get analysis mode
    const { analysisMode = 'hybrid', preferredApiProvider = 'auto' } = await chrome.storage.local.get([
      'analysisMode',
      'preferredApiProvider',
    ]);

    const mode = analysisMode === 'ai' ? 'ai' : analysisMode === 'local' ? 'local' : 'hybrid';

    // Wake up service worker first
    try {
      await wakeServiceWorker();
    } catch (error) {
      console.warn('Service worker wake-up failed, continuing anyway:', error);
    }

    // Send analysis request with error handling
    let response;
    try {
      response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'ANALYZE_DOCUMENT',
          payload: {
            url: currentTab.url,
            text,
            mode,
            provider: preferredApiProvider,
          },
        }, (response) => {
          // Check for runtime errors
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      });
    } catch (error) {
      // Service worker might not be ready, wake it up and retry once
      if (error.message?.includes('Receiving end does not exist') || 
          error.message?.includes('Could not establish connection')) {
        console.log('Service worker not ready, waking up and retrying...');
        try {
          await wakeServiceWorker();
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (wakeError) {
          console.warn('Wake-up failed:', wakeError);
        }
        
        response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            type: 'ANALYZE_DOCUMENT',
            payload: {
              url: currentTab.url,
              text,
              mode,
              provider: preferredApiProvider,
            },
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(response);
          });
        });
      } else {
        throw error;
      }
    }

    if (!response?.success) {
      throw new Error(response?.error || 'Analysis failed');
    }

    currentAnalysis = response;
    updateUI(response);
    saveToHistory(response);

  } catch (error) {
    showError(error.message);
  } finally {
    showLoading(false);
  }
}

function updateUI(analysis) {
  // Update risk badge
  updateRiskBadge(analysis.risk || 'Watch');

  // Update privacy score
  document.getElementById('privacyScore').textContent = analysis.privacy_score ?? '-';

  // Update summary tab
  document.getElementById('tldrText').textContent = analysis.tldr || 'Analysis complete';
  renderBullets(analysis.bullets || []);
  renderRiskDetails(analysis);

  // Update details tab
  renderFullAnalysis(analysis);
  renderRedFlags(analysis.red_flags || {});
}

function renderBullets(bullets) {
  const list = document.getElementById('bulletsList');
  list.innerHTML = '';

  bullets.forEach(bullet => {
    const li = document.createElement('li');
    li.textContent = bullet;
    li.addEventListener('click', () => {
      chrome.tabs.sendMessage(currentTab.id, {
        type: 'HIGHLIGHT_TEXT',
        payload: { snippets: [bullet] },
      });
    });
    list.appendChild(li);
  });
}

function renderRiskDetails(analysis) {
  const container = document.getElementById('riskDetails');
  const score = analysis.privacy_score ?? 50;

  container.innerHTML = `
    <div class="risk-score">
      <span class="risk-score-label">Privacy Score:</span>
      <span class="risk-score-value">${score}/100</span>
      <div class="risk-score-bar">
        <div class="risk-score-fill" style="width: ${score}%"></div>
      </div>
    </div>
    <div class="risk-score">
      <span class="risk-score-label">Readability:</span>
      <span class="risk-score-value">Grade ${analysis.readability_score ?? 12}</span>
    </div>
  `;
}

function renderFullAnalysis(analysis) {
  const container = document.getElementById('fullAnalysis');
  container.innerHTML = `
    <div class="tab-section">
      <h3 class="section-title">Summary</h3>
      <p class="tldr-text">${analysis.tldr || 'No summary available'}</p>
    </div>
    <div class="tab-section">
      <h3 class="section-title">Key Points</h3>
      <ul class="bullets-list">
        ${(analysis.bullets || []).map(b => `<li>${b}</li>`).join('')}
      </ul>
    </div>
    <div class="tab-section">
      <h3 class="section-title">Scores</h3>
      <p>Privacy Score: ${analysis.privacy_score ?? 'N/A'}/100</p>
      <p>Readability: Grade ${analysis.readability_score ?? 'N/A'}</p>
      <p>Provider: ${analysis.provider || 'Unknown'}</p>
    </div>
  `;
}

function renderRedFlags(redFlags) {
  const container = document.getElementById('redFlagsGrid');
  container.innerHTML = '';

  for (const [key, value] of Object.entries(redFlags)) {
    const card = document.createElement('div');
    const isFlagged = value.startsWith('Yes');
    card.className = `red-flag-card ${isFlagged ? 'flagged' : 'safe'}`;
    card.innerHTML = `
      <div class="red-flag-title">${formatFlagName(key)}</div>
      <div class="red-flag-value">${value}</div>
    `;
    container.appendChild(card);
  }
}

function formatFlagName(key) {
  return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function updateRiskBadge(risk) {
  const badge = document.getElementById('riskBadge');
  badge.className = `risk-badge risk-${risk.toLowerCase()}`;
  badge.textContent = risk;
}

async function loadCookiesTab() {
  try {
    if (!currentTab?.id) return;
    
    // Wake up service worker first
    try {
      await wakeServiceWorker();
    } catch (error) {
      console.warn('Service worker wake-up failed, continuing anyway:', error);
    }
    
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'ANALYZE_COOKIES',
        payload: { tabId: currentTab.id },
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });

    if (response?.success) {
      renderCookieBreakdown(response.by_category || {});
      renderTrackers(response.trackers || []);
    }
  } catch (error) {
    console.error('Failed to load cookies:', error);
    // Show empty state
    const breakdownEl = document.getElementById('cookieBreakdown');
    const trackersEl = document.getElementById('trackersList');
    if (breakdownEl) breakdownEl.innerHTML = '<p style="color: #64748b; font-size: 14px;">Unable to load cookie data.</p>';
    if (trackersEl) trackersEl.innerHTML = '<p style="color: #64748b; font-size: 14px;">Unable to load tracker data.</p>';
  }
}

function renderCookieBreakdown(categories) {
  const container = document.getElementById('cookieBreakdown');
  container.innerHTML = '';

  const categoryNames = {
    essential: 'Essential',
    functional: 'Functional',
    analytics: 'Analytics',
    marketing: 'Marketing',
    advertising: 'Advertising',
    unknown: 'Unknown',
  };

  for (const [key, count] of Object.entries(categories)) {
    const item = document.createElement('div');
    item.className = 'cookie-category';
    item.innerHTML = `
      <span class="cookie-category-name">${categoryNames[key] || key}</span>
      <span class="cookie-category-count">${count}</span>
    `;
    container.appendChild(item);
  }
}

function renderTrackers(trackers) {
  const container = document.getElementById('trackersList');
  container.innerHTML = '';

  if (trackers.length === 0) {
    container.innerHTML = '<p style="color: #64748b; font-size: 14px;">No known trackers detected.</p>';
    return;
  }

  trackers.forEach(tracker => {
    const item = document.createElement('div');
    item.className = 'cookie-category';
    item.innerHTML = `
      <span class="cookie-category-name">${tracker.name}</span>
      <span class="cookie-category-name" style="font-size: 12px; color: #64748b;">${tracker.domain}</span>
    `;
    container.appendChild(item);
  });
}

async function loadHistoryTab() {
  const { privacyGuardHistory } = await chrome.storage.local.get('privacyGuardHistory') || {};
  const history = privacyGuardHistory || {};

  const container = document.getElementById('historyList');
  container.innerHTML = '';

  const entries = Object.entries(history).sort((a, b) => {
    return new Date(b[1].analyzed_at) - new Date(a[1].analyzed_at);
  });

  if (entries.length === 0) {
    container.innerHTML = '<p style="color: #64748b; font-size: 14px;">No analysis history yet.</p>';
    return;
  }

  entries.slice(0, 20).forEach(([url, data]) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div class="history-item-url">${new URL(url).hostname}</div>
      <div class="history-item-meta">
        Risk: ${data.risk || 'Unknown'} | Score: ${data.privacy_score ?? 'N/A'}/100 | ${new Date(data.analyzed_at).toLocaleDateString()}
      </div>
    `;
    item.addEventListener('click', () => {
      chrome.tabs.update(currentTab.id, { url });
    });
    container.appendChild(item);
  });
}

function saveToHistory(analysis) {
  chrome.storage.local.get('privacyGuardHistory').then(({ privacyGuardHistory = {} }) => {
    privacyGuardHistory[analysis.url] = {
      ...analysis,
      analyzed_at: new Date().toISOString(),
    };
    chrome.storage.local.set({ privacyGuardHistory });
  });
}

async function handleBlockTrackers() {
  try {
    // Wake up service worker first
    try {
      await wakeServiceWorker();
    } catch (error) {
      console.warn('Service worker wake-up failed, continuing anyway:', error);
    }
    
    await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'BLOCK_TRACKERS',
        payload: { enabled: true },
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
    showNotification('Trackers blocked successfully');
  } catch (error) {
    console.error('Block trackers error:', error);
    showError('Failed to block trackers: ' + error.message);
  }
}

async function handleAutoDecline() {
  try {
    if (!currentTab?.id) {
      showError('No active tab');
      return;
    }
    
    // Wake up service worker first
    try {
      await wakeServiceWorker();
    } catch (error) {
      console.warn('Service worker wake-up failed, continuing anyway:', error);
    }
    
    await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'AUTO_DECLINE_COOKIES',
        payload: { tabId: currentTab.id },
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
    showNotification('Cookie banner declined');
  } catch (error) {
    console.error('Auto decline error:', error);
    showError('Failed to decline cookies: ' + error.message);
  }
}

function handleHighlight() {
  if (!currentAnalysis) return;

  chrome.tabs.sendMessage(currentTab.id, {
    type: 'HIGHLIGHT_RED_FLAGS',
    payload: { redFlags: currentAnalysis.red_flags },
  });
}

function handleExport() {
  if (!currentAnalysis) {
    showError('No analysis to export');
    return;
  }

  // Create PDF content (simplified - would use a library in production)
  const content = `
Privacy Guard Analysis Report
Generated: ${new Date().toLocaleString()}
URL: ${currentAnalysis.url}

TL;DR
${currentAnalysis.tldr}

Key Points
${(currentAnalysis.bullets || []).map(b => `- ${b}`).join('\n')}

Risk Assessment
Risk Level: ${currentAnalysis.risk}
Privacy Score: ${currentAnalysis.privacy_score}/100
Readability: Grade ${currentAnalysis.readability_score}

Red Flags
${Object.entries(currentAnalysis.red_flags || {}).map(([k, v]) => `${k}: ${v}`).join('\n')}
  `;

  // Download as text file (PDF would require a library)
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `privacy-report-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

async function handleBlockCookies() {
  try {
    if (!currentTab?.url) {
      showError('No active tab');
      return;
    }
    
    // Wake up service worker first
    try {
      await wakeServiceWorker();
    } catch (error) {
      console.warn('Service worker wake-up failed, continuing anyway:', error);
    }
    
    const domain = new URL(currentTab.url).hostname;
    await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'BLOCK_COOKIES',
        payload: { enabled: true, domain },
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
    showNotification('Non-essential cookies blocked');
  } catch (error) {
    console.error('Block cookies error:', error);
    showError('Failed to block cookies: ' + error.message);
  }
}

async function handleClearHistory() {
  if (confirm('Are you sure you want to clear all analysis history?')) {
    await chrome.storage.local.remove('privacyGuardHistory');
    loadHistoryTab();
    showNotification('History cleared');
  }
}

async function extractTextFromPage(tabId) {
  const response = await chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_TEXT' });
  if (!response?.success) {
    throw new Error(response?.error || 'Failed to extract text');
  }
  return response.text;
}

function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (show) {
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
  }
}

function showError(message) {
  // Simple error display - could be enhanced
  alert(message);
}

function showNotification(message) {
  // Simple notification - could be enhanced with toast
  const badge = document.getElementById('riskBadge');
  const originalText = badge.textContent;
  badge.textContent = message;
  setTimeout(() => {
    badge.textContent = originalText;
  }, 3000);
}

async function loadDashboardTab() {
  try {
    // Wake up service worker first
    try {
      await wakeServiceWorker();
    } catch (error) {
      console.warn('Service worker wake-up failed, continuing anyway:', error);
    }
    
    const { initializeDashboard } = await import('./components/dashboard.js');
    await initializeDashboard();
  } catch (error) {
    console.error('Failed to load dashboard:', error);
    const container = document.getElementById('tab-dashboard');
    if (container) {
      container.innerHTML = '<p style="color: #64748b; padding: 20px;">Unable to load dashboard. Please try again.</p>';
    }
  }
}

