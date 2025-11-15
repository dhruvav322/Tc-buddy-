/**
 * Multi-provider API Manager for Privacy Guard
 * Supports Deepseek, OpenAI, Anthropic, Gemini, and Local analysis
 */

import { callDeepseek } from '../deepseek.js';
import { analyzeWithHeuristics } from './heuristics.js';
import { getSecret, hasSecret } from './secure-storage.js';

class DeepseekProvider {
  async analyze(text, options = {}) {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('Deepseek API key not configured');
    }
    console.log('🌐 Calling Deepseek API...');
    const result = await callDeepseek(text);
    console.log('✅ Deepseek API response received');
    return result;
  }

  async getApiKey() {
    return getSecret('deepseekApiKey');
  }

  getName() {
    return 'Deepseek';
  }

  isConfigured() {
    return hasSecret('deepseekApiKey');
  }
}

class OpenAIProvider {
  async analyze(text, options = {}) {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('🌐 Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: this.buildPrompt(text) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI API response received');
    return JSON.parse(data.choices[0].message.content);
  }

  async getApiKey() {
    return getSecret('openaiApiKey');
  }

  getName() {
    return 'OpenAI';
  }

  isConfigured() {
    return hasSecret('openaiApiKey');
  }

  getSystemPrompt() {
    return 'You are an expert privacy lawyer and consumer advocate analyzing legal documents. Your job is to:\n' +
      '1. Understand CONTEXT and NUANCE (not just keywords)\n' +
      '2. Explain WHY something is concerning or safe\n' +
      '3. Identify hidden risks that simple keyword matching would miss\n' +
      '4. Provide detailed, contextual explanations\n' +
      '5. Distinguish between acceptable practices and red flags\n\n' +
      'Be thorough, accurate, and explain your reasoning. This is for consumers who need to understand complex legal language.';
  }

  buildPrompt(text) {
    const truncated = text.slice(0, 15000);
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
   
   Cover: data collection/usage, financial terms, legal rights, user control, third-party sharing, hidden clauses

3️⃣ Red Flags (detailed analysis):
   For each category, provide:
   - "Yes" or "No"
   - A DETAILED explanation of WHY (not just "mentions keyword")
   - Context about severity
   
   Categories: data_selling, data_sharing, arbitration, auto_renewal, no_refunds, hidden_fees, tracking_cookies, targeted_advertising, location_tracking, biometric_data, ai_training, no_deletion, indefinite_retention, vague_partners, data_transfer

4️⃣ Risk Assessment: "Safe" / "Watch" / "Risky"

5️⃣ Scores:
   - privacy_score: 0-100 (higher = better privacy)
   - readability_score: Grade level (1-20)
   - trust_score: 0-100 (higher = more trustworthy)

CRITICAL: Your analysis must show DEEP UNDERSTANDING, not just keyword matching. Explain context, nuance, and why things matter.

Return JSON with: tldr, bullets (array), red_flags (object with detailed explanations), risk, privacy_score, readability_score, trust_score.`;
  }
}

class AnthropicProvider {
  async analyze(text, options = {}) {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    console.log('🌐 Calling Anthropic API...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options.model || 'claude-3-opus-20240229',
        max_tokens: 2000,
        messages: [
          { role: 'user', content: this.buildPrompt(text) },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Anthropic API response received');
    const content = data.content[0].text;
    return JSON.parse(content);
  }

  async getApiKey() {
    return getSecret('anthropicApiKey');
  }

  getName() {
    return 'Anthropic Claude';
  }

  isConfigured() {
    return this.getApiKey().then(key => !!key);
  }

  buildPrompt(text) {
    const truncated = text.slice(0, 15000);
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
   
   Cover: data collection/usage, financial terms, legal rights, user control, third-party sharing, hidden clauses

3️⃣ Red Flags (detailed analysis):
   For each category, provide:
   - "Yes" or "No"
   - A DETAILED explanation of WHY (not just "mentions keyword")
   - Context about severity
   
   Categories: data_selling, data_sharing, arbitration, auto_renewal, no_refunds, hidden_fees, tracking_cookies, targeted_advertising, location_tracking, biometric_data, ai_training, no_deletion, indefinite_retention, vague_partners, data_transfer

4️⃣ Risk Assessment: "Safe" / "Watch" / "Risky"

5️⃣ Scores:
   - privacy_score: 0-100 (higher = better privacy)
   - readability_score: Grade level (1-20)
   - trust_score: 0-100 (higher = more trustworthy)

CRITICAL: Your analysis must show DEEP UNDERSTANDING, not just keyword matching. Explain context, nuance, and why things matter.

Return JSON with: tldr, bullets (array), red_flags (object with detailed explanations), risk, privacy_score, readability_score, trust_score.`;
  }
}

