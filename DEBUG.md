# Debug Guide - Service Worker Connection Issues

## Quick Diagnostic Steps

### 1. Check Service Worker Status

1. Go to `chrome://extensions/`
2. Find "Privacy Guard"
3. Click the **"service worker"** link (should be blue/underlined)
4. This opens the service worker console

**What to look for:**
- ✅ Console shows "Privacy Guard service worker loaded successfully"
- ❌ Red errors in console
- ❌ "Service worker inactive" message

### 2. Check for Import Errors

In the service worker console, look for:
- `Failed to load module`
- `SyntaxError`
- `ReferenceError`
- Any red error messages

### 3. Test Message Connection

In the service worker console, run:
```javascript
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('Test message received:', msg);
  sendResponse({ success: true, test: 'working' });
  return true;
});
```

Then in popup console, try:
```javascript
chrome.runtime.sendMessage({ type: 'TEST' }, (response) => {
  console.log('Response:', response);
});
```

### 4. Check Popup Console

1. Right-click extension icon
2. Select "Inspect popup"
3. Check Console tab for errors

### 5. Common Issues

#### Issue: Service Worker Crashes on Load
**Symptoms**: Service worker shows as "inactive" immediately

**Possible causes**:
- Import error in service-worker.js
- Syntax error in imported modules
- Circular dependency

**Fix**:
1. Check service worker console for specific error
2. Verify all imports are correct
3. Check that all exported functions exist

#### Issue: "Receiving end does not exist"
**Symptoms**: Error when clicking buttons in popup

**Possible causes**:
- Service worker crashed
- Message handler not registered
- Service worker terminated

**Fix**:
1. Reload extension
2. Wait 2-3 seconds after reload
3. Check service worker is active
4. Try clicking button again

#### Issue: Import Errors
**Symptoms**: Module not found errors

**Fix**:
1. Verify all file paths are correct
2. Check manifest.json paths
3. Ensure all files exist

## Manual Test

### Test 1: Basic Service Worker
1. Reload extension
2. Open service worker console
3. Should see "Privacy Guard service worker loaded successfully"
4. If not, check for errors

### Test 2: Message Handling
1. Open popup
2. Open popup console (right-click → Inspect)
3. Run: `chrome.runtime.sendMessage({ type: 'TEST' }, console.log)`
4. Should get a response (even if error)

### Test 3: Analysis
1. Go to a Terms & Conditions page
2. Open popup
3. Click "Analyze This Page"
4. Check both popup and service worker consoles

## If Still Not Working

1. **Check Chrome Version**: Must be 110+ for Manifest V3
2. **Try Incognito Mode**: Rule out extension conflicts
3. **Check Other Extensions**: Disable other extensions temporarily
4. **Clear Extension Data**: Remove and reinstall
5. **Check File Permissions**: Make sure all files are readable

## Get Specific Error

Please share:
1. Service worker console output (screenshot or copy text)
2. Popup console output
3. Any error messages you see
4. Chrome version

This will help identify the exact issue.

