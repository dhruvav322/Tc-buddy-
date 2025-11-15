/**
 * Text highlighter for suspicious clauses
 * Highlights red flag text on the page
 */

// Cache native DOM methods before websites can modify them
const nativeCreateElement = Document.prototype.createElement;

const HIGHLIGHT_CLASS = 'privacy-guard-highlight';
const HIGHLIGHT_COLOR = '#fef3c7';

/**
 * Highlight text snippets on page
 * @param {string[]} snippets - Text snippets to highlight
 */
function highlightSnippets(snippets) {
  // Remove existing highlights
  clearHighlights();

  if (!snippets || snippets.length === 0) return;

  for (const snippet of snippets) {
    highlightText(snippet);
  }
}

/**
 * Highlight specific text
 */
function highlightText(text) {
  if (!text || text.length < 10) return;

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );

  const target = text.toLowerCase().trim();
  const nodes = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const value = node.nodeValue;
    if (!value) continue;

    const index = value.toLowerCase().indexOf(target);
    if (index !== -1) {
      nodes.push({ node, index, length: text.length });
    }
  }

  // Highlight found nodes
  for (const { node, index, length } of nodes) {
    try {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + length);

      // Use cached native createElement to avoid conflicts with modified prototypes
      let mark;
      try {
        mark = nativeCreateElement.call(document, 'mark');
      } catch (error) {
        mark = document.createElement('mark');
      }
      
      mark.className = HIGHLIGHT_CLASS;
      mark.style.backgroundColor = HIGHLIGHT_COLOR;
      mark.style.padding = '2px 4px';
      mark.style.borderRadius = '2px';
      mark.style.cursor = 'pointer';
      mark.title = 'Privacy Guard: Potential concern detected';

      try {
        range.surroundContents(mark);
      } catch (error) {
        // If surroundContents fails, skip this highlight
        console.warn('Could not highlight text:', error);
      }
    } catch (error) {
      // Skip if range extraction fails
    }
  }
}

/**
 * Clear all highlights
 */
function clearHighlights() {
  const highlights = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    }
  });
}

/**
 * Highlight red flag keywords
 */
function highlightRedFlags(redFlags) {
  const keywords = [];
  
  for (const [key, value] of Object.entries(redFlags || {})) {
    if (value.startsWith('Yes')) {
      // Extract keyword from value
      const match = value.match(/"([^"]+)"/);
      if (match) {
        keywords.push(match[1]);
      }
    }
  }

  if (keywords.length > 0) {
    highlightSnippets(keywords);
  }
}

// Listen for highlight requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.type === 'HIGHLIGHT_TEXT') {
      highlightSnippets(message.payload?.snippets || []);
      sendResponse({ success: true });
      return true;
    } else if (message.type === 'HIGHLIGHT_RED_FLAGS') {
      highlightRedFlags(message.payload?.redFlags);
      sendResponse({ success: true });
      return true;
    } else if (message.type === 'CLEAR_HIGHLIGHTS') {
      clearHighlights();
      sendResponse({ success: true });
      return true;
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
    return true;
  }
  
  return false; // Not handled
});

