# Diagnostic Steps for Connection Error

## Step-by-Step Diagnosis

### 1. Check Service Worker Console (MOST IMPORTANT)

1. Open `chrome://extensions/`
2. Find **Privacy Guard**
3. Click **"service worker"** (blue link)
4. **Copy ALL errors** you see (red text)

**What to look for:**
- ✅ Green: "Privacy Guard service worker loaded successfully"
- ❌ Red: Any error messages
- ❌ "Service worker inactive"

### 2. Test Basic Connection

In the service worker console, paste this:
```javascript
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('Test listener received:', msg);
  sendResponse({ success: true, test: 'working' });
  return true;
});
console.log('Test listener added');
```

Then in popup console (right-click icon → Inspect popup), run:
```javascript
chrome.runtime.sendMessage({ type: 'TEST2' }, (r) => console.log('Response:', r));
```

### 3. Check for Import Errors

Look in service worker console for:
- `Failed to load module`
- `Cannot find module`
- `SyntaxError`
- Any file path errors

### 4. Verify Files Exist

Run this in terminal:
```bash
cd /Users/dhruvav/CascadeProjects/tc-buddy-extension
ls -la background/service-worker.js
ls -la background/analyzer.js
ls -la lib/api-manager.js
```

All should exist and be readable.

## Quick Test

1. **Reload extension** (click reload icon)
2. **Wait 5 seconds**
3. **Click "service worker"** link
4. **Check console** - should see "loaded successfully"
5. **Try popup** - click extension icon
6. **Check for errors** in both consoles

## If Service Worker Won't Start

The service worker might be crashing on import. Try this:

1. Temporarily rename `background/service-worker.js` to `background/service-worker.js.bak`
2. Copy `background/service-worker-simple.js` to `background/service-worker.js`
3. Reload extension
4. Test if connection works
5. If it works, the issue is with imports in the main service worker

## Share These Details

Please provide:
1. **Service worker console output** (all text, especially errors)
2. **Popup console output** (if you can open it)
3. **Chrome version** (chrome://version)
4. **What exactly happens** when you click extension icon

This will help identify the root cause.

