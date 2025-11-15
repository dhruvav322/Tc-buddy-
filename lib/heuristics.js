/**
 * Heuristic-based local analysis engine
 * Provides fast, offline analysis without API calls
 */

// Import advanced detection methods
import {
  findKeywordWithContext,
  detectLegalPatterns,
  extractEntities,
  analyzeSentenceComplexity,
  detectVagueLanguage,
  detectContradictions,
  calculateEnhancedRisk
} from './advanced-heuristics.js';

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
      provider: 'Local (Enhanced Heuristics)',
    };
  }

  const normalizedText = text.toLowerCase();
  
  // STEP 1: Original keyword-based detection (now with context awareness)
  const redFlags = await detectRedFlags(text); // Pass original text for context
  const flagCount = Object.values(redFlags).filter(v => v.startsWith('Yes')).length;
  
  // STEP 2: Advanced detection methods
  const legalPatterns = detectLegalPatterns(text);
  const entities = extractEntities(text);
  const complexity = analyzeSentenceComplexity(text);
  const vagueness = detectVagueLanguage(text);
  const contradictions = detectContradictions(text);
  
  // STEP 3: Enhanced risk calculation
  const enhancedRisk = calculateEnhancedRisk(text, redFlags);
  
  // STEP 4: Calculate scores
  const privacyScore = calculateEnhancedPrivacyScore(redFlags, normalizedText, entities, legalPatterns);
  const readabilityScore = calculateReadability(text);

  // STEP 5: Build comprehensive bullets
  const bullets = buildEnhancedBullets(normalizedText, redFlags, legalPatterns, entities, contradictions);
  const tldr = buildEnhancedTLDR(enhancedRisk, contradictions.length);

  return {
    tldr,
    bullets,
    red_flags: redFlags,
    risk: enhancedRisk.risk_level,
    privacy_score: privacyScore,
    readability_score: readabilityScore,
    provider: 'Local (Enhanced Heuristics)',
    // Additional advanced analysis data
    advanced_analysis: {
      legal_patterns: Object.keys(legalPatterns).length,
      high_risk_data_types: entities.data_types.high_risk,
      third_parties_count: entities.third_parties.length,
      contradictions: contradictions.length,
      sentence_complexity: Math.round(complexity.complexity_ratio * 100),
      vague_terms: vagueness.total_vague_terms,
      enhanced_risk: enhancedRisk
    }
  };
}

/**
 * Detect red flags using context-aware keyword matching
 * Now checks for negations and provides context
 */
