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
async function wakeServiceWorker(maxRetries = 5, delay = 300) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'TEST' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      // Success - service worker is ready
      if (attempt > 0) {
        console.log(`✅ Service worker woke up after ${attempt + 1} attempts`);
      }
      return response;
    } catch (error) {
      // If this is the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        console.warn('⚠️ Service worker not responding after', maxRetries, 'attempts');
        // Don't throw - just log and continue (might still work)
        return null;
      }
      // Wait before retrying (exponential backoff)
      const waitTime = delay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

async function initialize() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    // CRITICAL: Wait for service worker to be ready BEFORE doing anything else
    // This prevents "connection error" when extension is first opened
    console.log('Waiting for service worker to be ready...');
    try {
      await wakeServiceWorker(10, 200); // More retries, shorter delay
      console.log('✅ Service worker is ready');
    } catch (error) {
      console.warn('⚠️ Service worker not responding, but continuing...');
      // Don't throw - let it continue, might work on next attempt
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
    
    // Check if we should open to a specific tab (from modern UI)
    const { openToTab, lastAnalysis } = await chrome.storage.local.get(['openToTab', 'lastAnalysis']);
    if (openToTab) {
      // Switch to the requested tab
      switchTab(openToTab);
      // Clear the flag
      chrome.storage.local.remove('openToTab');
      
      // If we have analysis data, load it
      if (lastAnalysis && openToTab === 'details') {
        currentAnalysis = lastAnalysis;
        updateUI(lastAnalysis);
        saveToHistory(lastAnalysis);
        chrome.storage.local.remove('lastAnalysis');
      }
    }
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
    radio.addEventListener('change', async (e) => {
      await chrome.storage.local.set({ analysisMode: e.target.value });
      console.log('✅ Analysis mode saved:', e.target.value);
      showNotification(`Analysis mode set to: ${e.target.value.toUpperCase()}`);
    });
  });

  document.getElementById('apiProvider').addEventListener('change', async (e) => {
    await chrome.storage.local.set({ preferredApiProvider: e.target.value });
    console.log('✅ API provider saved:', e.target.value);
    showNotification(`API provider set to: ${e.target.value}`);
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
      switchTab(tabName);
    });
  });
}

/**
 * Switch to a specific tab (can be called programmatically)
 */
function switchTab(tabName) {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  const targetButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);

  if (!targetButton) {
    console.warn(`Tab "${tabName}" not found`);
    return;
  }

  // Update buttons
  tabButtons.forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });
  targetButton.classList.add('active');
  targetButton.setAttribute('aria-selected', 'true');

  // Update content
  tabContents.forEach(content => {
    content.classList.remove('active');
  });
  const targetContent = document.getElementById(`tab-${tabName}`);
  if (targetContent) {
    targetContent.classList.add('active');
  }

  // Load tab-specific data
  if (tabName === 'cookies') {
    loadCookiesTab();
  } else if (tabName === 'history') {
    loadHistoryTab();
  } else if (tabName === 'dashboard') {
    loadDashboardTab();
  }
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
    
    // Log settings for debugging
    console.log('🔍 Analysis Settings:');
    console.log('  Mode:', mode, '(from storage:', analysisMode, ')');
    console.log('  Provider:', preferredApiProvider);

    // Wake up service worker first
    try {
      await wakeServiceWorker();
    } catch (error) {
      console.warn('Service worker wake-up failed, continuing anyway:', error);
    }

    // Send analysis request with error handling
    let response;
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        response = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Request timeout - service worker not responding'));
          }, 10000); // 10 second timeout
          
          chrome.runtime.sendMessage({
            type: 'ANALYZE_DOCUMENT',
            payload: {
              url: currentTab.url,
              text,
              mode,
              provider: preferredApiProvider,
            },
          }, (response) => {
            clearTimeout(timeout);
            // Check for runtime errors
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(response);
          });
        });
        // Success - break out of retry loop
        break;
      } catch (error) {
        retries++;
        const isConnectionError = error.message?.includes('Receiving end does not exist') || 
                                  error.message?.includes('Could not establish connection') ||
                                  error.message?.includes('Request timeout');
        
        if (isConnectionError && retries < maxRetries) {
          console.log(`Service worker not ready (attempt ${retries}/${maxRetries}), retrying...`);
          // Wake up service worker and wait
          await wakeServiceWorker(3, 200);
          await new Promise(resolve => setTimeout(resolve, 500));
          continue; // Retry
        } else {
          // Max retries reached or different error
          throw error;
        }
      }
    }

    if (!response?.success) {
      const errorMsg = response?.error || 'Analysis failed';
      // Don't show error dialog for connection errors - show user-friendly message
      if (errorMsg.includes('connection') || errorMsg.includes('Receiving end')) {
        showError('Extension is still initializing. Please wait a moment and try again.');
      } else {
        throw new Error(errorMsg);
      }
      return;
    }

    currentAnalysis = response;
    
    // Log which mode was used for debugging
    if (response.provider) {
      console.log('✅ Analysis complete using:', response.provider, 'Mode:', mode);
    } else {
      console.log('✅ Analysis complete using: Local heuristics, Mode:', mode);
    }
    
    // Show warning if AI mode was selected but couldn't be used
    if (response.warning) {
      showNotification(response.warning, 'warning');
    }
    
    updateUI(response);
    saveToHistory(response);

  } catch (error) {
    // Handle connection errors gracefully without showing system dialog
    const errorMsg = error.message || 'Unknown error';
    if (errorMsg.includes('Receiving end does not exist') || 
        errorMsg.includes('Could not establish connection') ||
        errorMsg.includes('Extension context invalidated')) {
      showError('Extension is still initializing. Please wait a few seconds and try again.');
      console.warn('Connection error (this is normal after installing/reloading):', errorMsg);
    } else {
      showError(errorMsg);
    }
  } finally {
    showLoading(false);
  }
}

