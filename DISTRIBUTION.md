# How Others Can Use Privacy Guard Extension

There are several ways to distribute your extension so others can use it:

## 🚀 Method 1: GitHub Releases (Recommended)

This is the easiest and most professional way to distribute your extension.

### Step 1: Package the Extension

```bash
cd dist
chmod +x package-extension.sh
./package-extension.sh
```

This creates `privacy-guard-extension.zip` in the `dist/` folder.

### Step 2: Create a GitHub Release

1. Go to your GitHub repository: https://github.com/dhruvav322/Tc-buddy-
2. Click **"Releases"** (on the right sidebar)
3. Click **"Create a new release"**
4. Fill in:
   - **Tag version**: `v2.0.0` (or your version)
   - **Release title**: `Privacy Guard v2.0.0`
   - **Description**: Copy from your README features
5. **Attach the ZIP file**: Drag and drop `dist/privacy-guard-extension.zip`
6. Click **"Publish release"**

### Step 3: Share the Download Link

Users can download from:
- **Direct link**: `https://github.com/dhruvav322/Tc-buddy-/releases/latest/download/privacy-guard-extension.zip`
- **Releases page**: `https://github.com/dhruvav322/Tc-buddy-/releases`

## 🌐 Method 2: Host a Download Page

You already have a download page at `dist/index.html`. Host it on:

### Option A: GitHub Pages (Free)

1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select **"Deploy from a branch"**
3. Select **`main`** branch and **`/dist`** folder
4. Click **Save**
5. Your page will be live at: `https://dhruvav322.github.io/Tc-buddy-/`

### Option B: Netlify (Free)

1. Go to https://netlify.com
2. Sign up/login
3. Click **"Add new site"** → **"Deploy manually"**
4. Drag and drop your `dist` folder
5. Your site will be live instantly!

### Option C: Vercel (Free)

1. Go to https://vercel.com
2. Sign up/login
3. Click **"Add New Project"**
4. Import your GitHub repo
5. Set **Root Directory** to `dist`
6. Deploy!

## 📦 Method 3: Direct GitHub Download

Users can download directly from GitHub:

1. Go to: https://github.com/dhruvav322/Tc-buddy-
2. Click **"Code"** → **"Download ZIP"**
3. Extract the ZIP
4. Follow installation instructions below

## 🏪 Method 4: Chrome Web Store (Future)

To publish on Chrome Web Store:

1. **Package the extension** (use `dist/package-extension.sh`)
2. Go to https://chrome.google.com/webstore/devconsole
3. Pay $5 one-time developer fee
4. Upload the ZIP file
5. Fill in store listing details
6. Submit for review (takes 1-3 days)

## 📋 Installation Instructions for Users

Share these instructions with users:

### Quick Install Steps:

1. **Download the extension**:
   - From GitHub Releases, OR
   - From your hosted download page, OR
   - Clone the repository

2. **Extract the ZIP file** (if downloaded as ZIP)

3. **Open your browser**:
   - **Chrome/Edge/Brave**: Go to `chrome://extensions/`
   - **Opera/Opera GX**: Go to `opera://extensions/`

4. **Enable Developer Mode**:
   - Toggle the switch in the top-right corner

5. **Load the extension**:
   - Click **"Load unpacked"**
   - Select the extracted folder (or the repository folder)

6. **Done!** The Privacy Guard icon should appear in your toolbar

### First Time Setup:

- On first install, an onboarding flow will guide users
- They can choose analysis mode (Hybrid recommended)
- Configure privacy preferences
- Start using the extension!

## 🔗 Quick Links to Share

**GitHub Repository:**
```
https://github.com/dhruvav322/Tc-buddy-
```

**Latest Release:**
```
https://github.com/dhruvav322/Tc-buddy-/releases/latest
```

**Direct Download:**
```
https://github.com/dhruvav322/Tc-buddy-/releases/latest/download/privacy-guard-extension.zip
```

## 📝 README Update

Add this section to your README.md:

```markdown
## 📥 Download & Install

### Quick Install

1. **Download**: [Latest Release](https://github.com/dhruvav322/Tc-buddy-/releases/latest)
2. **Extract** the ZIP file
3. **Open** `chrome://extensions/` (or `opera://extensions/`)
4. **Enable** Developer mode
5. **Click** "Load unpacked" and select the extracted folder

### From Source

```bash
git clone https://github.com/dhruvav322/Tc-buddy-.git
cd tc-buddy-extension
# Then follow installation steps above
```
```

## 🎯 Best Practices

1. **Version your releases**: Use semantic versioning (v2.0.0, v2.1.0, etc.)
2. **Update the ZIP**: Run `package-extension.sh` before each release
3. **Test the ZIP**: Download and install it yourself to verify it works
4. **Keep README updated**: Include download links and installation steps
5. **Create release notes**: Document what's new in each version

## ✅ Checklist Before Distribution

- [ ] Run `dist/package-extension.sh` to create fresh ZIP
- [ ] Test the ZIP by installing it yourself
- [ ] Update version in `manifest.json`
- [ ] Update README with download links
- [ ] Create GitHub release with ZIP attached
- [ ] (Optional) Host download page on GitHub Pages/Netlify

---

**That's it!** Your extension is now ready for others to use! 🎉

