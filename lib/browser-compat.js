/**
 * Cross-browser compatibility layer
 * Provides unified API for Chrome, Edge, Opera, Firefox, Brave, etc.
 */

// Detect browser and create unified API
const browserAPI = (function() {
  // Firefox uses 'browser' namespace, others use 'chrome'
  if (typeof browser !== 'undefined' && browser.runtime) {
    return browser;
  }
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome;
  }
  throw new Error('Extension API not available');
})();

// Export unified API
export const browserCompat = {
  // Runtime API
  runtime: {
    sendMessage: (...args) => {
      return new Promise((resolve, reject) => {
        if (browserAPI.runtime.sendMessage.length === 1) {
          // Firefox Promise-based API
          browserAPI.runtime.sendMessage(...args)
            .then(resolve)
            .catch(reject);
        } else {
          // Chrome callback-based API
          browserAPI.runtime.sendMessage(...args, (response) => {
            if (browserAPI.runtime.lastError) {
              reject(new Error(browserAPI.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        }
      });
    },
    
    onMessage: browserAPI.runtime.onMessage,
    getURL: browserAPI.runtime.getURL,
    onInstalled: browserAPI.runtime.onInstalled,
    onStartup: browserAPI.runtime.onStartup,
    onConnect: browserAPI.runtime.onConnect,
    
    lastError: browserAPI.runtime.lastError,
  },
  
  // Storage API
  storage: {
    local: {
      get: (...args) => {
        if (browserAPI.storage.local.get.length === 1) {
          // Firefox Promise-based
          return browserAPI.storage.local.get(...args);
        } else {
          // Chrome callback-based
          return new Promise((resolve, reject) => {
            browserAPI.storage.local.get(...args, (result) => {
              if (browserAPI.runtime.lastError) {
                reject(new Error(browserAPI.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });
        }
      },
      set: (...args) => {
        if (browserAPI.storage.local.set.length === 1) {
          return browserAPI.storage.local.set(...args);
        } else {
          return new Promise((resolve, reject) => {
            browserAPI.storage.local.set(...args, () => {
              if (browserAPI.runtime.lastError) {
                reject(new Error(browserAPI.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });
        }
      },
      remove: (...args) => {
        if (browserAPI.storage.local.remove.length === 1) {
          return browserAPI.storage.local.remove(...args);
        } else {
          return new Promise((resolve, reject) => {
            browserAPI.storage.local.remove(...args, () => {
              if (browserAPI.runtime.lastError) {
                reject(new Error(browserAPI.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });
        }
      },
    },
  },
  
  // Tabs API
  tabs: {
    query: (...args) => {
      if (browserAPI.tabs.query.length === 1) {
        return browserAPI.tabs.query(...args);
      } else {
        return new Promise((resolve, reject) => {
          browserAPI.tabs.query(...args, (result) => {
            if (browserAPI.runtime.lastError) {
              reject(new Error(browserAPI.runtime.lastError.message));
            } else {
              resolve(result);
            }
          });
        });
      }
    },
    sendMessage: (...args) => {
      if (browserAPI.tabs.sendMessage.length === 2) {
        return browserAPI.tabs.sendMessage(...args);
      } else {
        return new Promise((resolve, reject) => {
          browserAPI.tabs.sendMessage(...args, (response) => {
            if (browserAPI.runtime.lastError) {
              reject(new Error(browserAPI.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
      }
    },
    get: browserAPI.tabs.get,
    update: browserAPI.tabs.update,
    create: browserAPI.tabs.create,
  },
  
  // Action API (Chrome) / BrowserAction API (Firefox)
  action: browserAPI.action || browserAPI.browserAction,
  
  // Web Navigation API
  webNavigation: browserAPI.webNavigation,
  
  // Declarative Net Request API
  declarativeNetRequest: browserAPI.declarativeNetRequest,
  
  // Cookies API
  cookies: browserAPI.cookies,
  
  // Scripting API
  scripting: browserAPI.scripting,
  
  // Raw browser object for direct access if needed
  raw: browserAPI,
  
  // Browser detection
  isFirefox: typeof browser !== 'undefined' && browser.runtime && !chrome.runtime,
  isChrome: typeof chrome !== 'undefined' && chrome.runtime,
  browserName: (() => {
    if (typeof browser !== 'undefined' && browser.runtime && !chrome.runtime) {
      return 'firefox';
    }
    if (navigator.userAgent.includes('Edg')) return 'edge';
    if (navigator.userAgent.includes('OPR')) return 'opera';
    if (navigator.userAgent.includes('Brave')) return 'brave';
    return 'chrome';
  })(),
};

// For content scripts that can't use modules, expose globally
if (typeof window !== 'undefined') {
  window.PrivacyGuardBrowser = browserCompat;
}

