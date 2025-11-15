/**
 * Privacy Guard - Modern UI
 * Beautiful, minimal interface with dark/light mode
 */

// State
let currentAnalysis = null;
let currentTab = null;
let currentTheme = 'light';

// Initialize
document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
  // Load theme preference
  await loadTheme();
  
  // Setup event listeners
  setupEventListeners();
  
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  
  // Wake service worker
  await wakeServiceWorker();
  
  // Load initial data
  await loadInitialData();
}

/**
 * Theme Management
 */
async function loadTheme() {
  const { theme } = await chrome.storage.local.get('theme');
  
  // Use system preference if no saved theme
  if (!theme) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    currentTheme = prefersDark ? 'dark' : 'light';
  } else {
    currentTheme = theme;
  }
  
  applyTheme(currentTheme);
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const { theme } = chrome.storage.local.get('theme');
    if (!theme) {
      currentTheme = e.matches ? 'dark' : 'light';
      applyTheme(currentTheme);
    }
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  currentTheme = theme;
  
  // Update theme toggle icon
  const sunIcon = document.querySelector('.theme-icon.sun');
  const moonIcon = document.querySelector('.theme-icon.moon');
  
  if (theme === 'dark') {
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  } else {
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  }
}

async function toggleTheme() {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  await chrome.storage.local.set({ theme: newTheme });
  applyTheme(newTheme);
}

/**
 * Service Worker Wake-up
 */
async function wakeServiceWorker(maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'TEST' });
      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) {
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, attempt)));
    }
  }
}

/**
 * Event Listeners
 */
function setupEventListeners() {
  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  
  // Menu toggle
  document.getElementById('menuBtn').addEventListener('click', openMenu);
  document.getElementById('closeDrawer').addEventListener('click', closeMenu);
  document.getElementById('drawerOverlay').addEventListener('click', closeMenu);
  
  // Navigation items
  document.getElementById('navDashboard').addEventListener('click', (e) => {
    e.preventDefault();
    openDashboard();
  });
  
  document.getElementById('navHistory').addEventListener('click', (e) => {
    e.preventDefault();
    openHistory();
  });
  
  document.getElementById('navSettings').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  
  document.getElementById('navHelp').addEventListener('click', (e) => {
    e.preventDefault();
    window.open('https://github.com/dhruvav322/Tc-buddy-', '_blank');
  });
  
  // Analysis button
  document.getElementById('analyzeBtn').addEventListener('click', handleAnalyze);
  
  // Action buttons
  document.getElementById('blockTrackersBtn').addEventListener('click', handleBlockTrackers);
  document.getElementById('autoDeclineBtn').addEventListener('click', handleAutoDecline);
  
  // Toggle sections
  document.getElementById('concernsToggle').addEventListener('click', toggleSection);
  document.getElementById('keyPointsToggle').addEventListener('click', toggleSection);
  
  // See details - open old popup with full analysis
  document.getElementById('seeDetailsBtn').addEventListener('click', () => {
    openFullAnalysis();
  });
}

/**
 * Menu Management
 */
function openMenu() {
  document.getElementById('menuDrawer').classList.remove('hidden');
}

function closeMenu() {
  document.getElementById('menuDrawer').classList.add('hidden');
}

/**
 * Toggle expandable sections
 */
function toggleSection(e) {
  const header = e.currentTarget;
  const section = header.closest('.card');
  const content = header.nextElementSibling;
  
  header.classList.toggle('expanded');
  content.classList.toggle('collapsed');
}

/**
 * Load initial data
 */
async function loadInitialData() {
  try {
    // Load cookie/tracker data
    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_COOKIES',
      payload: { tabId: currentTab.id }
    });
    
    if (response.success) {
      updateQuickStats(response);
    }
  } catch (error) {
    console.warn('Failed to load initial data:', error);
  }
}

/**
 * Update quick stats
 */
function updateQuickStats(data) {
  document.getElementById('trackerCount').textContent = data.trackers?.length || 0;
  document.getElementById('cookieCount').textContent = data.cookies?.length || 0;
  
  // Privacy score from cache if available
  if (data.privacy_score) {
    document.getElementById('privacyScoreQuick').textContent = data.privacy_score;
  }
}

/**
 * Handle analyze button click
 */
