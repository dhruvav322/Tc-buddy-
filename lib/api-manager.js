/**
 * Multi-provider API Manager for Privacy Guard
 * Supports Deepseek, OpenAI, Anthropic, Gemini, and Local analysis
 */

import { callDeepseek } from '../deepseek.js';
import { analyzeWithHeuristics } from './heuristics.js';

class DeepseekProvider {
  async analyze(text, options = {}) {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('Deepseek API key not configured');
    }
    return callDeepseek(text);
  }

  async getApiKey() {
    const { deepseekApiKey } = await chrome.storage.local.get('deepseekApiKey');
    return deepseekApiKey;
  }

  getName() {
    return 'Deepseek';
  }

  isConfigured() {
    return this.getApiKey().then(key => !!key);
  }
}

class OpenAIProvider {
  async analyze(text, options = {}) {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }

  async getApiKey() {
    const { openaiApiKey } = await chrome.storage.local.get('openaiApiKey');
    return openaiApiKey;
  }

  getName() {
    return 'OpenAI';
  }

  isConfigured() {
    return this.getApiKey().then(key => !!key);
  }

  getSystemPrompt() {
    return 'You are a privacy expert analyzing legal documents. Provide clear, accurate analysis in JSON format.';
  }

  buildPrompt(text) {
    return `Analyze this privacy policy/terms document and return JSON with: tldr, bullets (array), red_flags (object), risk (Safe/Watch/Risky), privacy_score (0-100), readability_score (grade level).\n\nDocument: ${text.slice(0, 15000)}`;
  }
}

class AnthropicProvider {
  async analyze(text, options = {}) {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

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
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    return JSON.parse(content);
  }

  async getApiKey() {
    const { anthropicApiKey } = await chrome.storage.local.get('anthropicApiKey');
    return anthropicApiKey;
  }

  getName() {
    return 'Anthropic Claude';
  }

  isConfigured() {
    return this.getApiKey().then(key => !!key);
  }

  buildPrompt(text) {
    return `Analyze this privacy policy/terms document and return JSON with: tldr, bullets (array), red_flags (object), risk (Safe/Watch/Risky), privacy_score (0-100), readability_score (grade level).\n\nDocument: ${text.slice(0, 15000)}`;
  }
}

class GeminiProvider {
  async analyze(text, options = {}) {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: this.buildPrompt(text),
          }],
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    return JSON.parse(content);
  }

  async getApiKey() {
    const { geminiApiKey } = await chrome.storage.local.get('geminiApiKey');
    return geminiApiKey;
  }

  getName() {
    return 'Google Gemini';
  }

  isConfigured() {
    return this.getApiKey().then(key => !!key);
  }

  buildPrompt(text) {
    return `Analyze this privacy policy/terms document and return JSON with: tldr, bullets (array), red_flags (object), risk (Safe/Watch/Risky), privacy_score (0-100), readability_score (grade level).\n\nDocument: ${text.slice(0, 15000)}`;
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
    if (preferredProvider === 'auto') {
      return this.analyzeWithFallback(text);
    }

    const provider = this.providers[preferredProvider];
    if (!provider) {
      throw new Error(`Unknown provider: ${preferredProvider}`);
    }

    try {
      return await provider.analyze(text);
    } catch (error) {
      console.warn(`${provider.getName()} failed, falling back to local:`, error);
      return await this.providers.local.analyze(text);
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

    for (const providerName of fallbackOrder) {
      const provider = this.providers[providerName];
      if (!provider) continue;

      const isConfigured = await provider.isConfigured();
      if (!isConfigured && providerName !== 'local') continue;

      try {
        const result = await provider.analyze(text);
        return { ...result, provider: provider.getName() };
      } catch (error) {
        console.warn(`${provider.getName()} failed:`, error);
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

