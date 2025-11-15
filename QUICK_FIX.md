# Quick Fix for "Connection Error"

## Immediate Steps

### Step 1: Check Service Worker Console

1. Go to `chrome://extensions/`
2. Find **Privacy Guard**
3. Click the **"service worker"** link (blue text)
4. **Look for errors** in the console

**What you should see:**
```
Privacy Guard service worker loading...
Privacy Guard service worker loaded successfully
```

**If you see errors**, copy them and share them.

### Step 2: Reload Extension

1. In `chrome://extensions/`
2. Click the **reload icon** (circular arrow) on Privacy Guard
3. Wait 3 seconds
4. Click "service worker" again
5. Check if it's now working

### Step 3: Test Connection

1. Open the test page: Load `test-connection.html` in a new tab
   - Or right-click extension icon → Inspect popup
   - In console, run: `chrome.runtime.sendMessage({ type: 'TEST' }, console.log)`

2. **If test works**: Service worker is running, issue is elsewhere
3. **If test fails**: Service worker is not running

## Common Causes

### Cause 1: Service Worker Crashed
**Fix**: Reload extension (Step 2 above)

### Cause 2: Import Error
**Symptoms**: Red error in service worker console about imports
**Fix**: Check that all files exist in correct locations

### Cause 3: Syntax Error
**Symptoms**: SyntaxError in service worker console
**Fix**: Check the specific file mentioned in error

### Cause 4: Service Worker Not Starting
**Symptoms**: "Service worker inactive" or no console output
**Fix**: 
- Check manifest.json syntax
- Verify service-worker.js exists
- Check file permissions

## Still Not Working?

Please provide:
1. **Screenshot** of service worker console (or copy the errors)
2. **Chrome version** (chrome://version)
3. **What happens** when you click extension icon
4. **Any error messages** you see

This will help identify the exact issue.

## Alternative: Use Simple Service Worker

If the main service worker keeps crashing, you can temporarily use a simpler version:

1. In `manifest.json`, change:
   ```json
   "service_worker": "background/service-worker-simple.js"
   ```
2. Reload extension
3. Test if connection works
4. If it works, the issue is with imports in the main service worker

---

**Most likely fix**: Just reload the extension and wait a few seconds for service worker to start.

