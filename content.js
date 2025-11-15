/**
 * Extract visible text from the current document by gathering text nodes.
 * Limits to the first ~15k characters to keep payloads manageable.
 */
function extractVisibleText() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const chunks = [];
  const maxLength = 15000;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node || !node.nodeValue || shouldSkipNode(node)) {
      continue;
    }

    const text = node.nodeValue.replace(/\s+/g, ' ').trim();
    if (text) {
      chunks.push(text);
      if (chunks.join(' ').length >= maxLength) {
        break;
      }
    }
  }

  return chunks.join(' ').slice(0, maxLength);
}

/**
 * Skip script/style nodes and hidden content ancestors.
 */
function shouldSkipNode(node) {
  const parent = node.parentElement;
  if (!parent) {
    return true;
  }

  const tag = parent.tagName;
  if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'META'].includes(tag)) {
    return true;
  }

  const style = window.getComputedStyle(parent);
  return style && (style.display === 'none' || style.visibility === 'hidden');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'EXTRACT_TEXT') {
    try {
      const text = extractVisibleText();
      sendResponse({ success: true, text });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
});