function updateUI(analysis) {
  // Update analysis source badge
  updateAnalysisSourceBadge(analysis);

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

function updateAnalysisSourceBadge(analysis) {
  const badge = document.getElementById('analysisSourceBadge');
  if (!badge) return;

  // Determine if AI was actually used (not just selected)
  const provider = analysis.provider || 'Unknown';
  const source = analysis.source; // This is now set correctly in analyzer.js
  const mode = analysis.mode || 'hybrid';
  
  // Debug logging
  console.log('🏷️ Badge Update:');
  console.log('  Provider:', provider);
  console.log('  Source:', source);
  console.log('  Mode:', mode);
  
  // Check source first (most reliable), then fall back to provider name
  let isAI = false;
  if (source === 'api') {
    isAI = true;
  } else if (source === 'local') {
    isAI = false;
  } else {
    // Fallback: check provider name
    isAI = !provider.includes('Local') && !provider.includes('Heuristics');
  }
  
  // If mode is 'ai' but source is 'local', show warning
  if (mode === 'ai' && !isAI) {
    console.warn('⚠️ AI mode selected but local analysis was used!');
    console.warn('⚠️ This means API key is not configured or API call failed');
  }

  badge.classList.remove('hidden', 'ai', 'local');
  badge.classList.add(isAI ? 'ai' : 'local');

  if (isAI) {
    // Show provider name (e.g., "Deepseek", "OpenAI", "Anthropic", "Gemini")
    const providerName = provider.replace('Local (Heuristics)', '').trim() || 'AI';
    badge.innerHTML = `🤖 AI Analysis: ${providerName}`;
    badge.title = 'This analysis used AI for deeper, contextual understanding';
  } else {
    // Show warning if AI mode was selected but local was used
    if (mode === 'ai' && analysis.warning) {
      badge.innerHTML = `⚠️ ${analysis.warning}`;
      badge.title = analysis.warning;
      badge.classList.add('local'); // Use local styling for warning
    } else {
      badge.innerHTML = `⚡ Local Analysis: Quick Scan`;
      badge.title = 'This analysis used local keyword matching (fast, free, but less detailed)';
    }
  }
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

async function handleHighlight() {
  if (!currentAnalysis) {
    showError('No analysis available. Please analyze the page first.');
    return;
  }

  if (!currentTab || !currentTab.id) {
    showError('Unable to access current tab.');
    return;
  }

  try {
    // First clear any existing highlights
    await chrome.tabs.sendMessage(currentTab.id, {
      type: 'CLEAR_HIGHLIGHTS'
    }).catch(() => {}); // Ignore errors if content script not ready

    // Then highlight red flags
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      type: 'HIGHLIGHT_RED_FLAGS',
      payload: { redFlags: currentAnalysis.red_flags },
    });

    if (response && response.success) {
      showNotification('Highlights applied to page', 'success');
    } else {
      showError('Failed to highlight text on page. Make sure you are on the analyzed page.');
    }
  } catch (error) {
    console.error('Highlight error:', error);
    if (error.message && error.message.includes('Could not establish connection')) {
      showError('Content script not ready. Please refresh the page and try again.');
    } else {
      showError('Failed to highlight: ' + error.message);
    }
  }
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

function showNotification(message, type = 'info') {
  // Simple notification - could be enhanced with toast
  // For warnings, show a more prominent notification
  if (type === 'warning') {
    const warningDiv = document.createElement('div');
    warningDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ffc107;
      color: #000;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 400px;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
    `;
    warningDiv.textContent = message;
    document.body.appendChild(warningDiv);
    setTimeout(() => {
      warningDiv.style.opacity = '0';
      warningDiv.style.transition = 'opacity 0.3s';
      setTimeout(() => warningDiv.remove(), 300);
    }, 5000);
    return;
  }
  
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

