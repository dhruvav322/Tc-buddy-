import { callDeepseek } from './deepseek.js';

const CACHE_KEY = 'tcBuddyCache';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours cache window

/**
 * Handle routed runtime messages from the popup/content scripts.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'PROCESS_DOCUMENT') {
    handleProcessDocument(message.payload)
      .then((result) => sendResponse({ success: true, ...result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message?.type === 'HIGHLIGHT_TEXT') {
    handleHighlightRequest(message.payload)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  return undefined;
});

/**
 * Process the document either via Deepseek API or the offline heuristic fallback.
 * @param {{ url: string; text: string; processLocally: boolean }} payload
 */
async function handleProcessDocument(payload) {
  const { url, text, processLocally } = payload || {};

  if (!url || !text) {
    throw new Error('Missing source URL or document text.');
  }

  if (processLocally) {
    const summary = buildLocalSummary(text);
    return { summary, source: 'local' };
  }

  const cached = await getCachedSummary(url);
  if (cached) {
    return { summary: cached, source: 'cache' };
  }

  const summary = await callDeepseek(text);
  await setCachedSummary(url, summary);
  return { summary, source: 'api' };
}

/**
 * Retrieve an entry from chrome.storage.local if it is still valid.
 */
async function getCachedSummary(url) {
  const { [CACHE_KEY]: cache = {} } = await chrome.storage.local.get(CACHE_KEY);
  const entry = cache[url];
  if (!entry) {
    return null;
  }

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    return null;
  }

  return entry.summary;
}

/**
 * Persist a fetched summary in chrome.storage.local under the current URL.
 */
async function setCachedSummary(url, summary) {
  const { [CACHE_KEY]: cache = {} } = await chrome.storage.local.get(CACHE_KEY);
  cache[url] = {
    summary,
    timestamp: Date.now(),
  };
  await chrome.storage.local.set({ [CACHE_KEY]: cache });
}

/**
 * Offline fallback summarizer that flags obvious concerns using keyword heuristics.
 */
function buildLocalSummary(text) {
  const normalizedText = (text || '').toLowerCase();

  const redFlags = {
    'Auto-renewal': keywordDetected(normalizedText, ['auto-renew', 'automatic renewal', 'recurring subscription', 'renews automatically']),
    'No refunds': keywordDetected(normalizedText, ['no refund', 'non-refundable', 'all sales final']),
    'Hidden fees': keywordDetected(normalizedText, ['additional fee', 'processing fee', 'service fee', 'handling fee']),
    'Arbitration clause': keywordDetected(normalizedText, ['binding arbitration', 'arbitration', 'class action waiver']),
    'Data sharing': keywordDetected(normalizedText, ['share your data', 'third parties', 'affiliates', 'partners may receive information']),
    'Mandatory account': keywordDetected(normalizedText, ['must create an account', 'account required', 'registration required']),
    'Broad license': keywordDetected(normalizedText, ['perpetual license', 'irrevocable license', 'worldwide license']),
    'Tracking cookies': keywordDetected(normalizedText, ['tracking cookies', 'cookies to track', 'analytics cookies']),
  };

  const yesCount = Object.values(redFlags).filter((flag) => flag.startsWith('Yes')).length;

  const risk = yesCount >= 4 ? 'Risky' : yesCount >= 2 ? 'Watch' : 'Safe';

  const bullets = buildLocalBullets(normalizedText, redFlags);

  return {
    tldr: yesCount
      ? 'Potential concerns detected — review fees, data use, and dispute terms carefully.'
      : 'No obvious red flags detected, but policies may still contain legal nuances.',
    bullets,
    red_flags: redFlags,
    risk,
  };
}

/**
 * Compose a set of local summary bullets based on heuristics.
 */
function buildLocalBullets(text, redFlags) {
  const bullets = [];

  if (keywordDetected(text, ['collect', 'data', 'information'])) {
    bullets.push('Collects user data for service delivery; review how it may be shared.');
  } else {
    bullets.push('Mentions basic data collection — details unclear.');
  }

  bullets.push(
    redFlags['Auto-renewal'].startsWith('Yes')
      ? 'Subscription appears to auto-renew; set reminders to cancel early.'
      : 'No clear auto-renewal language spotted from quick scan.'
  );

  bullets.push(
    redFlags['No refunds'].startsWith('Yes')
      ? 'Refunds seem limited or unavailable once charged.'
      : 'Refund language not obvious; confirm policy when signing up.'
  );

  bullets.push(
    redFlags['Arbitration clause'].startsWith('Yes')
      ? 'Disputes may require private arbitration and waive court options.'
      : 'Dispute process unclear; check for legal venue or arbitration language.'
  );

  return bullets;
}

/**
 * Helper to detect keyword groups and return explanation.
 */
function keywordDetected(text, keywords) {
  if (!text) {
    return 'No - insufficient information';
  }

  const found = keywords.find((keyword) => text.includes(keyword));
  if (found) {
    return `Yes - mentions "${found}"`; // Provide minimal reasoning
  }

  return 'No - not spotted in quick scan';
}

/**
 * Fire off a highlighting script in the active tab to surface relevant clauses.
 */
async function handleHighlightRequest(payload) {
  const snippet = payload?.snippet;
  if (!snippet) {
    throw new Error('No text snippet provided for highlighting.');
  }

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) {
    throw new Error('Unable to locate the active tab for highlighting.');
  }

  await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: highlightInPage,
    args: [snippet, '#fde68a'],
  });
}

/**
 * Injected into the page to highlight matching text snippets.
 */
function highlightInPage(snippet, color) {
  if (!snippet) {
    return;
  }

  const highlightClass = 'tc-buddy-highlight';

  document.querySelectorAll(`.${highlightClass}`).forEach((node) => {
    const textNode = document.createTextNode(node.textContent || '');
    node.replaceWith(textNode);
  });

  const cleanedSnippet = snippet.trim();
  if (!cleanedSnippet) {
    return;
  }

  const range = findRangeForSnippet(cleanedSnippet);
  if (!range) {
    return;
  }

  const mark = document.createElement('mark');
  mark.className = highlightClass;
  mark.style.backgroundColor = color || '#fde68a';
  mark.style.padding = '0 2px';
  mark.style.borderRadius = '2px';

  try {
    mark.appendChild(range.extractContents());
    range.insertNode(mark);
    mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    // Ignore extraction errors for complex nodes.
  }
}

/**
 * Locate a Range for the provided snippet using basic text node traversal.
 */
function findRangeForSnippet(snippet) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  const target = snippet.toLowerCase();

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const value = node.nodeValue;
    if (!value) {
      continue;
    }

    const index = value.toLowerCase().indexOf(target);
    if (index !== -1) {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + snippet.length);
      return range;
    }
  }

  return null;
}
