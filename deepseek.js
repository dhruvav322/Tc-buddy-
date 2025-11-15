const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * Master prompt instructions reused across requests.
 */
const SYSTEM_PROMPT =
  'You are a friendly assistant that explains website Terms & Conditions to ordinary consumers. Keep it short, accurate, and easy to understand.';

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
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    throw new Error(`Deepseek API error: ${response.status}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Deepseek API returned empty content.');
  }

  try {
    return JSON.parse(content);
  } catch (err) {
    throw new Error('Failed to parse Deepseek response JSON.');
  }
}

/**
 * Construct the user prompt body with task instructions.
 */
function buildUserPrompt(documentText) {
  const truncated = documentText.slice(0, 15000);
  return `Document: ${truncated}\n\nTask:\n1️⃣ Give a one-line TL;DR in plain English.\n2️⃣ Summarize the key points in 4–5 simple bullets about:\n\n    how data is used,\n\n    any fees or auto-renewals,\n\n    cancellation/refund rules,\n\n    dispute resolution.\n    3️⃣ Detect if any of these red flags appear:\n    ["Auto-renewal","No refunds","Hidden fees","Arbitration clause","Data sharing","Mandatory account","Broad license","Tracking cookies"]\n    Return "Yes"/"No" for each with a one-line reason.\n    4️⃣ Give an overall risk level: Safe / Watch / Risky.\n\nOutput JSON:\n{\n"tldr": "<plain one-line summary>",\n"bullets": ["...","..."],\n"red_flags": {"Auto-renewal":"Yes - auto charges monthly", "Refunds":"No - none mentioned", ...},\n"risk":"Watch"\n}`;
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
