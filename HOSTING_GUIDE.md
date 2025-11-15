# How to Host Your Extension for Download

## Option 1: GitHub Releases (Easiest - Free)

### Steps:
1. **Package the extension:**
   ```bash
   ./dist/package-extension.sh
   ```
   This creates `dist/privacy-guard-extension.zip`

2. **Create a GitHub Release:**
   - Go to your GitHub repo: https://github.com/dhruvav322/Tc-buddy-
   - Click "Releases" → "Create a new release"
   - Tag: `v2.0.0`
   - Title: `Privacy Guard v2.0.0`
   - Upload `dist/privacy-guard-extension.zip`
   - Publish release

3. **Update download page:**
   - The download link in `dist/index.html` will point to the release
   - Or host `dist/index.html` on GitHub Pages

4. **Enable GitHub Pages:**
   - Go to repo Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` / `dist` folder
   - Save
   - Your site: `https://dhruvav322.github.io/Tc-buddy-/dist/`

## Option 2: Netlify (Free & Easy)

1. **Sign up:** https://netlify.com (free)
2. **Drag & drop** the `dist` folder to Netlify
3. **Get instant URL:** `https://your-site.netlify.app`
4. **Auto-deploy:** Connect GitHub for auto-updates

## Option 3: Vercel (Free & Fast)

1. **Sign up:** https://vercel.com (free)
2. **Import project** from GitHub
3. **Set root directory:** `dist`
4. **Deploy** - instant URL

## Option 4: Your Own Server

1. **Upload `dist` folder** to your web server
2. **Access via:** `https://yourdomain.com/privacy-guard/`
3. **Update download link** in `index.html` if needed

## Option 5: Chrome Web Store / Opera Add-ons (Official)

### Chrome Web Store:
1. Go to https://chrome.google.com/webstore/devconsole
2. Pay $5 one-time fee
3. Upload ZIP file
4. Submit for review
5. Users can install with one click

### Opera Add-ons:
1. Go to https://addons.opera.com/developers/
2. Create account
3. Upload extension
4. Submit for review

## Quick Setup (GitHub Pages)

```bash
# 1. Package extension
./dist/package-extension.sh

# 2. Copy index.html to root (optional)
cp dist/index.html .

# 3. Commit and push
git add dist/index.html dist/package-extension.sh
git commit -m "Add download page"
git push

# 4. Enable GitHub Pages in repo settings
# 5. Access at: https://dhruvav322.github.io/Tc-buddy-/
```

## Update Download Link

In `dist/index.html`, update the download link:
- GitHub Releases: `https://github.com/dhruvav322/Tc-buddy-/releases/download/v2.0.0/privacy-guard-extension.zip`
- Direct: `privacy-guard-extension.zip` (if hosting on same domain)

## Recommended: GitHub Pages + Releases

**Best approach:**
1. Use GitHub Releases for the ZIP file
2. Use GitHub Pages for the download page
3. Free, reliable, and easy to update

Your users can then:
- Visit your GitHub Pages site
- Click download
- Install the extension

No need to host on GitHub's file system - just use Releases and Pages!

