# Quick Fix for Opera GX Manifest Error

## Try These Steps in Order:

### 1. Get the Exact Error Message
1. Open Opera GX
2. Go to `opera://extensions/`
3. Enable Developer mode
4. Try loading the extension
5. **Right-click on the error dialog** → Inspect or View Source
6. Or check the **Console** (F12)
7. **Copy the exact error message** and share it

### 2. Try Loading in Chrome First
This will tell us if it's Opera-specific:
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable Developer mode
4. Load unpacked → select `tc-buddy-extension` folder
5. Does it work? If yes, it's Opera-specific. If no, there's a real issue.

### 3. Check the Exact Path
When you click "Load unpacked", what path shows in the file picker?
- Should end with: `.../tc-buddy-extension`
- Should NOT end with: `.../CascadeProjects`

### 4. Try This Workaround
1. Copy the extension folder to Desktop:
   ```bash
   cp -r /Users/dhruvav/CascadeProjects/tc-buddy-extension ~/Desktop/privacy-guard
   ```
2. Try loading from Desktop location
3. Does it work?

### 5. Check Opera GX Console
1. In Opera GX, press `Cmd+Option+I` (Mac) or `F12` (Windows)
2. Go to Console tab
3. Try loading extension
4. Look for any red errors
5. Share what you see

### 6. Verify Manifest is Readable
Run this command and share the output:
```bash
cd /Users/dhruvav/CascadeProjects/tc-buddy-extension
cat manifest.json | head -5
file manifest.json
ls -la manifest.json
```

## Most Likely Causes:

1. **Opera GX cache issue** - Try restarting Opera GX
2. **Path with special characters** - The `~` in path might cause issues
3. **File permissions** - Though we checked and they're fine
4. **Opera GX bug** - Try Chrome to confirm

## Next Step:
Please share:
1. The **exact error message** from Opera GX
2. Whether it works in **Chrome**
3. The **full path** you're selecting when loading

This will help me pinpoint the exact issue!

