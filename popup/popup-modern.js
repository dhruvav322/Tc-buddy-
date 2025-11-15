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
    showNotification('Opening dashboard...', 'info');
    // TODO: Open dashboard page
  });
  
  document.getElementById('navHistory').addEventListener('click', (e) => {
    e.preventDefault();
    showNotification('Opening history...', 'info');
    // TODO: Show history
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
  
  // See details
  document.getElementById('seeDetailsBtn').addEventListener('click', () => {
    showNotification('Full analysis view coming soon', 'info');
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
    const response = await chrome.runtime.sendMessage({
      type: 'BLOCK_TRACKERS',
      payload: { enabled: true }
    });
    
    if (response.success) {
      showNotification('Trackers blocked successfully', 'success');
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    showNotification('Failed to block trackers', 'error');
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
 * Show notification
 */
function showNotification(message, type = 'info') {
  // Simple console log for now
  // TODO: Implement toast notifications
  console.log(`[${type.toUpperCase()}]`, message);
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

