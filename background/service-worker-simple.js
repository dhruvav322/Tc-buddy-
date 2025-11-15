/**
 * Simplified Service Worker - Fallback if main one fails
 * This is a minimal version to test if the issue is with imports
 */

console.log('Service worker starting...');

// Basic message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message.type);
  
  try {
    // Always respond to prevent connection errors
    if (message.type === 'ANALYZE_DOCUMENT') {
      // For now, return a simple response
      sendResponse({ 
        success: true, 
        tldr: 'Service worker is running. Please reload extension to use full features.',
        bullets: ['Service worker initialized'],
        red_flags: {},
        risk: 'Watch',
        privacy_score: 50,
        readability_score: 12,
      });
      return true;
    }
    
    // Default response for any message
    sendResponse({ success: true, message: 'Service worker is running' });
    return true;
  } catch (error) {
    sendResponse({ success: false, error: error.message });
    return true;
  }
});

console.log('Service worker loaded successfully');

