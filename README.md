# Privacy Guard 🛡️

A comprehensive browser extension that helps users understand and control their online privacy. Analyze Terms & Conditions, Privacy Policies, detect trackers, and protect your data before sharing it.

## ✨ Features

### 🔍 Multi-Mode Analysis
- **AI Mode**: Deep contextual analysis using AI (Deepseek, OpenAI, Anthropic, Gemini)
- **Local Mode**: Fast heuristic-based analysis (no API needed, completely free)
- **Hybrid Mode**: Uses AI if configured, otherwise falls back to local analysis (recommended)

### 🎯 Automatic Detection
- Automatically detects Terms & Conditions pages
- Identifies Privacy Policies
- Detects cookie consent banners (OneTrust, Cookiebot, Osano, custom)
- Scans for privacy issues on ANY page (not just T&C pages)
- Real-time page type detection

### 🍪 Cookie & Tracking Analysis
- Categorizes cookies: Essential, Functional, Analytics, Marketing, Advertising
- Counts third-party trackers
- Identifies known tracking domains (Google Analytics, Facebook Pixel, etc.)
- Detects fingerprinting attempts
- Shows data transfer destinations

### 🚫 Blocking Capabilities
- Block non-essential cookies automatically (opt-in)
- Block known tracking scripts
- Auto-decline cookie banners (when possible)
- Whitelist/blacklist system for trusted sites

### ⚠️ Smart Red Flag Detection
Detects 20+ privacy concerns including:
- Auto-renewal & subscription traps
- Non-refundable purchases
- Hidden fees
- Arbitration clauses
- Class action waivers
- Data sharing with third parties
- Data selling/monetization
- Mandatory account creation
- Broad content licenses
- Tracking cookies
- Targeted advertising
- Profile building
- Location tracking
- Biometric data collection
- AI training on user data
- Indefinite data retention
- Data transfer to unsafe countries
- Vague "partners" sharing
- Automatic updates to terms
- No deletion rights

### 📊 Risk Scoring System
- **Overall Risk**: Safe (0-2 flags) / Watch (3-5 flags) / Risky (6+ flags)
- **Privacy Score**: 0-100 scale (higher = better privacy)
- **Readability Score**: Grade level required to understand
- **Trust Score**: Based on company reputation + policy quality

### 🎨 User Interface
- Modern, clean design
- **Tabbed interface**: Summary, Details, Cookies, History, Dashboard, Settings
- Color-coded risk levels (green/yellow/red)
- Visual badges showing analysis source (AI vs Local)
- Smooth animations and transitions
- Responsive design

### 📈 Privacy Dashboard
- Visual statistics and charts
- Risk distribution pie chart
- Privacy score trend over time
- Cookie categories breakdown
- Total trackers blocked counter
- Sites analyzed history

### 💬 AI-Powered Q&A
- Chat interface for asking questions about policies
- Context-aware answers from analysis
- Follow-up questions supported
- Example: "Can they sell my email?" → Instant answer

### ⚖️ Legal Tools
- **GDPR Request Generator**: Data access and deletion requests
- **CCPA Opt-Out**: California privacy rights requests
- **Account Closure Assistant**: Template for closing accounts
- **DPA Complaint Helper**: File complaints with data protection authorities
- One-click copy to clipboard
- Email-ready formatting

### 🎓 Onboarding Flow
- Welcome screen explaining features
- Analysis mode selection
- Privacy preferences configuration
- Quick tutorial (5 steps)
- Progress indicator

## 📦 Installation

### From Source

1. Clone this repository:
```bash
git clone https://github.com/dhruvav322/Tc-buddy-.git
cd tc-buddy-extension
```

2. Open your browser and navigate to:
   - **Chrome/Edge**: `chrome://extensions/`
   - **Opera GX**: `opera://extensions/`
   - **Brave**: `brave://extensions/`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked" and select the extension directory

5. The Privacy Guard icon should appear in your toolbar

### Browser Compatibility

- ✅ Chrome (110+)
- ✅ Edge (110+)
- ✅ Opera GX
- ✅ Brave
- ✅ Other Chromium-based browsers

## 🚀 Quick Start

1. **First Time Setup**: On first install, you'll see an onboarding flow
   - Choose your analysis mode (Hybrid recommended)
   - Configure privacy preferences
   - Complete setup

2. **Analyze a Page**: 
   - Navigate to any Terms & Conditions or Privacy Policy page
   - Or any page - the extension scans for privacy issues automatically

3. **Click the Icon**: Open Privacy Guard from the toolbar

4. **Click "Analyze This Page"**: Get instant privacy analysis

5. **Review Results**: 
   - Check the Summary tab for TL;DR
   - Review Details for full analysis
   - Check Red Flags for concerns
   - View Cookies tab for tracking info

6. **Take Action**: 
   - Block trackers
   - Decline cookies
   - Generate legal requests
   - Export analysis

## ⚙️ Configuration

### API Keys (Optional - for AI Mode)

For AI-powered analysis, configure API keys in the Options page:

1. Right-click the extension icon → **Options**
2. Navigate to **API Configuration**
3. Add your API key for one of these providers:

   - **Deepseek** (Recommended - cost-effective)
     - Get key from: https://platform.deepseek.com
   
   - **OpenAI**
     - Get key from: https://platform.openai.com
   
   - **Anthropic Claude**
     - Get key from: https://console.anthropic.com
   
   - **Google Gemini**
     - Get key from: https://makersuite.google.com

**Note**: 
- API keys are stored locally in your browser
- Keys are only sent to the API provider you choose
- Local mode works without any API keys (completely free)