async function handleAnalyze() {
  showView('loading');
  
  try {
    // Extract text from page
    const textResponse = await chrome.tabs.sendMessage(currentTab.id, {
      type: 'EXTRACT_TEXT'
    });
    
    if (!textResponse.success || !textResponse.text) {
      throw new Error('Failed to extract page text');
    }
    
    // Get analysis settings
    const settings = await chrome.storage.local.get(['analysisMode', 'preferredApiProvider']);
    const mode = settings.analysisMode || 'hybrid';
    const provider = settings.preferredApiProvider || 'auto';
    
    // Analyze document
    const analysisResponse = await chrome.runtime.sendMessage({
      type: 'ANALYZE_DOCUMENT',
      payload: {
        url: currentTab.url,
        text: textResponse.text,
        mode,
        provider
      }
    });
    
    if (!analysisResponse.success) {
      throw new Error(analysisResponse.error || 'Analysis failed');
    }
    
    // Display results
    currentAnalysis = analysisResponse;
    displayAnalysis(analysisResponse);
    showView('results');
    
  } catch (error) {
    console.error('Analysis error:', error);
    showNotification(error.message || 'Analysis failed', 'error');
    showView('initial');
  }
}

/**
 * Display analysis results
 */
function displayAnalysis(analysis) {
  // Update risk badge
  const riskBadge = document.getElementById('riskBadge');
  const risk = analysis.risk || 'Unknown';
  riskBadge.textContent = risk;
  riskBadge.className = 'badge badge-' + (risk === 'Safe' ? 'success' : risk === 'Watch' ? 'warning' : risk === 'Risky' ? 'danger' : 'neutral');
  
  // Update analysis source badge
  const sourceBadge = document.getElementById('analysisSourceBadge');
  const sourceBadgeText = document.getElementById('sourceBadgeText');
  const source = analysis.source || analysis.provider || 'Unknown';
  
  if (source.toLowerCase().includes('local') || source.toLowerCase().includes('heuristic')) {
    sourceBadge.classList.add('local');
    sourceBadgeText.textContent = 'Local Analysis';
  } else {
    sourceBadge.classList.remove('local');
    sourceBadgeText.textContent = `AI Analysis (${source})`;
  }
  sourceBadge.classList.remove('hidden');
  
  // Update privacy score
  const privacyScore = analysis.privacy_score || 0;
  document.getElementById('privacyScore').textContent = privacyScore;
  updateScoreCircle(privacyScore);
  
  // Update risk text
  document.getElementById('riskText').textContent = getRiskDescription(risk, privacyScore);
  
  // Update TL;DR
  document.getElementById('tldrText').textContent = analysis.tldr || 'No summary available';
  
  // Update concerns (red flags)
  const redFlags = analysis.red_flags || {};
  const concerns = Object.entries(redFlags)
    .filter(([_, value]) => value.toLowerCase().startsWith('yes'))
    .map(([key, value]) => ({
      key,
      text: value
    }));
  
  document.getElementById('concernsCount').textContent = concerns.length;
  
  const concernsList = document.getElementById('concernsList');
  concernsList.innerHTML = '';
  
  if (concerns.length === 0) {
    concernsList.innerHTML = '<p class="concern-text" style="padding: 12px 0;">No major concerns detected! 🎉</p>';
  } else {
    concerns.forEach(concern => {
      const item = document.createElement('div');
      item.className = 'concern-item';
      item.innerHTML = `
        <span class="concern-icon">⚠️</span>
        <span class="concern-text">${formatConcernText(concern.key)}: ${concern.text.replace(/^Yes\s*-\s*/i, '')}</span>
      `;
      concernsList.appendChild(item);
    });
  }
  
  // Update key points
  const bullets = analysis.bullets || [];
  document.getElementById('keyPointsCount').textContent = bullets.length;
  
  const bulletsList = document.getElementById('bulletsList');
  bulletsList.innerHTML = '';
  
  bullets.forEach(bullet => {
    const li = document.createElement('li');
    li.textContent = bullet;
    bulletsList.appendChild(li);
  });
}

/**
 * Update score circle (animated)
 */
function updateScoreCircle(score) {
  const circle = document.getElementById('scoreProgress');
  const circumference = 2 * Math.PI * 54; // radius = 54
  const progress = score / 100;
  const offset = circumference * (1 - progress);
  
  circle.style.strokeDashoffset = offset;
  
  // Color based on score
  if (score >= 70) {
    circle.style.stroke = 'var(--success)';
  } else if (score >= 40) {
    circle.style.stroke = 'var(--warning)';
  } else {
    circle.style.stroke = 'var(--danger)';
  }
}

