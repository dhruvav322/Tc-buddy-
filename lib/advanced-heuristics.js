/**
 * Advanced Heuristic Analysis Engine
 * Provides context-aware, intelligent analysis beyond simple keyword matching
 */

/**
 * NEGATION DETECTION
 * Fixes false positives like "we do NOT share your data"
 */
export function hasNegation(sentence) {
  const negationWords = [
    'not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere',
    'won\'t', 'wouldn\'t', 'shouldn\'t', 'couldn\'t', 'can\'t', 'cannot',
    'don\'t', 'doesn\'t', 'didn\'t', 'isn\'t', 'aren\'t', 'wasn\'t', 'weren\'t',
    'haven\'t', 'hasn\'t', 'hadn\'t'
  ];
  
  const lowerSentence = sentence.toLowerCase();
  return negationWords.some(neg => lowerSentence.includes(neg));
}

/**
 * CONTEXT-AWARE KEYWORD MATCHING
 * Returns true only if keyword found WITHOUT negation nearby
 */
export function findKeywordWithContext(text, keyword) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
      // Check if this sentence has negation
      if (hasNegation(sentence)) {
        // Keyword found but negated - skip it
        continue;
      }
      // Found keyword without negation!
      return {
        found: true,
        context: sentence.trim(),
        negated: false
      };
    }
  }
  
  return { found: false, context: null, negated: false };
}

/**
 * LEGAL PATTERN DETECTION
 * Finds common dangerous legal structures
 */
export function detectLegalPatterns(text) {
  const patterns = {
    // Unilateral changes - company can change terms anytime
    unilateral_changes: {
      regex: /\b(may|can|reserve|right to)\s+(change|modify|update|alter|amend|revise)\s+.{0,50}\s+(anytime|at any time|without notice|at our discretion|sole discretion)/gi,
      severity: 'high',
      description: 'Can change terms anytime without notice'
    },
    
    // Arbitration & class action waiver
    forced_arbitration: {
      regex: /\b(binding arbitration|mandatory arbitration|agree to arbitrate|waive.{0,30}(class action|jury trial)|arbitration agreement)/gi,
      severity: 'critical',
      description: 'Forces arbitration, waives right to sue or join class action'
    },
    
    // Broad intellectual property license
    broad_ip_license: {
      regex: /\b(perpetual|irrevocable|worldwide|royalty-free|transferable).{0,50}(license|right).{0,50}(content|data|intellectual property|user content)/gi,
      severity: 'high',
      description: 'Grants extremely broad rights to your content'
    },
    
    // Liability waiver
    liability_waiver: {
      regex: /\b(not (responsible|liable)|no (liability|warranty)|use at your own risk|as is|without warranty)/gi,
      severity: 'medium',
      description: 'Disclaims responsibility for problems or damages'
    },
    
    // Data selling (sneaky language)
    data_monetization: {
      regex: /\b(monetize|valuable consideration|compensation|revenue).{0,50}(data|information|personal information)/gi,
      severity: 'critical',
      description: 'May sell your data (using technical language)'
    },
    
    // Indefinite data retention
    indefinite_retention: {
      regex: /\b(retain|store|keep).{0,50}(indefinitely|as long as necessary|for our business purposes|until you request deletion)/gi,
      severity: 'high',
      description: 'Keeps your data indefinitely or for vague reasons'
    },
    
    // Automatic consent
    automatic_consent: {
      regex: /\b(by (using|accessing|continuing)|continued use).{0,50}(agree|accept|consent|bound by)/gi,
      severity: 'medium',
      description: 'Using the service = automatic agreement to terms'
    },
    
    // Data sharing with "partners" (vague)
    vague_sharing: {
      regex: /\b(share|disclose|provide|transfer).{0,50}(trusted partners|selected partners|third-party partners|affiliates|service providers)/gi,
      severity: 'high',
      description: 'Shares data with vaguely defined "partners"'
    }
  };

  const detected = {};
  for (const [key, pattern] of Object.entries(patterns)) {
    const matches = text.match(pattern.regex);
    if (matches && matches.length > 0) {
      detected[key] = {
        found: true,
        count: matches.length,
        severity: pattern.severity,
        description: pattern.description,
        examples: matches.slice(0, 2).map(m => m.substring(0, 100)) // First 2 examples, truncated
      };
    }
  }

  return detected;
}

/**
 * ENTITY EXTRACTION
 * Identifies specific data types, third parties, and purposes
 */
