# Cross-Browser Compatibility Setup

## Supported Browsers

✅ **Chrome** (Manifest V3)
✅ **Edge** (Manifest V3) 
✅ **Opera/Opera GX** (Manifest V3)
✅ **Brave** (Manifest V3)
✅ **Firefox** (Manifest V2 - separate build needed)

## Changes Made

### 1. Fixed Content Script Module Errors
- **Removed `export` statements** from `content/highlighter.js` and `content/overlay.js`
- Content scripts now use regular functions (not ES6 modules)
- Functions are available in global scope for content scripts

### 2. Updated CSP
- Added `'wasm-unsafe-eval'` and `'inline-speculation-rules'` to CSP
- Added localhost exceptions for development

### 3. Created Browser Compatibility Layer
- New file: `lib/browser-compat.js`
- Provides unified API for Chrome/Edge/Opera (chrome.*) and Firefox (browser.*)
- Automatically detects browser and uses correct API

## Browser-Specific Notes

### Chrome/Edge/Opera/Brave
- Uses Manifest V3
- Uses `chrome.*` API
- Service worker based
- **Current manifest.json works for these browsers**

### Firefox
- Uses Manifest V2 (Firefox doesn't fully support V3 yet)
- Uses `browser.*` API (Promise-based)
- Background page instead of service worker
- **Requires separate manifest-firefox.json**

## Testing in Opera GX

1. **Load Extension:**
   - Go to `opera://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension folder

2. **Verify It Works:**
   - Click extension icon
   - Should open popup without errors
   - Check console (F12) - no "export" errors

3. **Test Features:**
   - Click "Analyze This Page"
   - Navigate tabs
   - Check dashboard

## Firefox Support (Optional)

To build for Firefox:

1. Use `manifest-firefox.json` as base
2. Convert service worker to background page
3. Update API calls to use `browser.*` instead of `chrome.*`
4. Test in Firefox Developer Edition

## Current Status

✅ **Opera GX/Chrome/Edge/Brave**: Ready to use
⚠️ **Firefox**: Requires additional work (separate manifest)

## Next Steps

1. **Test in Opera GX** - Should work now!
2. **If errors persist**, check:
   - Service worker console
   - Popup console (right-click icon → Inspect)
   - Content script console (F12 on any page)

The extension should now work in Opera GX without the "export" errors!

