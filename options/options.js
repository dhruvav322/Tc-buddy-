/**
 * Privacy Guard Options Page Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

async function loadSettings() {
  const settings = await chrome.storage.local.get([
    'analysisMode',
    'preferredApiProvider',
    'deepseekApiKey',
    'openaiApiKey',
    'anthropicApiKey',
    'geminiApiKey',
    'blockTrackers',
    'blockNonEssentialCookies',
    'autoDeclineCookies',
  ]);

  // Analysis mode
  if (settings.analysisMode) {
    document.querySelector(`input[name="analysisMode"][value="${settings.analysisMode}"]`).checked = true;
  }

  // API provider
  if (settings.preferredApiProvider) {
    document.getElementById('apiProvider').value = settings.preferredApiProvider;
  }

  // API keys (masked)
  if (settings.deepseekApiKey) {
    document.getElementById('deepseekKey').value = maskKey(settings.deepseekApiKey);
  }
  if (settings.openaiApiKey) {
    document.getElementById('openaiKey').value = maskKey(settings.openaiApiKey);
  }
  if (settings.anthropicApiKey) {
    document.getElementById('anthropicKey').value = maskKey(settings.anthropicApiKey);
  }
  if (settings.geminiApiKey) {
    document.getElementById('geminiKey').value = maskKey(settings.geminiApiKey);
  }

  // Toggles
  document.getElementById('blockTrackers').checked = settings.blockTrackers || false;
  document.getElementById('blockCookies').checked = settings.blockNonEssentialCookies || false;
  document.getElementById('autoDecline').checked = settings.autoDeclineCookies || false;
}

function maskKey(key) {
  if (!key || key.length < 8) return key;
  return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}

function setupEventListeners() {
  // Analysis mode
  document.querySelectorAll('input[name="analysisMode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      chrome.storage.local.set({ analysisMode: e.target.value });
      showNotification('Analysis mode saved');
    });
  });

  // API provider
  document.getElementById('apiProvider').addEventListener('change', (e) => {
    chrome.storage.local.set({ preferredApiProvider: e.target.value });
    showNotification('API provider saved');
  });

  // API keys
  document.getElementById('saveDeepseek').addEventListener('click', () => {
    const key = document.getElementById('deepseekKey').value.trim();
    if (key && !key.includes('...')) {
      chrome.storage.local.set({ deepseekApiKey: key });
      showNotification('Deepseek API key saved');
    }
  });

  document.getElementById('saveOpenAI').addEventListener('click', () => {
    const key = document.getElementById('openaiKey').value.trim();
    if (key && !key.includes('...')) {
      chrome.storage.local.set({ openaiApiKey: key });
      showNotification('OpenAI API key saved');
    }
  });

  document.getElementById('saveAnthropic').addEventListener('click', () => {
    const key = document.getElementById('anthropicKey').value.trim();
    if (key && !key.includes('...')) {
      chrome.storage.local.set({ anthropicApiKey: key });
      showNotification('Anthropic API key saved');
    }
  });

  document.getElementById('saveGemini').addEventListener('click', () => {
    const key = document.getElementById('geminiKey').value.trim();
    if (key && !key.includes('...')) {
      chrome.storage.local.set({ geminiApiKey: key });
      showNotification('Gemini API key saved');
    }
  });

  // Privacy preferences
  document.getElementById('blockTrackers').addEventListener('change', (e) => {
    chrome.runtime.sendMessage({
      type: 'BLOCK_TRACKERS',
      payload: { enabled: e.target.checked },
    });
    chrome.storage.local.set({ blockTrackers: e.target.checked });
    showNotification('Tracker blocking ' + (e.target.checked ? 'enabled' : 'disabled'));
  });

  document.getElementById('blockCookies').addEventListener('change', (e) => {
    chrome.storage.local.set({ blockNonEssentialCookies: e.target.checked });
    showNotification('Cookie blocking ' + (e.target.checked ? 'enabled' : 'disabled'));
  });

  document.getElementById('autoDecline').addEventListener('change', (e) => {
    chrome.storage.local.set({ autoDeclineCookies: e.target.checked });
    showNotification('Auto-decline ' + (e.target.checked ? 'enabled' : 'disabled'));
  });

  // Data management
  document.getElementById('clearCache').addEventListener('click', async () => {
    if (confirm('Clear all cached analysis results?')) {
      await chrome.storage.local.remove('privacyGuardCache');
      showNotification('Cache cleared');
    }
  });

  document.getElementById('clearHistory').addEventListener('click', async () => {
    if (confirm('Clear all analysis history?')) {
      await chrome.storage.local.remove('privacyGuardHistory');
      showNotification('History cleared');
    }
  });

  document.getElementById('exportData').addEventListener('click', async () => {
    const data = await chrome.storage.local.get(null);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacy-guard-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Data exported');
  });
}

function showNotification(message) {
  // Simple notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

