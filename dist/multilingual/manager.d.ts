/**
 * Multilingual Lexicon Manager
 */
import type { SupportedLanguage, MultilingualLexicon, MultilingualConfig, LanguageDetectionResult } from './types';
export declare class MultilingualLexiconManager {
    private lexicons;
    private config;
    constructor(config?: Partial<MultilingualConfig>);
    registerLexicon(lexicon: MultilingualLexicon): void;
    getLexicon(language: SupportedLanguage): MultilingualLexicon | undefined;
    detectLanguage(text: string): LanguageDetectionResult;
    getSupportedLanguages(): SupportedLanguage[];
}
export declare function getMultilingualManager(config?: Partial<MultilingualConfig>): MultilingualLexiconManager;
export declare function detectLanguage(text: string): LanguageDetectionResult;
export declare function getLexiconForLanguage(lang: SupportedLanguage): MultilingualLexicon | undefined;
//# sourceMappingURL=manager.d.ts.map