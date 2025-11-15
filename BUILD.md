# Build & Installation Guide

## Quick Start

### 1. Prerequisites

- Chrome/Edge browser (version 110+)
- No additional build tools required (extension is ready to use)

### 2. Installation

1. **Clone or download** this repository
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer mode** (toggle in top-right corner)
4. **Click "Load unpacked"**
5. **Select the extension directory** (`tc-buddy-extension`)
6. **Privacy Guard** should now appear in your extensions list

### 3. Create Icons (Required)

The extension needs icon files. You have two options:

#### Option A: Use Placeholder Icons

Create simple colored squares as placeholders:

```bash
# Using ImageMagick (if installed)
cd assets/icons
convert -size 128x128 xc:#6366f1 icon128.png
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 32x32 icon32.png
convert icon128.png -resize 16x16 icon16.png
```

#### Option B: Use Online Tools

1. Go to https://www.favicon-generator.org/
2. Upload or create a shield icon
3. Download all sizes
4. Place in `assets/icons/` directory

#### Option C: Design Custom Icons

Create icons in your preferred design tool:
- 16x16, 32x32, 48x48, 128x128 pixels
- PNG format
- Represent privacy/shield theme
- Use brand colors (#6366f1)

## Development

### File Structure

```
privacy-guard/
├── manifest.json              # Extension manifest
├── background/
│   ├── service-worker.js      # Main background script
│   ├── analyzer.js            # Analysis engine
│   ├── blocker.js             # Blocking system
│   └── cache.js               # Caching
├── content/
│   ├── detector.js            # Page detection
│   ├── banner-detector.js    # Cookie banner detection
│   ├── highlighter.js         # Text highlighting
│   ├── overlay.js             # Floating UI
│   └── content.css            # Content script styles
├── popup/
│   ├── popup.html             # Popup UI
│   ├── popup.js               # Popup logic
│   └── popup.css              # Popup styles
├── options/
│   ├── options.html           # Settings page
│   └── options.js             # Settings logic
├── lib/
│   ├── api-manager.js         # API client
│   ├── heuristics.js         # Local analysis
│   └── patterns.js            # Detection patterns
├── data/
│   ├── tracker-domains.json   # Tracker list
│   ├── cookie-categories.json
│   └── red-flag-keywords.json
└── assets/
    └── icons/                 # Extension icons
```

### Testing

1. **Load the extension** in developer mode
2. **Open browser console** (F12) to check for errors
3. **Test on various sites**:
   - Terms & Conditions pages
   - Privacy Policy pages
   - Sites with cookie banners
4. **Check popup** functionality
5. **Test settings** page

### Debugging

- **Background script**: Go to `chrome://extensions/` → Click "service worker" link
- **Content scripts**: Use browser DevTools on the page
- **Popup**: Right-click popup → Inspect

## Production Build

### 1. Prepare for Release

- [ ] All icons created and in place
- [ ] Test on multiple websites
- [ ] Verify all features work
- [ ] Check for console errors
- [ ] Update version in `manifest.json`
- [ ] Update `CHANGELOG.md`

### 2. Create ZIP Package

```bash
# Exclude unnecessary files
zip -r privacy-guard.zip . \
  -x "*.git*" \
  -x "*.md" \
  -x "BUILD.md" \
  -x "node_modules/*" \
  -x ".DS_Store"
```

### 3. Chrome Web Store Submission

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "New Item"
3. Upload ZIP file
4. Fill in store listing:
   - Name: Privacy Guard
   - Description: (from README)
   - Screenshots: 1280x800 (5 required)
   - Promotional images
   - Privacy policy URL
5. Submit for review

### 4. Store Listing Requirements

- **Screenshots**: 5 screenshots (1280x800)
  - Popup interface
  - Analysis results
  - Settings page
  - Cookie breakdown
  - Dashboard

- **Promotional Images**:
  - Small tile: 440x280
  - Large tile: 920x680

- **Privacy Policy**: Host on GitHub Pages or your website

## Troubleshooting

### Extension won't load

- Check `manifest.json` for syntax errors
- Verify all file paths are correct
- Check browser console for errors

### Icons not showing

- Verify icons exist in `assets/icons/`
- Check file names match manifest
- Ensure icons are PNG format

### Content scripts not working

- Check manifest permissions
- Verify content script files exist
- Check browser console for errors

### API calls failing

- Verify API keys are correct
- Check network tab for errors
- Ensure API provider is accessible

## Performance

- Extension size: < 5MB (target)
- Popup load time: < 500ms
- Analysis time: < 3 seconds
- Memory usage: < 50MB

## Security Checklist

- [ ] No external dependencies loaded from CDN
- [ ] API keys stored securely (chrome.storage.local)
- [ ] No sensitive data in console logs
- [ ] CSP headers in manifest
- [ ] Input validation on all user inputs
- [ ] No eval() or dangerous functions

---

For questions or issues, see [FAQ.md](FAQ.md) or open a GitHub issue.

