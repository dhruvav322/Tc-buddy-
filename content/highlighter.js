/**
 * Text highlighter for suspicious clauses
 * Highlights red flag text on the page
 */

// Cache native DOM methods before websites can modify them (use shared namespace to avoid conflicts)
if (typeof window.PrivacyGuardNative === 'undefined') {
  window.PrivacyGuardNative = {
    createElement: Document.prototype.createElement,
    appendChild: Node.prototype.appendChild,
  };
}
// Use var to allow redeclaration across multiple content scripts
var nativeCreateElement = window.PrivacyGuardNative.createElement.bind(document);

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

  // Wait for body to be ready
  if (!document.body) {
    console.warn('Document body not ready for highlighting');
    return;
  }

  try {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip script and style tags
          const parent = node.parentElement;
          if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const target = text.toLowerCase().trim();
    const nodes = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const value = node.nodeValue;
      if (!value || value.trim().length === 0) continue;

      const index = value.toLowerCase().indexOf(target);
      if (index !== -1) {
        nodes.push({ node, index, length: target.length });
      }
    }

    // Highlight found nodes (process in reverse to avoid offset issues)
    for (let i = nodes.length - 1; i >= 0; i--) {
      const { node, index, length } = nodes[i];
      try {
        // Check if node still exists and is in the document
        if (!node.parentNode || !document.body.contains(node)) {
          continue;
        }

        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + length);

        // Use cached native createElement to avoid conflicts with modified prototypes
        let mark;
        try {
          mark = nativeCreateElement('mark');
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
          // If surroundContents fails, try alternative method
          try {
            const textNode = node.splitText(index);
            textNode.splitText(length);
            const parent = node.parentNode;
            if (parent) {
              parent.insertBefore(mark, textNode);
              mark.appendChild(textNode);
            }
          } catch (e) {
            console.warn('Could not highlight text:', e);
          }
        }
      } catch (error) {
        // Skip if range extraction fails
        console.warn('Error highlighting text:', error);
      }
    }
  } catch (error) {
    console.error('Error in highlightText:', error);
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
  
  if (!redFlags || typeof redFlags !== 'object') {
    console.warn('Invalid red flags data for highlighting');
    return;
  }

  for (const [key, value] of Object.entries(redFlags)) {
    if (value && typeof value === 'string' && value.toLowerCase().startsWith('yes')) {
      // Extract keyword from value (format: "Yes - mentions "keyword"")
      const match = value.match(/"([^"]+)"/);
      if (match && match[1]) {
        keywords.push(match[1]);
      } else {
        // Fallback: use the key name as keyword
        const keyWords = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1));
        keywords.push(keyWords.join(' '));
      }
    }
  }

  if (keywords.length > 0) {
    console.log('Highlighting keywords:', keywords);
    highlightSnippets(keywords);
  } else {
    console.log('No keywords found to highlight');
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

