# Quick Start Guide - Run Privacy Guard Now

## ✅ Pre-Flight Check

Before loading the extension, let's make sure everything is ready:

### 1. Create Icons (Required)

The extension needs icon files. You have two options:

#### Option A: Use the Script (Recommended)
```bash
cd assets/icons
./create-icons.sh
```

**Note**: Requires ImageMagick. Install with:
- macOS: `brew install imagemagick`
- Linux: `sudo apt-get install imagemagick`
- Windows: Download from https://imagemagick.org

#### Option B: Create Placeholder Icons Manually

Create 4 PNG files in `assets/icons/`:
- `icon16.png` (16x16 pixels)
- `icon32.png` (32x32 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can use any image editor or online tool like:
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/

**Quick placeholder**: Create a simple colored square with a shield emoji or "PG" text.

### 2. Verify Files

Make sure these key files exist:
- ✅ `manifest.json`
- ✅ `background/service-worker.js`
- ✅ `popup/popup.html`
- ✅ `popup/popup.js`
- ✅ `content/detector.js`
- ✅ `options/options.html`

## 🚀 Load Extension in Chrome

### Step 1: Open Chrome Extensions Page
1. Open Google Chrome
2. Navigate to `chrome://extensions/`
   - Or: Menu (⋮) → Extensions → Manage Extensions

### Step 2: Enable Developer Mode
1. Toggle "Developer mode" ON (top-right corner)

### Step 3: Load Extension
1. Click "Load unpacked"
2. Navigate to and select the `tc-buddy-extension` folder
3. Click "Select Folder"

### Step 4: Verify Installation
- ✅ Privacy Guard should appear in your extensions list
- ✅ Icon should appear in Chrome toolbar
- ✅ No errors in the extensions page

## 🧪 Test the Extension

### Basic Test
1. Navigate to a Terms & Conditions page (e.g., https://github.com/site/terms)
2. Click the Privacy Guard icon in toolbar
3. Click "Analyze This Page"
4. You should see analysis results

### Check for Errors
1. Go to `chrome://extensions/`
2. Find Privacy Guard
3. Click "service worker" (if available) to see background script
4. Right-click extension icon → "Inspect popup" to see popup console

## ⚠️ Common Issues

### Issue: "Icons not found"
**Solution**: Create icon files (see Step 1 above)

### Issue: "Service worker error"
**Solution**: 
- Check browser console for errors
- Make sure all files are in correct locations
- Verify manifest.json syntax

### Issue: "Popup not opening"
**Solution**:
- Check if popup.html exists
- Verify manifest.json has correct popup path
- Check browser console for errors

### Issue: "Analysis not working"
**Solution**:
- Make sure you're on a page with enough text (100+ characters)
- Check if API keys are configured (if using AI mode)
- Try Local mode first (no API needed)

## 🎯 First Run Checklist

- [ ] Icons created (16, 32, 48, 128px)
- [ ] Extension loaded in Chrome
- [ ] No errors in extensions page
- [ ] Icon appears in toolbar
- [ ] Popup opens when clicking icon
- [ ] Can analyze a Terms & Conditions page
- [ ] Settings page accessible

## 📝 Next Steps

Once it's working:
1. **Configure Settings**: Set your preferred analysis mode
2. **Add API Keys** (optional): For AI-powered analysis
3. **Test Features**: Try cookie detection, blocking, etc.
4. **Read Documentation**: See README.md for full feature list

## 🆘 Still Having Issues?

1. Check `CODE_REVIEW.md` for known issues
2. Review browser console for errors
3. Verify all files are in correct directories
4. Make sure Chrome version is 110+ (Manifest V3)

---

**Ready to go!** Once icons are created, you can load and use the extension immediately.