async function detectRedFlags(text) {
  const flags = {};
  const keywords = await loadRedFlagKeywords();

  for (const [key, config] of Object.entries(keywords)) {
    let foundMatch = null;
    
    // Try each keyword with context awareness
    for (const keyword of config.keywords) {
      const result = findKeywordWithContext(text, keyword);
      if (result.found && !result.negated) {
        foundMatch = {
          keyword: keyword,
          context: result.context.substring(0, 100) // Truncate for display
        };
        break;
      }
    }
    
    if (foundMatch) {
      flags[key] = `Yes - mentions "${foundMatch.keyword}"`;
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
 * Enhanced privacy score with advanced detection
 */
function calculateEnhancedPrivacyScore(redFlags, text, entities, legalPatterns) {
  let score = calculatePrivacyScore(redFlags, text);
  
  // Additional deductions based on advanced detection
  
  // High-risk data collection
  score -= entities.data_types.high_risk.length * 8;
  
  // Critical legal patterns
  const criticalPatterns = Object.values(legalPatterns).filter(p => p.severity === 'critical');
  score -= criticalPatterns.length * 12;
  
  // High-severity legal patterns
  const highPatterns = Object.values(legalPatterns).filter(p => p.severity === 'high');
  score -= highPatterns.length * 8;
  
  // Many third parties
  if (entities.third_parties.length > 5) {
    score -= 10;
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

/**
 * Build enhanced TL;DR with advanced insights
 */
function buildEnhancedTLDR(enhancedRisk, contradictionCount) {
  const { risk_level, risk_score, reasons } = enhancedRisk;
  
  if (contradictionCount > 0) {
    return `🚨 CRITICAL: Found ${contradictionCount} contradiction(s) in terms. ${risk_level} risk detected (${risk_score}/100). Proceed with extreme caution.`;
  }
  
  if (risk_level === 'Critical') {
    return `🚨 CRITICAL RISK: ${reasons[0] || 'Multiple serious issues detected'}. Risk score: ${risk_score}/100. Strongly recommend reviewing alternatives.`;
  }
  
  if (risk_level === 'High') {
    return `⚠️ HIGH RISK: ${reasons[0] || 'Significant privacy concerns detected'}. Risk score: ${risk_score}/100. Review carefully before proceeding.`;
  }
  
  if (risk_level === 'Medium') {
    return `⚠️ MODERATE RISK: ${reasons[0] || 'Some concerning terms detected'}. Risk score: ${risk_score}/100. Read terms carefully.`;
  }
  
  return `✅ LOW RISK: No major concerns detected. Risk score: ${risk_score}/100. Standard terms, but always review before agreeing.`;
}

/**
 * Build enhanced bullets with advanced insights
 */
function buildEnhancedBullets(text, redFlags, legalPatterns, entities, contradictions) {
  const bullets = [];

  // Priority 1: Contradictions (most serious)
  if (contradictions.length > 0) {
    contradictions.forEach(c => {
      bullets.push(`🚨 CONTRADICTION: ${c.description}`);
    });
  }

  // Priority 2: Critical legal patterns
  Object.entries(legalPatterns).forEach(([key, pattern]) => {
    if (pattern.severity === 'critical') {
      bullets.push(`🚨 ${pattern.description} (found ${pattern.count}x)`);
    }
  });

  // Priority 3: High-risk data collection
  if (entities.data_types.high_risk.length > 0) {
    const dataTypes = entities.data_types.high_risk.slice(0, 3).join(', ');
    bullets.push(`🔴 Collects sensitive data: ${dataTypes}${entities.data_types.high_risk.length > 3 ? '...' : ''}`);
  }

  // Priority 4: High-severity legal patterns
  Object.entries(legalPatterns).forEach(([key, pattern]) => {
    if (pattern.severity === 'high') {
      bullets.push(`⚠️ ${pattern.description}`);
    }
  });

  // Priority 5: Traditional red flags (from keywords)
  if (redFlags.data_selling?.startsWith('Yes')) {
    bullets.push('🚨 May sell your data to third parties');
  }

  if (redFlags.biometric_data?.startsWith('Yes')) {
    bullets.push('🔐 Collects biometric data (facial recognition, fingerprints)');
  }

  if (redFlags.arbitration?.startsWith('Yes')) {
    bullets.push('⚖️ Disputes require private arbitration (no class action)');
  }

  if (redFlags.location_tracking?.startsWith('Yes')) {
    bullets.push('📍 Tracks your location data');
  }

  if (redFlags.ai_training?.startsWith('Yes')) {
    bullets.push('🤖 May use your data to train AI models');
  }

  if (redFlags.no_deletion?.startsWith('Yes')) {
    bullets.push('🗑️ Limited or no right to delete your data');
  }

  // Priority 6: Third parties
  if (entities.third_parties.length > 0) {
    bullets.push(`📤 Shares data with ${entities.third_parties.length} types of third parties`);
  }

  // Priority 7: Other concerning patterns
  if (redFlags.data_sharing?.startsWith('Yes')) {
    bullets.push('⚠️ Shares your data with third parties');
  }

  if (redFlags.tracking_cookies?.startsWith('Yes') || redFlags.targeted_advertising?.startsWith('Yes')) {
    bullets.push('🍪 Uses tracking cookies and targeted advertising');
  }

  if (redFlags.auto_renewal?.startsWith('Yes')) {
    bullets.push('🔄 Subscription auto-renews automatically');
  }

  if (redFlags.no_refunds?.startsWith('Yes')) {
    bullets.push('❌ Refunds appear limited or unavailable');
  }

  // If no major issues found
  if (bullets.length === 0) {
    bullets.push('✅ No major red flags detected in analysis');
    bullets.push('📋 Standard terms of service');
    bullets.push('⚠️ Always read full terms before agreeing');
  }

  // Limit to top 10 most important bullets
  return bullets.slice(0, 10);
}

