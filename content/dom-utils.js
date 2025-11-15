/**
 * DOM Utilities - Cross-browser and anti-tampering safe
 * Provides safe DOM manipulation that works even when websites modify prototypes
 */

// Cache native DOM methods before they can be modified
const nativeCreateElement = Document.prototype.createElement;
const nativeAppendChild = Node.prototype.appendChild;
const nativeInsertBefore = Node.prototype.insertBefore;
const nativeRemoveChild = Node.prototype.removeChild;
const nativeQuerySelector = Document.prototype.querySelector;
const nativeQuerySelectorAll = Document.prototype.querySelectorAll;

/**
 * Safe createElement - uses native method even if prototype is modified
 */
export function safeCreateElement(tagName, options) {
  try {
    return nativeCreateElement.call(document, tagName, options);
  } catch (error) {
    // Fallback to regular createElement if native fails
    return document.createElement(tagName, options);
  }
}

/**
 * Safe appendChild - uses native method
 */
export function safeAppendChild(parent, child) {
  try {
    return nativeAppendChild.call(parent, child);
  } catch (error) {
    // Fallback
    return parent.appendChild(child);
  }
}

/**
 * Safe insertBefore - uses native method
 */
export function safeInsertBefore(parent, child, reference) {
  try {
    return nativeInsertBefore.call(parent, child, reference);
  } catch (error) {
    return parent.insertBefore(child, reference);
  }
}

/**
 * Safe removeChild - uses native method
 */
export function safeRemoveChild(parent, child) {
  try {
    return nativeRemoveChild.call(parent, child);
  } catch (error) {
    return parent.removeChild(child);
  }
}

/**
 * Safe querySelector - uses native method
 */
export function safeQuerySelector(selector) {
  try {
    return nativeQuerySelector.call(document, selector);
  } catch (error) {
    return document.querySelector(selector);
  }
}

/**
 * Safe querySelectorAll - uses native method
 */
export function safeQuerySelectorAll(selector) {
  try {
    return nativeQuerySelectorAll.call(document, selector);
  } catch (error) {
    return document.querySelectorAll(selector);
  }
}

// For content scripts that can't use modules, expose globally
if (typeof window !== 'undefined') {
  window.PrivacyGuardDOM = {
    createElement: safeCreateElement,
    appendChild: safeAppendChild,
    insertBefore: safeInsertBefore,
    removeChild: safeRemoveChild,
    querySelector: safeQuerySelector,
    querySelectorAll: safeQuerySelectorAll,
  };
}

