/**
 * SELF Async Model-Based State Detection Module
 *
 * Provides asynchronous model-based classification as a fallback
 * to the current lexicon-based regex approach. This allows for
 * more sophisticated state detection when external AI models are available.
 */
import type { EmotionalState } from './config';
/**
 * Result from state detection
 */
export interface StateDetectionResult {
    state: EmotionalState;
    scores: Record<string, number>;
    reasons: string[];
    triggers?: string[];
    minForcedState?: EmotionalState;
    clarifierRequired?: boolean;
    clarifierReason?: string;
    confidence?: 'high' | 'medium' | 'low';
}
/**
 * Model provider interface
 */
export interface ModelProvider {
    name: string;
    classify(text: string, context?: DetectionContext): Promise<ModelClassificationResult>;
    isAvailable(): Promise<boolean>;
}
/**
 * Context for model-based detection
 */
export interface DetectionContext {
    conversationHistory?: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>;
    previousState?: EmotionalState;
    metadata?: Record<string, unknown>;
}
/**
 * Result from model classification
 */
export interface ModelClassificationResult {
    state: EmotionalState;
    confidence: 'high' | 'medium' | 'low';
    scores: Record<string, number>;
    reasons: string[];
    triggers: string[];
    rawResponse?: string;
    modelId?: string;
}
/**
 * Configuration for model detection
 */
export interface ModelDetectorConfig {
    enabled: boolean;
    fallbackToLexicon: boolean;
    timeout: number;
    maxRetries: number;
    confidenceThreshold: {
        high: number;
        medium: number;
    };
}
/**
 * OpenAI-compatible model provider
 */
export declare class OpenAIModelProvider implements ModelProvider {
    name: string;
    private apiKey;
    private model;
    private baseUrl;
    constructor(config?: {
        apiKey?: string;
        model?: string;
        baseUrl?: string;
    });
    isAvailable(): Promise<boolean>;
    classify(text: string, context?: DetectionContext): Promise<ModelClassificationResult>;
    private buildSystemPrompt;
    private buildUserPrompt;
    private parseResponse;
}
/**
 * Anthropic Claude model provider
 */
export declare class AnthropicModelProvider implements ModelProvider {
    name: string;
    private apiKey;
    private model;
    constructor(config?: {
        apiKey?: string;
        model?: string;
    });
    isAvailable(): Promise<boolean>;
    classify(text: string, context?: DetectionContext): Promise<ModelClassificationResult>;
    private buildSystemPrompt;
    private buildUserPrompt;
    private parseResponse;
}
/**
 * Model-based state detector
 */
export declare class ModelBasedDetector {
    private config;
    private providers;
    private lexiconDetector?;
    constructor(config?: Partial<ModelDetectorConfig>, providers?: ModelProvider[]);
    /**
     * Set the lexicon-based detector to use as fallback
     */
    setLexiconDetector(detector: (message: string, history?: any[]) => StateDetectionResult): void;
    /**
     * Detect emotional state using model-based approach
     */
    detectState(message: string, history?: Array<{
        role: string;
        content: string;
    }>, context?: DetectionContext): Promise<StateDetectionResult>;
    /**
     * Fallback to lexicon-based detection
     */
    private fallbackToLexicon;
    /**
     * Wrap a promise with a timeout
     */
    private withTimeout;
    /**
     * Add a custom model provider
     */
    addProvider(provider: ModelProvider): void;
    /**
     * Check if any provider is available
     */
    isAvailable(): Promise<boolean>;
}
/**
 * Get the singleton model detector instance
 */
export declare function getModelDetector(): ModelBasedDetector;
/**
 * Reset the singleton (useful for testing)
 */
export declare function resetModelDetector(): void;
/**
 * Convenience function for async state detection
 */
export declare function detectStateWithModel(message: string, history?: Array<{
    role: string;
    content: string;
}>, context?: DetectionContext): Promise<StateDetectionResult>;
//# sourceMappingURL=model-detector.d.ts.map