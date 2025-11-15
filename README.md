# T&C Buddy

A Chrome extension that summarizes dense Terms & Conditions or privacy policies into plain language and flags potential red flags using Deepseek AI or a local heuristic fallback.

## Features

- **One-click analysis** – scans the active tab and generates an actionable TL;DR.
- **AI + local fallback** – choose between Deepseek-powered summaries or an offline heuristic mode.
- **Red-flag radar** – surfaces clauses about auto-renewals, refunds, arbitration, data sharing, and more.
- **Highlight helper** – instantly highlight suspicious snippets inside the current page.
- **Secure API key storage** – Deepseek API key is stored locally via `chrome.storage`.

## Getting Started

### Prerequisites
- Google Chrome or any Chromium-based browser that supports Manifest V3.
- A Deepseek API key if you plan to use the cloud summarizer (optional for local mode).

### Local Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/dhruvav322/Tc-buddy-.git
   cd Tc-buddy-
   ```
2. Open `chrome://extensions/` in Chrome.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select this project folder.

### Using the Extension
1. Navigate to any Terms & Conditions / policy page.
2. Open the T&C Buddy popup.
3. (Optional) Toggle **Process locally** if you prefer the offline heuristic summary.
4. Provide your Deepseek API key in the popup if you want AI summaries and click **Save Key**.
5. Hit **Analyze this page**. You’ll see:
   - TL;DR summary with key bullets
   - Red flag grid with quick yes/no context
   - Copy button to grab a support-ready message

## Development Notes
- Manifest v3 service worker: `background.js`
- Content script for page interaction: `content.js`
- Popup UI: `popup.html`, `popup.js`, `tailwind.css`
- Deepseek API helper: `deepseek.js`

Feel free to customize the heuristics, UI styling, or risk thresholds to match your use case.

## Privacy & Disclaimer
- No personal data is transmitted unless you opt into the Deepseek API mode.
- Cached summaries are stored locally for 6 hours to avoid repeated API calls.
- This tool offers convenience, **not legal advice**. Always review original documents before agreeing.
