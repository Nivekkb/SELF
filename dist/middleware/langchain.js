/**
 * LangChain Middleware Adapter
 */
import { detectState, validateOutput, repairOutput } from '../index.js';
import { getEffectivePolicy } from '../policy-profiles.js';
export class SELFCallbackHandler {
    constructor(config) {
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
    getContext() {
        return { ...this.context };
    }
    getCurrentState() {
        return this.context.currentState;
    }
    processInput(userMessage, baseSystemPrompt) {
        const startTime = Date.now();
        const history = this.context.messageHistory.map(m => ({
            role: m.role,
            content: m.content
        }));
        const detection = detectState(userMessage, history);
        const policy = getEffectivePolicy({ state: detection.state });
        let blocked = false;
        let blockReason;
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
        const appliedPolicy = {
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
    processOutput(output) {
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
    getSafeResponsePrompt(policy) {
        return `SELF SAFETY GOVERNANCE ACTIVE. Crisis state detected. Provide crisis resources and direct to human support.`;
    }
    applyPolicyToPrompt(policy, basePrompt) {
        return basePrompt;
    }
}
export function createLangChainMiddleware(config) {
    const handler = new SELFCallbackHandler(config);
    return {
        handler,
        getContext: () => handler.getContext(),
        getHandler: () => handler
    };
}
export class SELFRunnable {
    constructor(config) {
        this.handler = new SELFCallbackHandler(config);
    }
    async invoke(input) {
        return { input: input.input, systemPrompt: '', selfContext: {} };
    }
    get outputParser() {
        return {
            invoke: async (input) => this.handler.processOutput(input.text)
        };
    }
    getCurrentState() {
        return this.handler.getCurrentState();
    }
}
//# sourceMappingURL=langchain.js.map