/**
 * Middleware Adapter Types
 */

import type { EmotionalState } from '../config';

export interface SELFMiddlewareConfig {
  sessionId: string;
  userId: string;
  onStateChange?: (transition: StateChangeCallback) => void;
  onViolation?: (violation: ViolationCallback) => void;
  onBlocked?: (reason: string, context: Record<string, unknown>) => void;
  blockOnS3?: boolean;
  validateOutput?: boolean;
  logEvents?: boolean;
}

export interface StateChangeCallback {
  fromState: EmotionalState;
  toState: EmotionalState;
  timestamp: string;
  sessionId: string;
  userId: string;
  trigger: string;
  confidence: 'low' | 'medium' | 'high';
  scores: Record<string, number>;
}

export interface ViolationCallback {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context: Record<string, unknown>;
  timestamp: string;
}

export interface ProcessedMessage {
  inputState: EmotionalState;
  inputScores: Record<string, number>;
  inputTriggers: string[];
  policy: AppliedPolicy;
  outputValid?: boolean;
  outputViolations?: string[];
  repaired?: boolean;
  processingTimeMs: number;
  blocked: boolean;
  blockReason?: string;
}

export interface AppliedPolicy {
  state: EmotionalState;
  maxWords: number;
  maxQuestions: number;
  requiresGrounding: boolean;
  requiresAgencyStep: boolean;
  requiresCrisisSupport: boolean;
  styleRules: string[];
}

export interface MessageContent {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SELFMiddlewareContext {
  sessionId: string;
  userId: string;
  currentState: EmotionalState;
  messageHistory: MessageContent[];
  turnCount: number;
  createdAt: string;
  lastActivityAt: string;
}