# Privacy Guard 🛡️

A comprehensive Chrome extension that helps users understand and control their online privacy before accepting cookies, terms, or sharing data.

## ✨ Features

### 🔍 Multi-Mode Analysis
- **AI Mode**: Deep analysis using AI (Deepseek, OpenAI, Anthropic, Gemini)
- **Local Mode**: Fast heuristic-based analysis (no API needed)
- **Hybrid Mode**: Quick local scan + AI for complex cases (recommended)

### 🎯 Detection Capabilities
- Automatically detects Terms & Conditions pages
- Identifies Privacy Policies
- Detects cookie consent banners (OneTrust, Cookiebot, Osano, custom)
- Analyzes GDPR consent modals
- Scans data collection forms
- Account creation flows

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
- Respect DNT (Do Not Track) headers

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
- Modern, clean design with Tailwind CSS
- **Tabbed interface**: Summary, Details, Cookies, History, Dashboard, Settings
- Color-coded risk levels (green/yellow/red)
- Icons for each red flag category
- Smooth animations and transitions
- Dark mode support (via system preferences)
- Fully accessible (WCAG 2.1 AA compliant)

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
- API key setup (optional)
- Privacy preferences questionnaire
- Quick tutorial (4 steps)
- Progress indicator

## 📦 Installation

### From Source

1. Clone this repository:
```bash
git clone https://github.com/yourusername/privacy-guard.git
cd privacy-guard
```

2. Create icons (required):
```bash
cd assets/icons
./create-icons.sh
# Or use ImageMagick manually - see assets/icons/README.md
```

3. Open Chrome and navigate to `chrome://extensions/`

4. Enable "Developer mode" (toggle in top right)

5. Click "Load unpacked" and select the extension directory

6. The Privacy Guard icon should appear in your toolbar

### From Chrome Web Store
*(Coming soon)*

## 🚀 Quick Start

1. **First Time Setup**: On first install, you'll see an onboarding flow
2. **Analyze a Page**: Navigate to a Terms & Conditions or Privacy Policy page
3. **Click the Icon**: Open Privacy Guard from the toolbar
4. **Click "Analyze This Page"**: Get instant privacy analysis
5. **Review Results**: Check the Summary, Details, and Red Flags tabs
6. **Take Action**: Block trackers, decline cookies, or generate legal requests

## ⚙️ Configuration

### API Keys (Optional)

For AI-powered analysis, you can configure API keys in Settings:

1. **Deepseek** (Recommended - cost-effective)
   - Get key from: https://platform.deepseek.com
   - Add in Settings → API Configuration

2. **OpenAI**
   - Get key from: https://platform.openai.com
   - Add in Settings → API Configuration

3. **Anthropic Claude**
   - Get key from: https://console.anthropic.com
   - Add in Settings → API Configuration

4. **Google Gemini**
   - Get key from: https://makersuite.google.com
   - Add in Settings → API Configuration

**Note**: API keys are stored locally in your browser and never transmitted except to the API provider you choose.

### Privacy Preferences

Configure in Settings tab:
- **Analysis Mode**: AI, Local, or Hybrid (recommended)
- **Block Trackers**: Automatically block known trackers
- **Block Cookies**: Block non-essential cookies
- **Auto-Decline**: Automatically decline cookie banners

## 🏗️ Architecture

```
privacy-guard/
├── manifest.json
├── background/
│   ├── service-worker.js    # Main background logic
│   ├── analyzer.js          # Analysis engine
│   ├── blocker.js           # Blocking rules
│   └── cache.js             # Caching system
├── content/
│   ├── detector.js          # Page content detection
│   ├── highlighter.js       # Clause highlighting
│   ├── banner-detector.js   # Cookie banner detection
│   └── overlay.js           # Floating UI
├── popup/
│   ├── popup.html
│   ├── popup.js
│   ├── popup.css
│   └── components/
│       ├── dashboard.js     # Privacy dashboard
│       └── qa-chat.js        # Q&A chat interface
├── options/
│   ├── options.html
│   └── options.js
├── onboarding/
│   ├── onboarding.html
│   └── onboarding.js
├── lib/
│   ├── api-manager.js       # Multi-provider API client
│   ├── heuristics.js        # Local analysis rules
│   ├── patterns.js          # Detection patterns
│   └── legal-tools.js       # GDPR/CCPA generators
├── data/
│   ├── tracker-domains.json
│   ├── cookie-categories.json
│   ├── red-flag-keywords.json
│   └── blocking-rules.json
└── assets/
    └── icons/               # Extension icons
```

## 🔒 Privacy

Privacy Guard is designed with privacy as a core principle:

- ✅ All analysis runs locally or through your configured API keys
- ✅ No data collection or tracking
- ✅ API keys stored securely in browser storage
- ✅ No external analytics (unless you opt-in)
- ✅ Open source and auditable
- ✅ No personal information transmitted

**See [PRIVACY.md](PRIVACY.md) for detailed privacy policy**

## 🛠️ Development

### Prerequisites

- Chrome/Edge browser (Manifest V3 compatible, version 110+)
- ImageMagick (for icon generation, optional)

### Building

The extension is ready to use as-is. For production:

1. Ensure all files are in place
2. Create icons (see `assets/icons/README.md` or run `create-icons.sh`)
3. Test in Chrome
4. Package for Chrome Web Store

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

## 📚 Documentation

- **[README.md](README.md)** - This file
- **[PRIVACY.md](PRIVACY.md)** - Privacy policy for the extension
- **[FAQ.md](FAQ.md)** - Frequently asked questions
- **[CHANGELOG.md](CHANGELOG.md)** - Version history
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[BUILD.md](BUILD.md)** - Build and deployment guide
- **[CODE_REVIEW.md](CODE_REVIEW.md)** - Code review report

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Areas for Contribution

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

- **Issues**: [GitHub Issues](https://github.com/yourusername/privacy-guard/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/privacy-guard/wiki)
- **Email**: support@privacyguard.example

## 🗺️ Roadmap

### v2.1 (Planned)
- [ ] Enhanced dashboard with more charts
- [ ] Community trust ratings
- [ ] Policy change detection (diff view)
- [ ] Export reports as PDF
- [ ] Browser extension for Firefox

### v2.2 (Future)
- [ ] Mobile app
- [ ] Browser extension for Safari
- [ ] API for developers
- [ ] Browser extension for Edge

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
- ♿ **Accessible**: WCAG 2.1 AA compliant
- 📱 **Responsive**: Works on all screen sizes
- 🔧 **Customizable**: Extensive settings and preferences
- 📚 **Well-Documented**: Comprehensive guides and FAQs

## 🙏 Acknowledgments

Built with:
- Chrome Extension Manifest V3
- Tailwind CSS
- Deepseek AI (and other providers)
- Canvas API for charts

---

**Made with ❤️ for privacy-conscious users**

**Version**: 2.0.0  
**Last Updated**: 2024
