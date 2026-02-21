/**
 * LangChain Middleware Adapter
 */
import type { EmotionalState } from '../config';
import type { SELFMiddlewareConfig, ProcessedMessage, SELFMiddlewareContext } from './types';
export declare class SELFCallbackHandler {
    private config;
    private context;
    constructor(config: SELFMiddlewareConfig);
    getContext(): SELFMiddlewareContext;
    getCurrentState(): EmotionalState;
    processInput(userMessage: string, baseSystemPrompt: string): {
        modifiedPrompt: string;
        processed: ProcessedMessage;
    };
    processOutput(output: string): {
        output: string;
        valid: boolean;
        violations: string[];
        repaired: boolean;
    };
    private getSafeResponsePrompt;
    private applyPolicyToPrompt;
}
export declare function createLangChainMiddleware(config: SELFMiddlewareConfig): {
    handler: SELFCallbackHandler;
    getContext: () => SELFMiddlewareContext;
    getHandler: () => SELFCallbackHandler;
};
export declare class SELFRunnable {
    private handler;
    constructor(config: SELFMiddlewareConfig & {
        baseSystemPrompt?: string;
    });
    invoke(input: {
        input: string;
    }): Promise<{
        input: string;
        systemPrompt: string;
        selfContext: ProcessedMessage;
    }>;
    get outputParser(): {
        invoke: (input: {
            text: string;
        }) => Promise<{
            output: string;
            valid: boolean;
            violations: string[];
            repaired: boolean;
        }>;
    };
    getCurrentState(): EmotionalState;
}
//# sourceMappingURL=langchain.d.ts.map