class GeminiProvider {
  async analyze(text, options = {}) {
    const apiKey = await this.getApiKey();
    console.log('🔍 Gemini API key check:', apiKey ? 'Found (configured)' : 'NOT FOUND');
    
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = this.buildPrompt(text);
    console.log('🌐 Calling Gemini API...');
    console.log('📝 Text length:', text.length, 'characters');
    console.log('🔗 API URL:', `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt,
          }],
        }],
      }),
    });

    console.log('📡 Gemini API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Gemini API response received');
    console.log('📦 Response structure:', Object.keys(data));
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Unexpected Gemini response structure:', JSON.stringify(data, null, 2));
      throw new Error('Gemini API returned unexpected response structure');
    }
    
    const content = data.candidates[0].content.parts[0].text;
    console.log('📄 Extracted content length:', content.length);
    
    try {
      const parsed = JSON.parse(content);
      console.log('✅ Gemini response parsed successfully');
      return parsed;
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini JSON response:', parseError);
      console.error('📄 Raw content:', content.substring(0, 500));
      throw new Error(`Failed to parse Gemini response: ${parseError.message}`);
    }
  }

  async getApiKey() {
    return getSecret('geminiApiKey');
  }

  getName() {
    return 'Google Gemini';
  }

  isConfigured() {
    return this.getApiKey().then(key => !!key);
  }

  buildPrompt(text) {
    const truncated = text.slice(0, 15000);
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
   
   Cover: data collection/usage, financial terms, legal rights, user control, third-party sharing, hidden clauses

3️⃣ Red Flags (detailed analysis):
   For each category, provide:
   - "Yes" or "No"
   - A DETAILED explanation of WHY (not just "mentions keyword")
   - Context about severity
   
   Categories: data_selling, data_sharing, arbitration, auto_renewal, no_refunds, hidden_fees, tracking_cookies, targeted_advertising, location_tracking, biometric_data, ai_training, no_deletion, indefinite_retention, vague_partners, data_transfer

4️⃣ Risk Assessment: "Safe" / "Watch" / "Risky"

5️⃣ Scores:
   - privacy_score: 0-100 (higher = better privacy)
   - readability_score: Grade level (1-20)
   - trust_score: 0-100 (higher = more trustworthy)

CRITICAL: Your analysis must show DEEP UNDERSTANDING, not just keyword matching. Explain context, nuance, and why things matter.

Return JSON with: tldr, bullets (array), red_flags (object with detailed explanations), risk, privacy_score, readability_score, trust_score.`;
  }
}

class LocalProvider {
  async analyze(text, options = {}) {
    // Use heuristic-based analysis
    return analyzeWithHeuristics(text);
  }

  getName() {
    return 'Local (Heuristics)';
  }

  isConfigured() {
    return Promise.resolve(true); // Always available
  }
}

export class APIManager {
  constructor() {
    this.providers = {
      deepseek: new DeepseekProvider(),
      openai: new OpenAIProvider(),
      anthropic: new AnthropicProvider(),
      gemini: new GeminiProvider(),
      local: new LocalProvider(),
    };
  }

  /**
   * Analyze text with automatic provider selection
   * @param {string} text - Document text to analyze
   * @param {string} preferredProvider - Preferred provider ('auto', 'deepseek', 'openai', etc.)
   * @returns {Promise<object>} Analysis result
   */
  async analyze(text, preferredProvider = 'auto') {
    console.log('🔍 APIManager.analyze called with provider:', preferredProvider);
    
    if (preferredProvider === 'auto') {
      console.log('🔄 Using fallback chain (auto mode)');
      return this.analyzeWithFallback(text);
    }

    const provider = this.providers[preferredProvider];
    if (!provider) {
      throw new Error(`Unknown provider: ${preferredProvider}`);
    }

    const isConfigured = await provider.isConfigured();
    console.log(`🔑 Provider ${preferredProvider} configured:`, isConfigured);
    
    if (!isConfigured) {
      throw new Error(`${provider.getName()} API key not configured`);
    }

    try {
      console.log(`🚀 Calling ${provider.getName()} API...`);
      const result = await provider.analyze(text);
      console.log(`✅ ${provider.getName()} API call successful`);
      // Ensure provider name is set
      if (!result.provider) {
        result.provider = provider.getName();
      }
      return result;
    } catch (error) {
      console.error(`❌ ${provider.getName()} failed:`, error);
      console.warn(`${provider.getName()} failed, falling back to local:`, error);
      const localResult = await this.providers.local.analyze(text);
      // Mark that this was a fallback
      localResult.fellBackFrom = provider.getName();
      return localResult;
    }
  }

  /**
   * Analyze with automatic fallback chain
   */
  async analyzeWithFallback(text) {
    const { preferredApiProvider } = await chrome.storage.local.get('preferredApiProvider');
    const fallbackOrder = preferredApiProvider 
      ? [preferredApiProvider, 'local']
      : ['deepseek', 'openai', 'anthropic', 'gemini', 'local'];

    console.log('🔄 Fallback chain:', fallbackOrder);

    for (const providerName of fallbackOrder) {
      const provider = this.providers[providerName];
      if (!provider) {
        console.log(`⏭️  Skipping ${providerName} - provider not found`);
        continue;
      }

      const isConfigured = await provider.isConfigured();
      console.log(`🔑 ${providerName} configured:`, isConfigured);
      
      if (!isConfigured && providerName !== 'local') {
        console.log(`⏭️  Skipping ${providerName} - not configured`);
        continue;
      }

      try {
        console.log(`🚀 Trying ${providerName}...`);
        const result = await provider.analyze(text);
        console.log(`✅ ${providerName} succeeded!`);
        // Ensure provider name is set
        if (!result.provider) {
          result.provider = provider.getName();
        }
        return result;
      } catch (error) {
        console.warn(`❌ ${provider.getName()} failed:`, error.message);
        continue;
      }
    }

    throw new Error('All analysis providers failed');
  }

  /**
   * Get list of available providers
   */
  async getAvailableProviders() {
    const available = [];
    for (const [key, provider] of Object.entries(this.providers)) {
      const configured = await provider.isConfigured();
      available.push({
        key,
        name: provider.getName(),
        configured,
      });
    }
    return available;
  }
}