/**
 * Get risk description
 */
function getRiskDescription(risk, score) {
  if (risk === 'Safe') {
    return 'Good privacy protections ✓';
  } else if (risk === 'Watch') {
    return 'Some privacy concerns';
  } else if (risk === 'Risky') {
    return 'Significant privacy risks ⚠️';
  } else {
    return 'Privacy analysis';
  }
}

/**
 * Format concern text
 */
function formatConcernText(key) {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Handle block trackers
 */
async function handleBlockTrackers() {
  try {
    // Get current state
    const { blockTrackers } = await chrome.storage.local.get('blockTrackers');
    const newState = !blockTrackers;
    
    const response = await chrome.runtime.sendMessage({
      type: 'BLOCK_TRACKERS',
      payload: { enabled: newState }
    });
    
    if (response && response.success) {
      showNotification(
        newState ? 'Trackers blocking enabled' : 'Trackers blocking disabled',
        'success'
      );
      // Update button state
      updateBlockTrackersButton(newState);
    } else {
      throw new Error(response?.error || 'Failed to toggle tracker blocking');
    }
  } catch (error) {
    console.error('Block trackers error:', error);
    showNotification(error.message || 'Failed to block trackers', 'error');
  }
}

/**
 * Update block trackers button state
 */
function updateBlockTrackersButton(enabled) {
  const btn = document.getElementById('blockTrackersBtn');
  if (enabled) {
    btn.classList.add('active');
    btn.querySelector('svg').style.stroke = 'var(--success)';
  } else {
    btn.classList.remove('active');
    btn.querySelector('svg').style.stroke = 'currentColor';
  }
}

/**
 * Handle auto-decline cookies
 */
async function handleAutoDecline() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'AUTO_DECLINE_COOKIES',
      payload: { tabId: currentTab.id }
    });
    
    if (response.success) {
      showNotification('Cookie banner declined', 'success');
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    showNotification('No cookie banner found or already declined', 'info');
  }
}

/**
 * Open full analysis view (switch to old popup)
 */
function openFullAnalysis() {
  // Store current analysis data
  if (currentAnalysis) {
    chrome.storage.local.set({ 
      lastAnalysis: currentAnalysis,
      openToTab: 'details'
    });
  }
  
  // Open old popup in new window
  chrome.windows.create({
    url: chrome.runtime.getURL('popup/popup.html'),
    type: 'popup',
    width: 600,
    height: 700
  });
  
  // Close current popup
  window.close();
}

/**
 * Open dashboard (switch to old popup)
 */
function openDashboard() {
  chrome.storage.local.set({ openToTab: 'dashboard' });
  chrome.windows.create({
    url: chrome.runtime.getURL('popup/popup.html'),
    type: 'popup',
    width: 600,
    height: 700
  });
  window.close();
}

/**
 * Open history (switch to old popup)
 */
function openHistory() {
  chrome.storage.local.set({ openToTab: 'history' });
  chrome.windows.create({
    url: chrome.runtime.getURL('popup/popup.html'),
    type: 'popup',
    width: 600,
    height: 700
  });
  window.close();
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Add styles if not already added
  if (!document.getElementById('toast-styles')) {
    const styles = document.createElement('style');
    styles.id = 'toast-styles';
    styles.textContent = `
      .toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        animation: toast-slide-in 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 90%;
        text-align: center;
      }
      .toast-success {
        background: var(--success, #22c55e);
        color: white;
      }
      .toast-error {
        background: var(--danger, #dc2626);
        color: white;
      }
      .toast-info {
        background: var(--primary, #6366f1);
        color: white;
      }
      .toast-warning {
        background: var(--warning, #f59e0b);
        color: white;
      }
      @keyframes toast-slide-in {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(toast);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'toast-slide-out 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Show specific view
 */
function showView(viewName) {
  document.getElementById('initialView').classList.add('hidden');
  document.getElementById('resultsView').classList.add('hidden');
  document.getElementById('loadingView').classList.add('hidden');
  
  document.getElementById(viewName + 'View').classList.remove('hidden');
}