export function extractEntities(text) {
  const entities = {
    data_types: {
      high_risk: [],
      medium_risk: [],
      low_risk: []
    },
    third_parties: [],
    purposes: [],
    jurisdictions: []
  };

  // High-risk data types
  const highRiskData = [
    'biometric', 'fingerprint', 'facial recognition', 'voice print',
    'financial information', 'bank account', 'credit card', 'ssn', 'social security',
    'health data', 'medical', 'genetic', 'dna',
    'precise location', 'geolocation', 'gps',
    'children', 'child', 'minor'
  ];

  // Medium-risk data types
  const mediumRiskData = [
    'email', 'phone number', 'address', 'contact information',
    'browsing history', 'search history', 'device information',
    'ip address', 'cookies', 'identifiers'
  ];

  // Low-risk data types
  const lowRiskData = [
    'username', 'profile picture', 'preferences', 'settings'
  ];

  // Third-party types
  const thirdPartyTypes = [
    'advertiser', 'advertising', 'marketing partner', 'analytics provider',
    'data broker', 'affiliate', 'service provider', 'business partner',
    'government', 'law enforcement', 'legal authority'
  ];

  // Purposes
  const purposes = [
    'advertising', 'marketing', 'targeting', 'profiling',
    'analytics', 'research', 'improvement',
    'selling', 'monetization', 'revenue',
    'compliance', 'legal', 'enforcement'
  ];

  // Check for each entity type
  const lowerText = text.toLowerCase();

  highRiskData.forEach(term => {
    if (lowerText.includes(term)) {
      entities.data_types.high_risk.push(term);
    }
  });

  mediumRiskData.forEach(term => {
    if (lowerText.includes(term)) {
      entities.data_types.medium_risk.push(term);
    }
  });

  lowRiskData.forEach(term => {
    if (lowerText.includes(term)) {
      entities.data_types.low_risk.push(term);
    }
  });

  thirdPartyTypes.forEach(term => {
    if (lowerText.includes(term)) {
      entities.third_parties.push(term);
    }
  });

  purposes.forEach(term => {
    if (lowerText.includes(term)) {
      entities.purposes.push(term);
    }
  });

  // Common jurisdictions
  const jurisdictions = [
    'california', 'european union', 'eu', 'gdpr', 'ccpa',
    'united states', 'us', 'uk', 'china', 'russia',
    'cayman islands', 'british virgin islands' // Flags for offshore jurisdictions
  ];

  jurisdictions.forEach(term => {
    if (lowerText.includes(term)) {
      entities.jurisdictions.push(term);
    }
  });

  return entities;
}

/**
 * SENTENCE COMPLEXITY ANALYSIS
 * Flags deliberately confusing or overly complex sentences
 */
export function analyzeSentenceComplexity(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const complexSentences = [];

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // Flag sentences with > 40 words as overly complex
    if (wordCount > 40) {
      complexSentences.push({
        text: sentence.trim().substring(0, 150) + '...',
        wordCount,
        reason: 'Overly long sentence - may hide important information'
      });
    }

    // Check for excessive legal jargon
    const legalJargon = [
      'heretofore', 'hereinafter', 'aforementioned', 'pursuant to',
      'notwithstanding', 'whereby', 'thereof', 'therein', 'hereunder'
    ];

    const jargonCount = legalJargon.filter(term => 
      sentence.toLowerCase().includes(term)
    ).length;

    if (jargonCount >= 2) {
      complexSentences.push({
        text: sentence.trim().substring(0, 150) + '...',
        wordCount,
        reason: `Contains ${jargonCount} instances of legal jargon - deliberately confusing`
      });
    }
  }

  return {
    total_sentences: sentences.length,
    complex_sentences: complexSentences.length,
    complexity_ratio: complexSentences.length / sentences.length,
    examples: complexSentences.slice(0, 3) // First 3 examples
  };
}

/**
 * VAGUE LANGUAGE DETECTION
 * Finds deliberately vague or ambiguous terms
 */
export function detectVagueLanguage(text) {
  const vagueTerms = {
    qualifiers: [
      'reasonable', 'appropriate', 'necessary', 'sufficient',
      'adequate', 'substantial', 'significant'
    ],
    hedging: [
      'may', 'might', 'could', 'possibly', 'potentially',
      'from time to time', 'as needed', 'as appropriate'
    ],
    undefined: [
      'etc', 'and so on', 'and more', 'including but not limited to',
      'such as', 'and others'
    ]
  };

  const found = {
    qualifiers: 0,
    hedging: 0,
    undefined: 0,
    examples: []
  };

  const lowerText = text.toLowerCase();
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);

  // Count vague terms
  vagueTerms.qualifiers.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) found.qualifiers += matches.length;
  });

  vagueTerms.hedging.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) found.hedging += matches.length;
  });

  vagueTerms.undefined.forEach(term => {
    const regex = new RegExp(term, 'gi');
    const matches = lowerText.match(regex);
    if (matches) found.undefined += matches.length;
  });

  // Find example sentences with multiple vague terms
  for (const sentence of sentences) {
    let vagueCount = 0;
    Object.values(vagueTerms).flat().forEach(term => {
      if (sentence.toLowerCase().includes(term)) vagueCount++;
    });

    if (vagueCount >= 3) {
      found.examples.push({
        text: sentence.trim().substring(0, 150) + '...',
        vague_terms: vagueCount
      });
    }
  }

  return {
    total_vague_terms: found.qualifiers + found.hedging + found.undefined,
    by_type: {
      qualifiers: found.qualifiers,
      hedging: found.hedging,
      undefined: found.undefined
    },
    severity: found.qualifiers + found.hedging + found.undefined > 20 ? 'high' : 'medium',
    examples: found.examples.slice(0, 3)
  };
}

