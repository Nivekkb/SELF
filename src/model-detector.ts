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
import { getLogger } from './logger';

const log = getLogger();

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
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
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

const DEFAULT_CONFIG: ModelDetectorConfig = {
  enabled: true,
  fallbackToLexicon: true,
  timeout: 5000,
  maxRetries: 1,
  confidenceThreshold: {
    high: 0.85,
    medium: 0.6,
  },
};

/**
 * OpenAI-compatible model provider
 */
export class OpenAIModelProvider implements ModelProvider {
  name = 'openai';
  private apiKey: string | null;
  private model: string;
  private baseUrl: string;

  constructor(config?: { apiKey?: string; model?: string; baseUrl?: string }) {
    this.apiKey = config?.apiKey || process.env.OPENAI_API_KEY || null;
    this.model = config?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.baseUrl = config?.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async classify(text: string, context?: DetectionContext): Promise<ModelClassificationResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(text, context);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    return this.parseResponse(content, this.model);
  }

  private buildSystemPrompt(): string {
    return `You are a safety-focused emotional state classifier for an AI system. Your task is to classify the user's emotional state into one of these categories:

- S0: Normal/calm state. User is stable, settled, or showing no distress signals.
- S0_GUARDED: Transitional state. User appears calm but has recent distress history or shows guarded signals.
- S1: Mild elevation. User shows mild distress signals (anxiety, mild frustration, some emotional discomfort).
- S2: Moderate elevation. User shows clear distress (significant anxiety, hopelessness, implied self-harm, moderate emotional crisis).
- S3: Severe elevation. User shows severe distress (explicit self-harm, suicidal ideation, severe crisis).

IMPORTANT SCORING RULES:
1. Self-harm language (suicide, kill myself, etc.) should ALWAYS result in S3 or at minimum S2.
2. Implied self-harm ("I don't want to be here anymore", "I can't do this anymore") should be S2 or higher.
3. Even if a user claims to be okay, look for distress signals in the content.

Respond with a JSON object containing:
{
  "state": "S0" | "S0_GUARDED" | "S1" | "S2" | "S3",
  "confidence": "high" | "medium" | "low",
  "scores": { "panic": 0-5, "hopelessness": 0-5, "selfHarm": 0-10, "impliedSelfHarm": 0-5, "shame": 0-3, "anger": 0-3, "urgency": 0-2 },
  "reasons": ["list of detected signals"],
  "triggers": ["list of trigger categories detected"]
}`;
  }

  private buildUserPrompt(text: string, context?: DetectionContext): string {
    let prompt = `Classify this user message:\n\n"${text}"`;
    
    if (context?.previousState) {
      prompt += `\n\nPrevious state: ${context.previousState}`;
    }
    
    if (context?.conversationHistory?.length) {
      const recentHistory = context.conversationHistory.slice(-3);
      prompt += `\n\nRecent conversation:\n${recentHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`;
    }
    
    return prompt;
  }

  private parseResponse(content: string, modelId: string): ModelClassificationResult {
    try {
      const parsed = JSON.parse(content);
      
      // Validate and normalize state
      const validStates: EmotionalState[] = ['S0', 'S0_GUARDED', 'S1', 'S2', 'S3'];
      const state = validStates.includes(parsed.state) ? parsed.state : 'S0';
      
      // Validate confidence
      const validConfidence = ['high', 'medium', 'low'];
      const confidence = validConfidence.includes(parsed.confidence) ? parsed.confidence : 'medium';
      
      return {
        state,
        confidence,
        scores: parsed.scores || {},
        reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
        triggers: Array.isArray(parsed.triggers) ? parsed.triggers : [],
        rawResponse: content,
        modelId,
      };
    } catch {
      // Return safe defaults on parse error
      return {
        state: 'S0',
        confidence: 'low',
        scores: {},
        reasons: ['Failed to parse model response'],
        triggers: [],
        rawResponse: content,
        modelId,
      };
    }
  }
}

/**
 * Anthropic Claude model provider
 */
export class AnthropicModelProvider implements ModelProvider {
  name = 'anthropic';
  private apiKey: string | null;
  private model: string;

  constructor(config?: { apiKey?: string; model?: string }) {
    this.apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY || null;
    this.model = config?.model || process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async classify(text: string, context?: DetectionContext): Promise<ModelClassificationResult> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(text, context);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '{}';

    return this.parseResponse(content, this.model);
  }

  private buildSystemPrompt(): string {
    // Similar to OpenAI prompt
    return `You are a safety-focused emotional state classifier. Classify user messages into states S0-S3.

States:
- S0: Normal/calm
- S0_GUARDED: Transitional
- S1: Mild distress
- S2: Moderate distress (including implied self-harm)
- S3: Severe distress (explicit self-harm/suicidal ideation)

CRITICAL: Any self-harm language must result in S3. Implied self-harm must be S2+.

Respond ONLY with valid JSON:
{"state":"S0|S0_GUARDED|S1|S2|S3","confidence":"high|medium|low","scores":{"panic":0,"hopelessness":0,"selfHarm":0,"impliedSelfHarm":0},"reasons":[],"triggers":[]}`;
  }

