const analyzeBtn = document.getElementById('analyzeBtn');
const retryBtn = document.getElementById('retryBtn');
const loadingState = document.getElementById('loadingState');
const summarySection = document.getElementById('summarySection');
const riskBadge = document.getElementById('riskBadge');
const bulletsList = document.getElementById('bullets');
const redFlagsContainer = document.getElementById('redFlags');
const tldrEl = document.getElementById('tldr');
const summarySourceEl = document.getElementById('summarySource');
const copyBtn = document.getElementById('copyBtn');
const processToggle = document.getElementById('processToggle');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const toggleKeyVisibility = document.getElementById('toggleKeyVisibility');
const keyStatus = document.getElementById('keyStatus');

let processLocally = false;
let lastSummary = null;

initialize();

function initialize() {
  chrome.storage.local.get(['processLocally', 'deepseekApiKey']).then((data) => {
    processLocally = Boolean(data.processLocally);
    if (processLocally) {
      processToggle.classList.add('toggle-on');
      processToggle.setAttribute('aria-checked', 'true');
    }

    if (data.deepseekApiKey) {
      apiKeyInput.value = data.deepseekApiKey;
      keyStatus.textContent = 'Key loaded from storage.';
    }
  });

  analyzeBtn.addEventListener('click', () => handleAnalyze());
  retryBtn.addEventListener('click', () => handleAnalyze());
  copyBtn.addEventListener('click', () => handleCopy());
  processToggle.addEventListener('click', toggleProcessMode);
  processToggle.addEventListener('keypress', (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      toggleProcessMode();
    }
  });
  saveKeyBtn.addEventListener('click', saveApiKey);
  toggleKeyVisibility.addEventListener('click', togglePasswordVisibility);
}

function toggleProcessMode() {
  processLocally = !processLocally;
  processToggle.classList.toggle('toggle-on', processLocally);
  processToggle.setAttribute('aria-checked', processLocally.toString());
  chrome.storage.local.set({ processLocally });
}

async function handleAnalyze() {
  setLoading(true);
  summarySection.classList.add('hidden');
  retryBtn.classList.add('hidden');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const text = await extractTextFromTab(tab.id);

    const response = await chrome.runtime.sendMessage({
      type: 'PROCESS_DOCUMENT',
      payload: {
        url: tab.url,
        text,
        processLocally,
      },
    });

    if (!response?.success) {
      throw new Error(response?.error || 'Unknown error');
    }

    lastSummary = response.summary;
    updateSummaryUI(response.summary, response.source);
  } catch (error) {
    console.error('Analysis failed', error);
    displayError(error.message);
    retryBtn.classList.remove('hidden');
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  if (isLoading) {
    loadingState.classList.remove('hidden');
    analyzeBtn.classList.add('hidden');
  } else {
    loadingState.classList.add('hidden');
    analyzeBtn.classList.remove('hidden');
  }
}

function updateSummaryUI(summary, source) {
  if (!summary) {
    return;
  }

  tldrEl.textContent = summary.tldr || 'No summary available.';
  summarySourceEl.textContent = formatSource(source);
  renderBullets(summary.bullets || []);
  renderRedFlags(summary.red_flags || {});
  updateRiskBadge(summary.risk || 'Watch');

  summarySection.classList.remove('hidden');
}

function formatSource(source) {
  if (source === 'local') {
    return 'Local scan';
  }
  if (source === 'cache') {
    return 'Cached';
  }
  if (source === 'api') {
    return 'Deepseek API';
  }
  return '';
}

function renderBullets(bullets) {
  bulletsList.innerHTML = '';
  bullets.forEach((bullet) => {
    const li = document.createElement('li');
    li.textContent = bullet;
    li.className = 'p-2 rounded-md bg-blue-50 text-slate-700 cursor-pointer transition hover:bg-slate-100';
    li.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'HIGHLIGHT_TEXT', payload: { snippet: bullet } });
    });
    bulletsList.appendChild(li);
  });
}

function renderRedFlags(flags) {
  redFlagsContainer.innerHTML = '';
  Object.entries(flags).forEach(([label, value]) => {
    const card = document.createElement('div');
    const isRisky = value.startsWith('Yes');
    const textClass = isRisky ? 'text-red-700' : 'text-slate-700';
    const bgClass = isRisky ? 'bg-red-100' : 'bg-slate-50';

    card.className = `rounded-md p-3 ${bgClass}`;
    card.innerHTML = `
      <h4 class="text-sm font-semibold text-slate-800">${label}</h4>
      <p class="text-xs ${textClass} leading-snug mt-2">${value}</p>
    `;
    redFlagsContainer.appendChild(card);
  });
}

function updateRiskBadge(risk) {
  let badgeClass = 'bg-slate-100 text-slate-500';
  let ringClass = '';
  if (risk === 'Safe') {
    badgeClass = 'bg-emerald-100 text-emerald-700';
    ringClass = 'ring-emerald-400';
  } else if (risk === 'Watch') {
    badgeClass = 'bg-orange-100 text-orange-700';
    ringClass = 'ring-orange-400';
  } else if (risk === 'Risky') {
    badgeClass = 'bg-red-100 text-red-700';
    ringClass = 'ring-red-400';
  }

  riskBadge.className = `badge ${badgeClass} ${ringClass}`;
  riskBadge.textContent = risk;
}

async function extractTextFromTab(tabId) {
  const response = await chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_TEXT' });
  if (!response?.success) {
    throw new Error(response?.error || 'Failed to extract text from page.');
  }
  return response.text;
}

function handleCopy() {
  if (!lastSummary) {
    return;
  }

  const message = buildSupportMessage(lastSummary);
  navigator.clipboard.writeText(message).then(() => {
    keyStatus.textContent = 'Support message copied to clipboard!';
    setTimeout(() => {
      keyStatus.textContent = '';
    }, 3000);
  });
}

function buildSupportMessage(summary) {
  const lines = [
    'Hello Support Team,',
    '',
    'I recently reviewed your Terms & Conditions and found clauses that raise some concerns:',
  ];

  Object.entries(summary.red_flags || {}).forEach(([label, reason]) => {
    if (reason.startsWith('Yes')) {
      lines.push(`- ${label}: ${reason}`);
    }
  });

  lines.push(
    '',
    'Given these points, I would like to request a cancellation/refund and confirmation of closure. Thank you for your help!'
  );

  return lines.join('\n');
}

function saveApiKey() {
  const key = apiKeyInput.value.trim();
  if (!key) {
    keyStatus.textContent = 'Please enter a valid API key.';
    return;
  }

  chrome.storage.local.set({ deepseekApiKey: key }).then(() => {
    keyStatus.textContent = 'API key saved securely.';
    setTimeout(() => {
      keyStatus.textContent = '';
    }, 3000);
  });
}

function togglePasswordVisibility() {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleKeyVisibility.textContent = 'Hide';
  } else {
    apiKeyInput.type = 'password';
    toggleKeyVisibility.textContent = 'Show';
  }
}

function displayError(message) {
  keyStatus.textContent = message || 'Something went wrong. Please try again.';
  keyStatus.classList.add('text-red-700');
  setTimeout(() => {
    keyStatus.textContent = '';
    keyStatus.classList.remove('text-red-700');
  }, 4000);
}