/**
 * CONTRADICTION DETECTOR
 * Finds when T&C contradict themselves
 */
export function detectContradictions(text) {
  // Split into sections if possible
  const sections = text.split(/\n\n+/);
  const contradictions = [];

  // Common contradiction patterns
  const contradictionPairs = [
    {
      claim: /we (do not|don't|never) (sell|share|disclose).{0,30}(data|information)/gi,
      contradiction: /we (may|can|will) (sell|share|disclose|transfer|provide).{0,30}(data|information)/gi,
      description: 'Claims not to sell data but also mentions selling/sharing data'
    },
    {
      claim: /your data is (private|secure|protected|confidential)/gi,
      contradiction: /(share|disclose|provide).{0,50}(third parties|partners|affiliates)/gi,
      description: 'Claims data is private but shares with third parties'
    },
    {
      claim: /you (control|own) your (data|information|content)/gi,
      contradiction: /(perpetual|irrevocable|unlimited|worldwide).{0,50}license/gi,
      description: 'Claims you control your data but takes broad license'
    }
  ];

  // Check for contradictions
  for (const pair of contradictionPairs) {
    const claimMatches = text.match(pair.claim);
    const contradictionMatches = text.match(pair.contradiction);

    if (claimMatches && contradictionMatches) {
      contradictions.push({
        type: 'contradiction',
        description: pair.description,
        claim_example: claimMatches[0].substring(0, 100),
        contradiction_example: contradictionMatches[0].substring(0, 100),
        severity: 'critical'
      });
    }
  }

  return contradictions;
}

/**
 * CALCULATE ENHANCED RISK SCORE
 * Uses all advanced detection methods
 */
export function calculateEnhancedRisk(text, basicFlags) {
  let risk = 0;
  const reasons = [];

  // Legal patterns (highest weight)
  const legalPatterns = detectLegalPatterns(text);
  const criticalLegal = Object.values(legalPatterns).filter(p => p.severity === 'critical').length;
  const highLegal = Object.values(legalPatterns).filter(p => p.severity === 'high').length;
  
  risk += criticalLegal * 20;
  risk += highLegal * 10;
  
  if (criticalLegal > 0) {
    reasons.push(`${criticalLegal} critical legal pattern(s) found`);
  }

  // Entity extraction (data types)
  const entities = extractEntities(text);
  risk += entities.data_types.high_risk.length * 15;
  risk += entities.data_types.medium_risk.length * 5;
  risk += entities.third_parties.length * 5;
  
  if (entities.data_types.high_risk.length > 0) {
    reasons.push(`Collects high-risk data: ${entities.data_types.high_risk.slice(0, 3).join(', ')}`);
  }

  // Sentence complexity
  const complexity = analyzeSentenceComplexity(text);
  if (complexity.complexity_ratio > 0.3) {
    risk += 15;
    reasons.push(`${Math.round(complexity.complexity_ratio * 100)}% of sentences are overly complex`);
  }

  // Vague language
  const vague = detectVagueLanguage(text);
  if (vague.total_vague_terms > 30) {
    risk += 10;
    reasons.push(`${vague.total_vague_terms} vague terms used`);
  }

  // Contradictions (very serious)
  const contradictions = detectContradictions(text);
  risk += contradictions.length * 25;
  
  if (contradictions.length > 0) {
    reasons.push(`${contradictions.length} contradiction(s) detected`);
  }

  // Basic flags (original system)
  const basicFlagCount = Object.values(basicFlags || {}).filter(v => v && v.startsWith('Yes')).length;
  risk += basicFlagCount * 5;

  return {
    risk_score: Math.min(100, risk),
    risk_level: risk >= 70 ? 'Critical' : risk >= 40 ? 'High' : risk >= 20 ? 'Medium' : 'Low',
    reasons: reasons,
    details: {
      legal_patterns: Object.keys(legalPatterns).length,
      high_risk_data: entities.data_types.high_risk.length,
      third_parties: entities.third_parties.length,
      complexity_ratio: Math.round(complexity.complexity_ratio * 100),
      vague_terms: vague.total_vague_terms,
      contradictions: contradictions.length
    }
  };
}


