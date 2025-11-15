const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * Master prompt instructions reused across requests.
 */
const SYSTEM_PROMPT =
  'You are an expert privacy lawyer and consumer advocate analyzing legal documents. Your job is to:\n' +
  '1. Understand CONTEXT and NUANCE (not just keywords)\n' +
  '2. Explain WHY something is concerning or safe\n' +
  '3. Identify hidden risks that simple keyword matching would miss\n' +
  '4. Provide detailed, contextual explanations\n' +
  '5. Distinguish between acceptable practices and red flags\n\n' +
  'Be thorough, accurate, and explain your reasoning. This is for consumers who need to understand complex legal language.';

/**
 * Invoke the Deepseek chat completion API to summarize a legal document.
 * Expects DEEPSEEK_API_KEY to be stored via chrome.storage or set in environment.
 *
 * @param {string} documentText - Visible text extracted from the page.
 * @returns {Promise<object>} Parsed JSON response containing tldr, bullets, red_flags, and risk.
 */
export async function callDeepseek(documentText) {
  if (!documentText) {
    throw new Error('No document text provided for Deepseek summarization.');
  }

  const apiKey = await resolveApiKey();
  if (!apiKey) {
    throw new Error('Deepseek API key not configured. Set it via extension options.');
  }

  console.log('🌐 Making Deepseek API request to:', DEEPSEEK_API_URL);
  console.log('📝 Text length:', documentText.length, 'characters');
  
  const prompt = buildUserPrompt(documentText);

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Deepseek API error:', response.status, errorText);
    throw new Error(`Deepseek API error: ${response.status} - ${errorText}`);
  }

  const payload = await response.json();
  console.log('✅ Deepseek API response received');
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Deepseek API returned empty content.');
  }

  try {
    const parsed = JSON.parse(content);
    console.log('✅ Deepseek response parsed successfully');
    return parsed;
  } catch (err) {
    console.error('❌ Failed to parse Deepseek response:', err);
    throw new Error('Failed to parse Deepseek response JSON.');
  }
}

/**
 * Construct the user prompt body with task instructions.
 */
function buildUserPrompt(documentText) {
  const truncated = documentText.slice(0, 15000);
  return `Analyze this privacy policy/terms document with DEEP CONTEXTUAL UNDERSTANDING. Don't just match keywords - understand what the document actually means for consumers.

Document:
${truncated}

Your Analysis Task:

1️⃣ TL;DR (2-3 sentences):
   - Summarize the MAIN privacy/data concerns
   - Highlight the most important risks or protections
   - Write in plain English for ordinary consumers

2️⃣ Key Points (5-7 detailed bullets):
   For each point, explain:
   - WHAT the policy says
   - WHY it matters (or doesn't matter)
   - CONTEXT that makes it risky or safe
   
   Cover:
   - Data collection and usage (be specific - what data, how used, who gets it)
   - Financial terms (fees, auto-renewal, refunds, cancellation)
   - Legal rights (arbitration, class action waivers, jurisdiction)
   - User control (can you delete data? opt out? export?)
   - Third-party sharing (who, why, can you prevent it?)
   - Any hidden or concerning clauses

3️⃣ Red Flags (detailed analysis):
   For each category, provide:
   - "Yes" or "No"
   - A DETAILED explanation of WHY (not just "mentions keyword")
   - Context about severity (e.g., "Yes - but only for service delivery" vs "Yes - sells to advertisers")
   
   Categories:
   - data_selling: Does the company sell user data to third parties?
   - data_sharing: Does the company share data with partners/affiliates?
   - arbitration: Is there a binding arbitration clause preventing class actions?
   - auto_renewal: Do subscriptions auto-renew without clear opt-out?
   - no_refunds: Are refunds prohibited or severely limited?
   - hidden_fees: Are there fees not clearly disclosed upfront?
   - tracking_cookies: Does the site use extensive tracking?
   - targeted_advertising: Is user data used for targeted ads?
   - location_tracking: Is precise location tracked?
   - biometric_data: Are biometrics (face, fingerprint) collected?
   - ai_training: Is user data used to train AI models?
   - no_deletion: Can users delete their data?
   - indefinite_retention: Is data kept forever?
   - vague_partners: Are third-party partners vaguely defined?
   - data_transfer: Is data transferred internationally?

4️⃣ Risk Assessment:
   - "Safe": Few concerns, good privacy protections, clear terms
   - "Watch": Some concerns, but manageable with caution
   - "Risky": Significant privacy/data concerns, proceed with caution

5️⃣ Scores:
   - privacy_score: 0-100 (higher = better privacy, lower = more concerning)
   - readability_score: Grade level (1-20, lower = easier to read)
   - trust_score: 0-100 (higher = more trustworthy)

CRITICAL: Your analysis must show DEEP UNDERSTANDING, not just keyword matching. Explain context, nuance, and why things matter.

Output JSON format:
{
  "tldr": "<2-3 sentence summary with context>",
  "bullets": [
    "📊 Data Collection: [detailed explanation with context]",
    "💰 Financial Terms: [detailed explanation]",
    ...
  ],
  "red_flags": {
    "data_selling": "Yes - explicitly states data may be sold to advertisers and data brokers. This is concerning because...",
    "arbitration": "No - users can pursue class action lawsuits",
    ...
  },
  "risk": "Watch",
  "privacy_score": 65,
  "readability_score": 14,
  "trust_score": 70
}`;
}

/**
 * Attempt to locate the API key from storage or the extension environment.
 */
async function resolveApiKey() {
  const { deepseekApiKey } = await chrome.storage.local.get('deepseekApiKey');
  if (deepseekApiKey) {
    return deepseekApiKey;
  }

  // Optional: allow developer mode environment override for testing.
  if (typeof process !== 'undefined' && process.env?.DEEPSEEK_API_KEY) {
    return process.env.DEEPSEEK_API_KEY;
  }

  return null;
}