### Privacy Preferences

Configure in Settings tab:
- **Analysis Mode**: AI, Local, or Hybrid (recommended)
- **Preferred API Provider**: Choose which AI to use (if multiple configured)
- **Block Trackers**: Automatically block known trackers
- **Block Cookies**: Block non-essential cookies
- **Auto-Decline**: Automatically decline cookie banners

## 🏗️ Project Structure

```
tc-buddy-extension/
├── manifest.json              # Extension manifest
├── background/
│   ├── service-worker.js      # Main background logic
│   ├── analyzer.js            # Analysis engine
│   ├── blocker.js            # Blocking rules
│   └── cache.js              # Caching system
├── content/
│   ├── detector.js           # Page content detection
│   ├── highlighter.js        # Clause highlighting
│   ├── banner-detector.js    # Cookie banner detection
│   ├── overlay.js            # Floating UI
│   └── dom-utils.js          # DOM utilities
├── popup/
│   ├── popup.html
│   ├── popup.js
│   ├── popup.css
│   └── components/
│       ├── dashboard.js      # Privacy dashboard
│       └── qa-chat.js        # Q&A chat interface
├── options/
│   ├── options.html
│   └── options.js
├── onboarding/
│   ├── onboarding.html
│   └── onboarding.js
├── lib/
│   ├── api-manager.js        # Multi-provider API client
│   ├── heuristics.js         # Local analysis rules
│   ├── patterns.js           # Detection patterns
│   ├── legal-tools.js        # GDPR/CCPA generators
│   └── browser-compat.js    # Cross-browser compatibility
├── data/
│   ├── tracker-domains.json
│   ├── cookie-categories.json
│   ├── red-flag-keywords.json
│   └── blocking-rules.json
└── assets/
    └── icons/                # Extension icons
```

## 🔒 Privacy & Security

Privacy Guard is designed with privacy as a core principle:

- ✅ All analysis runs locally or through your configured API keys
- ✅ No data collection or tracking
- ✅ API keys stored securely in browser storage
- ✅ No external analytics
- ✅ Open source and auditable
- ✅ No personal information transmitted
- ✅ Works offline (local mode)

## 🛠️ Development

### Prerequisites

- Chrome/Edge/Opera GX browser (Manifest V3 compatible, version 110+)
- Git

### Setup

1. Clone the repository
2. Open browser extensions page
3. Enable Developer mode
4. Load unpacked extension
5. Start developing!

### Testing

Test on various sites:
- Terms & Conditions pages (e.g., GitHub, Google)
- Privacy Policy pages (e.g., Facebook, Amazon)
- Sites with cookie banners (OneTrust, Cookiebot)
- Different cookie consent frameworks

### Debugging

- **Background script**: Go to `chrome://extensions/` → Click "service worker" link
- **Content scripts**: Use browser DevTools on the page
- **Popup**: Right-click popup → Inspect

## 📚 Recent Updates

### v2.0.0
- ✅ Fixed service worker connection errors on install/reload
- ✅ Improved API key saving with verification
- ✅ Better error handling and retry logic
- ✅ Fixed analysis mode detection and badge display
- ✅ Enhanced Gemini API debugging
- ✅ Service worker ready before onboarding opens
- ✅ Cross-browser compatibility (Opera GX, Chrome, Edge, Brave)
- ✅ Privacy scanning on any page (not just T&C pages)

## 🤝 Contributing

Contributions welcome! Areas for contribution:

- Detection improvements (better pattern matching)
- UI/UX enhancements
- Performance optimizations
- Documentation improvements
- Accessibility enhancements
- Localization/translations
- Testing coverage

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## ⚠️ Disclaimer

**This extension provides analysis and information only. It is not legal advice. Always consult a qualified lawyer for legal matters.**

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/dhruvav322/Tc-buddy-/issues)
- **Repository**: [GitHub Repo](https://github.com/dhruvav322/Tc-buddy-)

## 🎯 Use Cases

### For Consumers
- Understand what you're agreeing to before signing up
- Identify hidden fees and auto-renewals
- Protect your data from unnecessary tracking
- Exercise your privacy rights (GDPR, CCPA)

### For Privacy Advocates
- Quickly analyze multiple privacy policies
- Track privacy scores over time
- Generate legal requests efficiently
- Educate others about privacy concerns

### For Developers
- Learn about privacy best practices
- Understand what users care about
- See how your policies compare
- Improve transparency

## 📊 Statistics

- **Red Flag Categories**: 20+
- **Known Trackers**: 50+
- **Supported Cookie Frameworks**: 3+ (OneTrust, Cookiebot, Osano)
- **API Providers**: 4 (Deepseek, OpenAI, Anthropic, Gemini)
- **Analysis Modes**: 3 (AI, Local, Hybrid)
- **Legal Tools**: 5 (GDPR access, GDPR deletion, CCPA, Account closure, DPA complaint)

## 🌟 Key Highlights

- 🚀 **Fast**: Analysis completes in under 3 seconds
- 🔒 **Private**: All processing local or user-controlled
- 🎨 **Beautiful**: Modern, intuitive interface
- 📱 **Responsive**: Works on all screen sizes
- 🔧 **Customizable**: Extensive settings and preferences
- 💰 **Free**: Local mode works without any API keys
- 🌐 **Cross-Browser**: Works on Chrome, Edge, Opera GX, Brave

---

**Made with ❤️ for privacy-conscious users**

**Version**: 2.0.0  
**Last Updated**: 2024
