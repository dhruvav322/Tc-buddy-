/**
 * Heuristic-based local analysis engine
 * Provides fast, offline analysis without API calls
 */

// Red flag keywords will be loaded dynamically
let redFlagKeywords = null;

async function loadRedFlagKeywords() {
  if (redFlagKeywords) return redFlagKeywords;
  const response = await fetch(chrome.runtime.getURL('data/red-flag-keywords.json'));
  redFlagKeywords = await response.json();
  return redFlagKeywords;
}

/**
 * Analyze document text using keyword heuristics
 * @param {string} text - Document text to analyze
 * @returns {Promise<object>} Analysis result
 */
export async function analyzeWithHeuristics(text) {
  if (!text || text.length < 100) {
    return {
      tldr: 'Insufficient text to analyze. Please ensure you are on a Terms & Conditions or Privacy Policy page.',
      bullets: ['Document appears too short for meaningful analysis.'],
      red_flags: {},
      risk: 'Watch',
      privacy_score: 50,
      readability_score: 12,
      provider: 'Local (Heuristics)',
    };
  }

  const normalizedText = text.toLowerCase();
  const redFlags = await detectRedFlags(normalizedText);
  const flagCount = Object.values(redFlags).filter(v => v.startsWith('Yes')).length;
  
  const risk = calculateRisk(flagCount);
  const privacyScore = calculatePrivacyScore(redFlags, normalizedText);
  const readabilityScore = calculateReadability(text);

  const bullets = buildBullets(normalizedText, redFlags);
  const tldr = buildTLDR(flagCount, risk);

  return {
    tldr,
    bullets,
    red_flags: redFlags,
    risk,
    privacy_score: privacyScore,
    readability_score: readabilityScore,
    provider: 'Local (Heuristics)',
  };
}

/**
 * Detect red flags using keyword matching
 */
async function detectRedFlags(text) {
  const flags = {};
  const keywords = await loadRedFlagKeywords();

  for (const [key, config] of Object.entries(keywords)) {
    const found = config.keywords.find(kw => text.includes(kw));
    if (found) {
      flags[key] = `Yes - mentions "${found}"`;
    } else {
      flags[key] = 'No - not detected';
    }
  }

  return flags;
}

/**
 * Calculate overall risk level
 */
function calculateRisk(flagCount) {
  if (flagCount >= 6) return 'Risky';
  if (flagCount >= 3) return 'Watch';
  return 'Safe';
}

/**
 * Calculate privacy score (0-100, higher = better privacy)
 */
function calculatePrivacyScore(redFlags, text) {
  let score = 100;
  
  // Deduct points for each red flag
  const criticalFlags = ['data_selling', 'biometric_data', 'no_deletion'];
  const highFlags = ['arbitration', 'data_sharing', 'profile_building', 'location_tracking', 'ai_training', 'indefinite_retention'];
  const mediumFlags = ['auto_renewal', 'hidden_fees', 'tracking_cookies', 'targeted_advertising', 'data_transfer', 'vague_partners'];
  
  for (const [key, value] of Object.entries(redFlags)) {
    if (!value.startsWith('Yes')) continue;
    
    if (criticalFlags.includes(key)) score -= 15;
    else if (highFlags.includes(key)) score -= 10;
    else if (mediumFlags.includes(key)) score -= 5;
    else score -= 3;
  }

  // Bonus for explicit privacy protections
  if (text.includes('gdpr') || text.includes('ccpa') || text.includes('privacy rights')) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate readability score (Flesch-Kincaid grade level approximation)
 */
function calculateReadability(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) return 12;

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Simplified Flesch-Kincaid formula
  const gradeLevel = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;
  
  return Math.max(1, Math.min(20, Math.round(gradeLevel)));
}

function countSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

/**
 * Build summary bullets
 */
function buildBullets(text, redFlags) {
  const bullets = [];

  // Data collection
  if (text.includes('collect') || text.includes('data') || text.includes('information')) {
    if (redFlags.data_sharing?.startsWith('Yes')) {
      bullets.push('⚠️ Collects and shares your data with third parties');
    } else {
      bullets.push('📊 Collects user data for service delivery');
    }
  }

  // Auto-renewal
  if (redFlags.auto_renewal?.startsWith('Yes')) {
    bullets.push('🔄 Subscription auto-renews automatically');
  }

  // Refunds
  if (redFlags.no_refunds?.startsWith('Yes')) {
    bullets.push('❌ Refunds appear limited or unavailable');
  } else {
    bullets.push('💰 Refund policy unclear - confirm before purchase');
  }

  // Arbitration
  if (redFlags.arbitration?.startsWith('Yes')) {
    bullets.push('⚖️ Disputes require private arbitration (no class action)');
  }

  // Tracking
  if (redFlags.tracking_cookies?.startsWith('Yes') || redFlags.targeted_advertising?.startsWith('Yes')) {
    bullets.push('🍪 Uses tracking cookies and targeted advertising');
  }

  // Data selling
  if (redFlags.data_selling?.startsWith('Yes')) {
    bullets.push('🚨 May sell your data to third parties');
  }

  // Location
  if (redFlags.location_tracking?.startsWith('Yes')) {
    bullets.push('📍 Tracks your location data');
  }

  // Biometric
  if (redFlags.biometric_data?.startsWith('Yes')) {
    bullets.push('🔐 Collects biometric data (facial recognition, fingerprints)');
  }

  // AI training
  if (redFlags.ai_training?.startsWith('Yes')) {
    bullets.push('🤖 May use your data to train AI models');
  }

  // Deletion rights
  if (redFlags.no_deletion?.startsWith('Yes')) {
    bullets.push('🗑️ Limited or no right to delete your data');
  }

  if (bullets.length === 0) {
    bullets.push('✅ No obvious red flags detected in quick scan');
    bullets.push('⚠️ Always read full terms before agreeing');
  }

  return bullets;
}

/**
 * Build TL;DR summary
 */
function buildTLDR(flagCount, risk) {
  if (flagCount === 0) {
    return 'No obvious red flags detected, but always review full terms carefully.';
  }
  
  if (risk === 'Risky') {
    return `⚠️ ${flagCount} significant privacy concerns detected. Review carefully before proceeding.`;
  }
  
  if (risk === 'Watch') {
    return `⚠️ ${flagCount} potential concerns found. Read terms carefully, especially around data use and fees.`;
  }
  
  return `Mostly safe, but ${flagCount} minor concern(s) detected. Review terms before agreeing.`;
}

