/**
 * Multilingual Lexicon Manager
 */

import type { SupportedLanguage, MultilingualLexicon, MultilingualConfig, LanguageDetectionResult } from './types';
import { DEFAULT_MULTILINGUAL_CONFIG } from './types';

const LANGUAGE_PATTERNS: Record<SupportedLanguage, RegExp[]> = {
  en: [/\b(the|is|are|was|were|have|has)\b/i, /\b(I|you|we|they|he|she)\b/i],
  es: [/\b(el|la|los|las|es|son|esta)\b/i, /\b(yo|tu|el|ella|nosotros)\b/i],
  fr: [/\b(le|la|les|est|sont|avoir)\b/i, /\b(je|tu|il|elle|nous)\b/i],
  de: [/\b(der|die|das|ist|sind|haben)\b/i, /\b(ich|du|er|sie|wir)\b/i],
  zh: [/[\u4e00-\u9fff]/],
  ja: [/[\u3040-\u309f\u30a0-\u30ff]/],
  ko: [/[\uac00-\ud7af]/],
  pt: [/\b(o|a|os|as|e|sao|tem)\b/i, /\b(eu|tu|ele|ela|nos)\b/i],
  it: [/\b(il|lo|la|e|sono|ha)\b/i, /\b(io|tu|lui|lei|noi)\b/i],
  ar: [/[\u0600-\u06ff]/],
  hi: [/[\u0900-\u097f]/],
  ru: [/[\u0400-\u04ff]/]
};

export class MultilingualLexiconManager {
  private lexicons: Map<SupportedLanguage, MultilingualLexicon> = new Map();
  private config: MultilingualConfig;

  constructor(config?: Partial<MultilingualConfig>) {
    this.config = { ...DEFAULT_MULTILINGUAL_CONFIG, ...config };
  }

  registerLexicon(lexicon: MultilingualLexicon): void {
    this.lexicons.set(lexicon.language, lexicon);
  }

  getLexicon(language: SupportedLanguage): MultilingualLexicon | undefined {
    return this.lexicons.get(language);
  }

  detectLanguage(text: string): LanguageDetectionResult {
    const scores: Record<string, number> = {};
    
    for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
      scores[lang] = patterns.reduce((sum, pattern) => {
        const matches = text.toLowerCase().match(pattern);
        return sum + (matches?.length || 0);
      }, 0);
    }
    
    let bestLang: SupportedLanguage = 'en';
    let bestScore = 0;
    
    for (const [lang, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestLang = lang as SupportedLanguage;
      }
    }
    
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = total > 0 ? bestScore / total : 0;
    
    return {
      detectedLanguage: bestLang,
      confidence,
      fallbackUsed: false
    };
  }

  getSupportedLanguages(): SupportedLanguage[] {
    return Array.from(this.lexicons.keys());
  }
}

let instance: MultilingualLexiconManager | null = null;

export function getMultilingualManager(config?: Partial<MultilingualConfig>): MultilingualLexiconManager {
  if (!instance) {
    instance = new MultilingualLexiconManager(config);
  }
  return instance;
}

export function detectLanguage(text: string): LanguageDetectionResult {
  return getMultilingualManager().detectLanguage(text);
}

export function getLexiconForLanguage(lang: SupportedLanguage): MultilingualLexicon | undefined {
  return getMultilingualManager().getLexicon(lang);
}