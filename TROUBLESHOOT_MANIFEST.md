# Troubleshooting Manifest Error

## If you're selecting the right folder but still getting errors:

### Step 1: Check Opera GX Console
1. Go to `opera://extensions/`
2. Try to load the extension
3. Open DevTools (F12) or right-click → Inspect
4. Check Console tab for detailed error messages
5. Share the exact error you see

### Step 2: Try These Fixes

**Fix 1: Remove Extended Attributes**
```bash
cd /Users/dhruvav/CascadeProjects/tc-buddy-extension
xattr -cr .
```

**Fix 2: Verify All Files Exist**
Make sure these files/folders exist:
- ✅ manifest.json (root)
- ✅ background/service-worker.js
- ✅ popup/popup.html
- ✅ content.js (root)
- ✅ content/ folder with all scripts
- ✅ assets/icons/ with all icon files
- ✅ data/blocking-rules.json

**Fix 3: Check File Permissions**
```bash
chmod 644 manifest.json
chmod 755 background content popup options assets data lib onboarding
```

**Fix 4: Try Loading in Chrome First**
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable Developer mode
4. Load unpacked → select tc-buddy-extension folder
5. If it works in Chrome, it's an Opera GX specific issue

**Fix 5: Copy to a New Location**
Sometimes moving the folder helps:
```bash
cp -r /Users/dhruvav/CascadeProjects/tc-buddy-extension ~/Desktop/privacy-guard-test
```
Then try loading from Desktop

### Step 3: Check for Specific Errors

**If you see "service-worker.js not found":**
- Check that `background/service-worker.js` exists
- Check the path in manifest.json matches exactly

**If you see "icon not found":**
- Make sure all icon files exist in `assets/icons/`
- Check file names match exactly (case-sensitive)

**If you see "content script not found":**
- Verify all content scripts exist
- Check paths in manifest.json

### Step 4: Get Detailed Error

1. Open Opera GX
2. Go to `opera://extensions/`
3. Enable Developer mode
4. Try loading extension
5. Right-click extension card → Inspect
6. Check Console for detailed errors
7. Share the exact error message

## Common Issues

1. **Case sensitivity** - File names must match exactly
2. **Missing files** - All referenced files must exist
3. **Path issues** - Use relative paths, not absolute
4. **Extended attributes** - macOS sometimes adds these, remove with `xattr -cr .`

