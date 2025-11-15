# Frequently Asked Questions

## General

### What is Privacy Guard?
Privacy Guard is a Chrome extension that helps you understand and control your online privacy. It analyzes Terms & Conditions, Privacy Policies, and cookie consent dialogs to identify potential privacy concerns.

### Is it free?
Yes! Privacy Guard is completely free and open source.

### Do I need an API key?
No. You can use Local mode for free, offline analysis. API keys are optional and only needed for AI-powered analysis.

### Is it legal advice?
**No.** Privacy Guard provides analysis and information only. It is not legal advice. Always consult a qualified lawyer for legal matters.

## Privacy

### Does Privacy Guard collect my data?
No. Privacy Guard does not collect, track, or transmit your personal data. All analysis runs locally or through your configured API provider.

### Where is my data stored?
All data is stored locally in your browser using Chrome's storage API. Nothing is sent to us or any third party (except your chosen API provider for AI analysis).

### What about my API keys?
API keys are stored securely in your browser's local storage. They are only sent to authenticate with your chosen API provider.

## Features

### How accurate is the analysis?
- **Local mode**: Fast but basic - uses keyword matching
- **AI mode**: More accurate and detailed - understands context
- **Hybrid mode**: Best of both - quick local scan, AI for complex cases

### Can it block all trackers?
Privacy Guard can block many known trackers, but new ones appear constantly. We maintain a list of known tracking domains and update it regularly.

### Does it work on all websites?
Privacy Guard works on most websites. Some sites may block extensions or use complex cookie consent systems that are harder to detect.

### Can I customize what gets blocked?
Yes! In Settings, you can:
- Enable/disable tracker blocking
- Enable/disable cookie blocking
- Configure auto-decline behavior

## Technical

### Why does it need so many permissions?
- `activeTab`: To analyze the current page
- `storage`: To save your settings and cache
- `scripting`: To inject analysis scripts
- `webRequest`: To block trackers
- `cookies`: To analyze and manage cookies
- `host_permissions`: To work on all websites

### Does it slow down my browser?
No. Privacy Guard is designed to be lightweight and efficient. Analysis runs asynchronously and doesn't block page loading.

### Can I use it with other privacy extensions?
Yes, but be aware that multiple extensions blocking the same resources may cause conflicts. Test to ensure everything works as expected.

## Troubleshooting

### Analysis isn't working
1. Make sure you're on a Terms & Conditions or Privacy Policy page
2. Check that the page has enough text (at least 100 characters)
3. Try Local mode if AI mode isn't working
4. Check your API key if using AI mode

### Cookie blocking isn't working
1. Enable "Block non-essential cookies" in Settings
2. Refresh the page
3. Some cookies may be set before the extension loads

### The popup is blank
1. Refresh the page
2. Try closing and reopening the popup
3. Check the browser console for errors

### Icons are missing
Create icon files (16x16, 32x32, 48x48, 128x128) in `assets/icons/` or use placeholder icons. See `assets/icons/README.md` for instructions.

## Support

### How do I report a bug?
Open an issue on GitHub: [GitHub Issues](https://github.com/yourusername/privacy-guard/issues)

### Can I contribute?
Yes! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Where can I get help?
- GitHub Issues for bugs
- GitHub Discussions for questions
- Email: support@privacyguard.example

---

Have a question not answered here? Open an issue or contact us!

