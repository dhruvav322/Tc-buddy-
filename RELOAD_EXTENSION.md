# How to Reload Extension in Opera GX

## The Error
"Uncaught SyntaxError: Unexpected token 'export'" in `highlighter.js:13` and `overlay.js:37`

## Cause
The browser is using **cached/old versions** of the content scripts that still have `export` statements.

## Solution: Force Reload Extension

### Step 1: Remove Old Extension
1. Go to `opera://extensions/`
2. Find **Privacy Guard**
3. Click **Remove** (trash icon)
4. Confirm removal

### Step 2: Clear Browser Cache (Optional but Recommended)
1. Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
2. Select "Cached images and files"
3. Click "Clear data"

### Step 3: Reload Extension
1. Go to `opera://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the extension folder: `/Users/dhruvav/CascadeProjects/tc-buddy-extension`
5. Wait 2-3 seconds for extension to load

### Step 4: Verify
1. Open any webpage
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Should NOT see "export" errors anymore

## Alternative: Hard Reload
If the above doesn't work:

1. Close Opera GX completely
2. Reopen Opera GX
3. Go to `opera://extensions/`
4. Click **Reload** on Privacy Guard extension
5. Test again

## Verification
After reloading, check:
- ✅ No "export" errors in console
- ✅ Extension popup opens
- ✅ "Analyze This Page" works
- ✅ No connection errors

The files have been fixed - you just need to reload the extension to get the updated code!