  private buildUserPrompt(text: string, context?: DetectionContext): string {
    return `Classify: "${text}"${context?.previousState ? `\nPrevious state: ${context.previousState}` : ''}`;
  }

  private parseResponse(content: string, modelId: string): ModelClassificationResult {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const json = jsonMatch ? jsonMatch[0] : '{}';
      const parsed = JSON.parse(json);
      
      const validStates: EmotionalState[] = ['S0', 'S0_GUARDED', 'S1', 'S2', 'S3'];
      const state = validStates.includes(parsed.state) ? parsed.state : 'S0';
      const validConfidence = ['high', 'medium', 'low'];
      const confidence = validConfidence.includes(parsed.confidence) ? parsed.confidence : 'medium';
      
      return {
        state,
        confidence,
        scores: parsed.scores || {},
        reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
        triggers: Array.isArray(parsed.triggers) ? parsed.triggers : [],
        rawResponse: content,
        modelId,
      };
    } catch {
      return {
        state: 'S0',
        confidence: 'low',
        scores: {},
        reasons: ['Failed to parse model response'],
        triggers: [],
        rawResponse: content,
        modelId,
      };
    }
  }
}

/**
 * Model-based state detector
 */
export class ModelBasedDetector {
  private config: ModelDetectorConfig;
  private providers: ModelProvider[] = [];
  private lexiconDetector?: (message: string, history?: any[]) => StateDetectionResult;

  constructor(
    config: Partial<ModelDetectorConfig> = {},
    providers?: ModelProvider[]
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (providers) {
      this.providers = providers;
    } else {
      // Default providers
      this.providers = [
        new OpenAIModelProvider(),
        new AnthropicModelProvider(),
      ];
    }
  }

  /**
   * Set the lexicon-based detector to use as fallback
   */
  setLexiconDetector(detector: (message: string, history?: any[]) => StateDetectionResult): void {
    this.lexiconDetector = detector;
  }

  /**
   * Detect emotional state using model-based approach
   */
  async detectState(
    message: string,
    history?: Array<{ role: string; content: string }>,
    context?: DetectionContext
  ): Promise<StateDetectionResult> {
    if (!this.config.enabled) {
      return this.fallbackToLexicon(message, 'Model detection disabled', history);
    }

    // Try each provider in order
    for (const provider of this.providers) {
      try {
        const isAvailable = await this.withTimeout(
          provider.isAvailable(),
          this.config.timeout
        );

        if (!isAvailable) {
          continue;
        }

        const result = await this.withTimeout(
          provider.classify(message, {
            ...context,
            conversationHistory: history?.map(h => ({
              role: h.role as 'user' | 'assistant',
              content: h.content,
            })),
          }),
          this.config.timeout
        );

        // Log successful model classification
        log.stateDetection({
          detectedState: result.state,
          confidence: result.confidence,
          scores: result.scores,
          reasons: result.reasons,
          triggers: result.triggers,
          durationMs: 0, // Caller can track this
        });

        return {
          state: result.state,
          scores: result.scores,
          reasons: result.reasons,
          triggers: result.triggers,
          confidence: result.confidence,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log.warn('state_detection', `Model provider ${provider.name} failed: ${errorMessage}`);
        continue;
      }
    }

    // All providers failed, fallback to lexicon
    return this.fallbackToLexicon(message, 'All model providers failed', history);
  }

  /**
   * Fallback to lexicon-based detection
   */
  private fallbackToLexicon(
    message: string,
    reason: string,
    history?: Array<{ role: string; content: string }>
  ): StateDetectionResult {
    log.info('state_detection', `Falling back to lexicon detection: ${reason}`);

    if (this.lexiconDetector) {
      return this.lexiconDetector(message, history);
    }

    // If no lexicon detector is set, return safe defaults
    return {
      state: 'S0',
      scores: {},
      reasons: [`Model detection unavailable: ${reason}`],
      triggers: [],
      confidence: 'low',
    };
  }

  /**
   * Wrap a promise with a timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Add a custom model provider
   */
  addProvider(provider: ModelProvider): void {
    this.providers.push(provider);
  }

  /**
   * Check if any provider is available
   */
  async isAvailable(): Promise<boolean> {
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          return true;
        }
      } catch {
        continue;
      }
    }
    return false;
  }
}

// Singleton instance
let detectorInstance: ModelBasedDetector | null = null;

/**
 * Get the singleton model detector instance
 */
export function getModelDetector(): ModelBasedDetector {
  if (!detectorInstance) {
    detectorInstance = new ModelBasedDetector();
  }
  return detectorInstance;
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetModelDetector(): void {
  detectorInstance = null;
}

/**
 * Convenience function for async state detection
 */
export async function detectStateWithModel(
  message: string,
  history?: Array<{ role: string; content: string }>,
  context?: DetectionContext
): Promise<StateDetectionResult> {
  const detector = getModelDetector();
  return detector.detectState(message, history, context);
}
