import { saveSecret, hasSecret } from '../lib/secure-storage.js';

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
    'blockTrackers',
    'blockNonEssentialCookies',
    'autoDeclineCookies',
    'autoDeclineConfirmations',
    'enforceNoNetworkMode',
    'criticalSiteList',
  ]);

  const criticalSites = settings.criticalSiteList || [];
  renderCriticalSites(criticalSites);

  // Analysis mode
  if (settings.analysisMode) {
    document.querySelector(`input[name="analysisMode"][value="${settings.analysisMode}"]`).checked = true;
  }

  // API provider
  if (settings.preferredApiProvider) {
    document.getElementById('apiProvider').value = settings.preferredApiProvider;
  }

  // API keys (masked via availability flag)
  await hydrateApiKeyField('deepseekKey', 'deepseekApiKey');
  await hydrateApiKeyField('openaiKey', 'openaiApiKey');
  await hydrateApiKeyField('anthropicKey', 'anthropicApiKey');
  await hydrateApiKeyField('geminiKey', 'geminiApiKey');

  // Toggles
  document.getElementById('blockTrackers').checked = settings.blockTrackers || false;
  document.getElementById('blockCookies').checked = settings.blockNonEssentialCookies || false;
  document.getElementById('autoDecline').checked = settings.autoDeclineCookies || false;
  document.getElementById('autoDeclineConfirmations').checked = settings.autoDeclineConfirmations ?? true;
  document.getElementById('enforceNoNetworkMode').checked = settings.enforceNoNetworkMode || false;
}

async function hydrateApiKeyField(inputId, storageKey) {
  const hasKey = await hasSecret(storageKey);
  const input = document.getElementById(inputId);
  if (hasKey) {
    input.dataset.hasValue = 'true';
    input.value = '••••••••';
  } else {
    input.dataset.hasValue = 'false';
    input.value = '';
  }
}

function renderCriticalSites(list) {
  const container = document.getElementById('criticalSiteList');
  container.innerHTML = '';
  if (!Array.isArray(list) || list.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No protected domains yet.';
    empty.style.color = '#64748b';
    container.appendChild(empty);
    return;
  }
  list.forEach(domain => {
    const chip = document.createElement('div');
    chip.className = 'domain-chip';
    chip.innerHTML = `
      <span>${domain}</span>
      <button type="button" data-domain="${domain}" aria-label="Remove ${domain}">✕</button>
    `;
    container.appendChild(chip);
  });
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
  setupSecureKeySaver('saveDeepseek', 'deepseekKey', 'deepseekApiKey', 'Deepseek');
  setupSecureKeySaver('saveOpenAI', 'openaiKey', 'openaiApiKey', 'OpenAI');
  setupSecureKeySaver('saveAnthropic', 'anthropicKey', 'anthropicApiKey', 'Anthropic');
  setupSecureKeySaver('saveGemini', 'geminiKey', 'geminiApiKey', 'Gemini');

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

  document.getElementById('autoDeclineConfirmations').addEventListener('change', (e) => {
    chrome.storage.local.set({ autoDeclineConfirmations: e.target.checked });
    showNotification('Confirmation prompts ' + (e.target.checked ? 'enabled' : 'disabled'));
  });

  document.getElementById('enforceNoNetworkMode').addEventListener('change', (e) => {
    chrome.storage.local.set({ enforceNoNetworkMode: e.target.checked });
    showNotification('No-network mode ' + (e.target.checked ? 'locked to local' : 'allows AI'));
  });

  document.getElementById('addCriticalDomain').addEventListener('click', async () => {
    const input = document.getElementById('criticalDomainInput');
    const domain = sanitizeDomain(input.value);
    if (!domain) {
      showNotification('Enter a valid domain', 'error');
      return;
    }
    const { criticalSiteList = [] } = await chrome.storage.local.get('criticalSiteList');
    if (criticalSiteList.includes(domain)) {
      showNotification('Domain already protected', 'error');
      return;
    }
    const updated = [...criticalSiteList, domain];
    await chrome.storage.local.set({ criticalSiteList: updated });
    renderCriticalSites(updated);
    input.value = '';
    showNotification('Domain protected');
  });

  document.getElementById('criticalSiteList').addEventListener('click', async (event) => {
    const target = event.target;
    if (target.tagName === 'BUTTON' && target.dataset.domain) {
      const domain = target.dataset.domain;
      const { criticalSiteList = [] } = await chrome.storage.local.get('criticalSiteList');
      const updated = criticalSiteList.filter(item => item !== domain);
      await chrome.storage.local.set({ criticalSiteList: updated });
      renderCriticalSites(updated);
      showNotification(`Removed ${domain}`);
    }
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

  document.getElementById('exportActivityLog').addEventListener('click', async () => {
    const { privacyGuardActivityLog = [] } = await chrome.storage.local.get('privacyGuardActivityLog');
    const blob = new Blob([JSON.stringify(privacyGuardActivityLog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacy-guard-activity-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Activity log exported');
  });
}

function sanitizeDomain(value) {
  const trimmed = (value || '').trim().toLowerCase();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    return url.hostname;
  } catch (_e) {
    return null;
  }
}

function setupSecureKeySaver(buttonId, inputId, storageKey, label) {
  const button = document.getElementById(buttonId);
  button.addEventListener('click', async () => {
    const input = document.getElementById(inputId);
    const key = input.value.trim();
    if (!key) {
      await saveSecret(storageKey, '');
      input.dataset.hasValue = 'false';
      input.value = '';
      showNotification(`${label} key cleared`);
      return;
    }
    if (key === '••••••••') {
      showNotification('Please enter a new API key (not the placeholder)', 'error');
      return;
    }
    try {
      await saveSecret(storageKey, key);
      input.dataset.hasValue = 'true';
      input.value = '••••••••';
      showNotification(`✅ ${label} API key saved securely`);
    } catch (error) {
      console.error(`Failed to save ${label} key`, error);
      showNotification('Failed to save API key: ' + error.message, 'error');
    }
  });
}

function showNotification(message, type = 'success') {
  // Simple notification
  const notification = document.createElement('div');
  const bgColor = type === 'error' ? '#ef4444' : '#10b981';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    font-size: 14px;
    max-width: 400px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 4000);
}

