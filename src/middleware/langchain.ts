/**
 * LangChain Middleware Adapter
 */

import { detectState, validateOutput, repairOutput } from '../index';
import { getEffectivePolicy } from '../policy-profiles';
import type { EmotionalState } from '../config';
import type { Policy } from '../index';
import type { SelfHistoryMessage } from '../types';
import type { SELFMiddlewareConfig, ProcessedMessage, AppliedPolicy, SELFMiddlewareContext } from './types';

export class SELFCallbackHandler {
  private config: SELFMiddlewareConfig;
  private context: SELFMiddlewareContext;

  constructor(config: SELFMiddlewareConfig) {
    this.config = { blockOnS3: true, validateOutput: true, logEvents: true, ...config };
    this.context = {
      sessionId: config.sessionId,
      userId: config.userId,
      currentState: 'S0',
      messageHistory: [],
      turnCount: 0,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    };
  }

  getContext(): SELFMiddlewareContext {
    return { ...this.context };
  }

  getCurrentState(): EmotionalState {
    return this.context.currentState;
  }

  processInput(userMessage: string, baseSystemPrompt: string): { modifiedPrompt: string; processed: ProcessedMessage } {
    const startTime = Date.now();
    const history: SelfHistoryMessage[] = this.context.messageHistory.map(m => ({
      role: m.role,
      content: m.content
    }));
    
    const detection = detectState(userMessage, history);
    const policy = getEffectivePolicy({ state: detection.state });
    
    let blocked = false;
    let blockReason: string | undefined;
    
    if (this.config.blockOnS3 && detection.state === 'S3') {
      blocked = true;
      blockReason = 'S3 crisis state detected';
    }
    
    const modifiedPrompt = blocked 
      ? this.getSafeResponsePrompt(policy) 
      : this.applyPolicyToPrompt(policy, baseSystemPrompt);
    
    if (detection.state !== this.context.currentState) {
      this.context.currentState = detection.state;
    }
    
    this.context.messageHistory.push({ role: 'user', content: userMessage });
    this.context.turnCount++;
    
    const appliedPolicy: AppliedPolicy = {
      state: policy.state,
      maxWords: policy.maxWords,
      maxQuestions: policy.maxQuestions,
      requiresGrounding: policy.requiresGrounding,
      requiresAgencyStep: policy.requiresAgencyStep,
      requiresCrisisSupport: policy.requiresCrisisSupport,
      styleRules: policy.styleRules
    };
    
    return {
      modifiedPrompt,
      processed: {
        inputState: detection.state,
        inputScores: detection.scores,
        inputTriggers: detection.triggers || [],
        policy: appliedPolicy,
        processingTimeMs: Date.now() - startTime,
        blocked,
        blockReason
      }
    };
  }

  processOutput(output: string): { output: string; valid: boolean; violations: string[]; repaired: boolean } {
    const policy = getEffectivePolicy({ state: this.context.currentState });
    this.context.messageHistory.push({ role: 'assistant', content: output });
    
    if (!this.config.validateOutput) {
      return { output, valid: true, violations: [], repaired: false };
    }
    
    const validation = validateOutput(output, policy);
    if (validation.ok) {
      return { output, valid: true, violations: [], repaired: false };
    }
    
    return {
      output: repairOutput(output, policy),
      valid: false,
      violations: validation.violations,
      repaired: true
    };
  }

  private getSafeResponsePrompt(policy: Policy): string {
    return `SELF SAFETY GOVERNANCE ACTIVE. Crisis state detected. Provide crisis resources and direct to human support.`;
  }

  private applyPolicyToPrompt(policy: Policy, basePrompt: string): string {
    return basePrompt;
  }
}

export function createLangChainMiddleware(config: SELFMiddlewareConfig) {
  const handler = new SELFCallbackHandler(config);
  return {
    handler,
    getContext: () => handler.getContext(),
    getHandler: () => handler
  };
}

export class SELFRunnable {
  private handler: SELFCallbackHandler;

  constructor(config: SELFMiddlewareConfig & { baseSystemPrompt?: string }) {
    this.handler = new SELFCallbackHandler(config);
  }

  async invoke(input: { input: string }) {
    return { input: input.input, systemPrompt: '', selfContext: {} as ProcessedMessage };
  }

  get outputParser() {
    return {
      invoke: async (input: { text: string }) => this.handler.processOutput(input.text)
    };
  }

  getCurrentState(): EmotionalState {
    return this.handler.getCurrentState();
  }
}