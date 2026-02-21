/**
 * Vercel AI SDK Middleware Adapter
 */
import type { EmotionalState } from '../config';
import type { SELFMiddlewareConfig, AppliedPolicy } from './types';
export declare function createVercelAIMiddleware(config: SELFMiddlewareConfig): {
    getContext: () => {
        sessionId: string;
        userId: string;
        currentState: EmotionalState;
        messageHistory: import("./types").MessageContent[];
        turnCount: number;
        createdAt: string;
        lastActivityAt: string;
    };
    getCurrentState: () => EmotionalState;
    processMessages: (messages: Array<{
        role: string;
        content: string;
    }>, baseSystemPrompt?: string) => {
        messages: {
            role: string;
            content: string;
        }[];
        processed: {
            inputState: EmotionalState;
            inputScores: Record<string, number>;
            inputTriggers: string[];
            policy: AppliedPolicy;
            processingTimeMs: number;
            blocked: boolean;
            blockReason: string | undefined;
        };
    };
    processOutput: (output: string) => {
        output: string;
        valid: boolean;
        violations: string[];
        repaired: boolean;
    };
    reset: (initialState?: EmotionalState) => void;
};
export declare function createSELFStreamWrapper(config: SELFMiddlewareConfig & {
    baseSystemPrompt?: string;
}): {
    middleware: {
        getContext: () => {
            sessionId: string;
            userId: string;
            currentState: EmotionalState;
            messageHistory: import("./types").MessageContent[];
            turnCount: number;
            createdAt: string;
            lastActivityAt: string;
        };
        getCurrentState: () => EmotionalState;
        processMessages: (messages: Array<{
            role: string;
            content: string;
        }>, baseSystemPrompt?: string) => {
            messages: {
                role: string;
                content: string;
            }[];
            processed: {
                inputState: EmotionalState;
                inputScores: Record<string, number>;
                inputTriggers: string[];
                policy: AppliedPolicy;
                processingTimeMs: number;
                blocked: boolean;
                blockReason: string | undefined;
            };
        };
        processOutput: (output: string) => {
            output: string;
            valid: boolean;
            violations: string[];
            repaired: boolean;
        };
        reset: (initialState?: EmotionalState) => void;
    };
    wrapStreamText: <T extends (params: any) => Promise<any>>(fn: T) => T;
};
//# sourceMappingURL=vercel-ai.d.ts.map