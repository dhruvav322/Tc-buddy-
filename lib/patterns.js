/**
 * Pattern matching for document detection
 * Identifies Terms & Conditions, Privacy Policies, Cookie banners, etc.
 */

export const DOCUMENT_PATTERNS = {
  terms: [
    /terms\s+of\s+service/i,
    /terms\s+and\s+conditions/i,
    /terms\s+of\s+use/i,
    /user\s+agreement/i,
    /service\s+agreement/i,
    /legal\s+terms/i,
  ],
  privacy: [
    /privacy\s+policy/i,
    /privacy\s+notice/i,
    /privacy\s+statement/i,
    /data\s+protection/i,
    /how\s+we\s+use\s+your\s+data/i,
  ],
  cookies: [
    /cookie\s+policy/i,
    /cookie\s+notice/i,
    /cookie\s+consent/i,
    /manage\s+cookies/i,
    /cookie\s+preferences/i,
  ],
};

export const COOKIE_BANNER_SELECTORS = {
  onetrust: [
    '#onetrust-consent-sdk',
    '#onetrust-banner-sdk',
    '.onetrust-pc-sdk',
  ],
  cookiebot: [
    '#CybotCookiebotDialog',
    '#CybotCookiebotDialogBody',
  ],
  osano: [
    '#osano-cm-dom-info-dialog-open',
    '.osano-cm-dialog',
  ],
  custom: [
    '[id*="cookie"]',
    '[class*="cookie"]',
    '[id*="consent"]',
    '[class*="consent"]',
    '[id*="gdpr"]',
    '[class*="gdpr"]',
  ],
};

export const FORM_PATTERNS = {
  accountCreation: [
    /create\s+account/i,
    /sign\s+up/i,
    /register/i,
    /new\s+user/i,
  ],
  newsletter: [
    /newsletter/i,
    /email\s+updates/i,
    /subscribe/i,
    /mailing\s+list/i,
  ],
  dataCollection: [
    /personal\s+information/i,
    /contact\s+details/i,
    /provide\s+your\s+data/i,
  ],
};

/**
 * Detect document type from URL and page content
 */
export function detectDocumentType(url, pageText) {
  const urlLower = url.toLowerCase();
  const textLower = pageText.toLowerCase();

  const types = [];

  // Check URL patterns
  if (DOCUMENT_PATTERNS.terms.some(p => p.test(urlLower))) {
    types.push('terms');
  }
  if (DOCUMENT_PATTERNS.privacy.some(p => p.test(urlLower))) {
    types.push('privacy');
  }
  if (DOCUMENT_PATTERNS.cookies.some(p => p.test(urlLower))) {
    types.push('cookies');
  }

  // Check page content
  if (DOCUMENT_PATTERNS.terms.some(p => p.test(textLower))) {
    types.push('terms');
  }
  if (DOCUMENT_PATTERNS.privacy.some(p => p.test(textLower))) {
    types.push('privacy');
  }
  if (DOCUMENT_PATTERNS.cookies.some(p => p.test(textLower))) {
    types.push('cookies');
  }

  return [...new Set(types)];
}

/**
 * Detect cookie consent banner
 */
export function detectCookieBanner() {
  const banners = [];

  // Check for known frameworks
  for (const [framework, selectors] of Object.entries(COOKIE_BANNER_SELECTORS)) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && isVisible(element)) {
        banners.push({
          framework,
          element,
          selector,
        });
      }
    }
  }

  return banners;
}

/**
 * Check if element is visible
 */
function isVisible(element) {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

/**
 * Find decline/reject buttons in cookie banner
 */
export function findDeclineButtons(bannerElement) {
  const buttons = [];
  const text = bannerElement.textContent.toLowerCase();

  // Common decline button text
  const declineTexts = [
    'decline',
    'reject',
    'reject all',
    'necessary only',
    'essential only',
    'refuse',
    'deny',
    'no thanks',
    'not now',
  ];

  // Find buttons with decline text
  const allButtons = bannerElement.querySelectorAll('button, a, [role="button"]');
  for (const button of allButtons) {
    const buttonText = button.textContent.toLowerCase().trim();
    if (declineTexts.some(text => buttonText.includes(text))) {
      buttons.push(button);
    }
  }

  return buttons;
}

/**
 * Detect forms that collect personal data
 */
export function detectDataCollectionForms() {
  const forms = [];
  const allForms = document.querySelectorAll('form');

  for (const form of allForms) {
    const formText = form.textContent.toLowerCase();
    const inputs = form.querySelectorAll('input[type="email"], input[type="text"], input[type="tel"]');

    if (inputs.length > 0) {
      let isDataCollection = false;

      // Check form context
      for (const [type, patterns] of Object.entries(FORM_PATTERNS)) {
        if (patterns.some(p => p.test(formText))) {
          isDataCollection = true;
          break;
        }
      }

      if (isDataCollection) {
        forms.push({
          element: form,
          inputCount: inputs.length,
          hasEmail: form.querySelector('input[type="email"]') !== null,
        });
      }
    }
  }

  return forms;
}

