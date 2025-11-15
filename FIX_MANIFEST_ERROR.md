# Fix "Manifest file is missing or unreadable" Error

## Problem
When trying to load the extension, you get:
- "Failed to load extension"
- "Manifest file is missing or unreadable"
- "Could not load manifest"

## Solution

### Step 1: Make sure you're loading the correct folder
The path should point to the **extension folder**, not the parent directory:

**✅ Correct:**
```
/Users/dhruvav/CascadeProjects/tc-buddy-extension
```

**❌ Wrong:**
```
/Users/dhruvav/CascadeProjects
```

### Step 2: Verify manifest.json exists
1. Open the extension folder in Finder
2. Make sure `manifest.json` is in the root of the folder
3. It should NOT be in a subfolder

### Step 3: Load the extension correctly

**In Opera GX:**
1. Go to `opera://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Navigate to: `/Users/dhruvav/CascadeProjects/tc-buddy-extension`
5. Select the **tc-buddy-extension** folder (not the parent CascadeProjects folder)
6. Click **Select** or **Open**

**In Chrome/Edge/Brave:**
1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the **tc-buddy-extension** folder

### Step 4: Check for errors
After loading, check:
- Service worker console (click "service worker" link)
- Look for any red errors
- If you see errors, share them

## Common Mistakes

1. **Loading parent directory** - Make sure you select `tc-buddy-extension` folder, not `CascadeProjects`
2. **Manifest in wrong location** - `manifest.json` must be in the root of the extension folder
3. **File permissions** - Make sure you have read permissions on the folder

## Quick Check

Run this in terminal to verify:
```bash
cd /Users/dhruvav/CascadeProjects/tc-buddy-extension
ls -la manifest.json
```

You should see the file listed. If not, the file is missing or in the wrong location.

