/**
 * AI-Powered Q&A Chat Interface
 */

let chatHistory = [];
let currentAnalysisContext = null;

/**
 * Initialize Q&A chat
 */
export function initializeQAChat(analysisContext) {
  currentAnalysisContext = analysisContext;
  setupChatUI();
}

/**
 * Setup chat UI
 */
function setupChatUI() {
  // This would be integrated into the popup HTML
  // For now, export functions for use
}

/**
 * Send question to AI
 */
export async function askQuestion(question) {
  if (!currentAnalysisContext) {
    return { error: 'No analysis context available. Please analyze a page first.' };
  }

  try {
    // Get API provider
    const { preferredApiProvider = 'auto' } = await chrome.storage.local.get('preferredApiProvider');
    
    // Send to background for AI processing
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'ASK_QUESTION',
        payload: {
          question,
          context: currentAnalysisContext,
          provider: preferredApiProvider,
        },
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });

    if (response?.success) {
      chatHistory.push({
        question,
        answer: response.answer,
        timestamp: new Date().toISOString(),
      });
      return response;
    }

    throw new Error(response?.error || 'Failed to get answer');
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Get chat history
 */
export function getChatHistory() {
  return chatHistory;
}

/**
 * Clear chat history
 */
export function clearChatHistory() {
  chatHistory = [];
}

