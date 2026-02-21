/**
 * Multilingual Safety Lexicon Types
 */
export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ko' | 'pt' | 'it' | 'ar' | 'hi' | 'ru';
export interface LexiconCategory {
    phrases: string[];
    normalized?: string[];
}
export interface MultilingualLexicon {
    language: SupportedLanguage;
    nativeName: string;
    rtl?: boolean;
    panic: LexiconCategory;
    hopelessness: LexiconCategory;
    impliedSelfHarm: LexiconCategory;
    selfHarm: LexiconCategory;
    shame: LexiconCategory;
    urgency: LexiconCategory;
    anger: LexiconCategory;
    angryPhysicality: LexiconCategory;
    reassurance: LexiconCategory;
    resolution: LexiconCategory;
    grounding: LexiconCategory;
    agency: LexiconCategory;
    crisis: LexiconCategory;
    crisisResources: CrisisResources;
}
export interface CrisisResources {
    emergencyNumber: string;
    crisisLine?: string;
    crisisText?: string;
    resources: CrisisResource[];
}
export interface CrisisResource {
    name: string;
    phone?: string;
    text?: string;
    website?: string;
    description: string;
}
export interface LanguageDetectionResult {
    detectedLanguage: SupportedLanguage;
    confidence: number;
    fallbackUsed: boolean;
}
export interface MultilingualConfig {
    defaultLanguage: SupportedLanguage;
    fallbackLanguage: SupportedLanguage;
    enabledLanguages: SupportedLanguage[];
    autoDetect: boolean;
    minConfidence: number;
}
export declare const DEFAULT_MULTILINGUAL_CONFIG: MultilingualConfig;
//# sourceMappingURL=types.d.ts.map