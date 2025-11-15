# Troubleshooting Guide

## Common Errors and Solutions

### "Could not establish connection. Receiving end does not exist"

**Cause**: Service worker crashed or hasn't initialized yet.

**Solutions**:
1. **Reload the extension**:
   - Go to `chrome://extensions/`
   - Click the reload icon on Privacy Guard
   - Wait 2-3 seconds for service worker to start

2. **Check service worker status**:
   - Go to `chrome://extensions/`
   - Find Privacy Guard
   - Click "service worker" link
   - Check for errors in console

3. **Restart Chrome** (if above doesn't work)

4. **Reinstall extension**:
   - Remove extension
   - Reload unpacked

### "import() is disallowed on ServiceWorkerGlobalScope"

**Status**: ✅ Fixed in latest version

**If you still see this**:
- Make sure you have the latest code
- Reload the extension
- All dynamic imports have been replaced with static imports

### Onboarding "Get Started" button not working

**Status**: ✅ Fixed

**If still not working**:
- Check browser console (F12) for errors
- Make sure `onboarding.js` is loading
- Verify functions are in global scope

### Popup not opening

**Solutions**:
1. Check `popup/popup.html` exists
2. Verify manifest.json has correct popup path
3. Check browser console for errors
4. Try right-clicking extension icon → "Inspect popup"

### Analysis not working

**Solutions**:
1. **Make sure you're on a valid page**:
   - Needs at least 100 characters of text
   - Should be a Terms & Conditions or Privacy Policy page

2. **Check analysis mode**:
   - Local mode works without API keys
   - AI mode requires API key
   - Try switching to Local mode first

3. **Check browser console**:
   - Look for error messages
   - Verify service worker is running

### Icons not showing

**Solution**: Create icon files:
```bash
cd assets/icons
./create-icons.sh
```

Or use the HTML generator:
```bash
open assets/icons/create-simple-icons.html
```

### Service Worker Keeps Crashing

**Solutions**:
1. Check for syntax errors in background scripts
2. Verify all imports are static (not dynamic)
3. Check browser console for specific errors
4. Make sure all required files exist

### Messages Not Being Received

**Solutions**:
1. Verify message type is handled in service-worker.js
2. Check that `sendResponse` is called
3. Make sure `return true` is used for async responses
4. Add error handling around message sending

## Debugging Steps

### 1. Check Service Worker
1. Go to `chrome://extensions/`
2. Find Privacy Guard
3. Click "service worker" link
4. Check console for errors

### 2. Check Popup
1. Right-click extension icon
2. Select "Inspect popup"
3. Check console for errors

### 3. Check Content Scripts
1. Open a webpage
2. Press F12 to open DevTools
3. Check Console tab for errors

### 4. Check Network
1. Open DevTools (F12)
2. Go to Network tab
3. Look for failed requests

## Getting Help

If issues persist:
1. Check browser console for specific error messages
2. Verify all files are in correct locations
3. Make sure Chrome version is 110+ (Manifest V3)
4. Try in a fresh Chrome profile
5. Check `CODE_REVIEW.md` for known issues

## Quick Fixes

**Extension not loading**:
- Check manifest.json syntax
- Verify all required files exist
- Check for JavaScript errors

**Features not working**:
- Reload extension
- Check service worker status
- Verify permissions in manifest

**Performance issues**:
- Clear extension cache
- Restart Chrome
- Check for conflicting extensions

---

**Most issues are resolved by simply reloading the extension!**

