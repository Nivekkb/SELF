/**
 * Vercel AI SDK Middleware Adapter
 */
import { detectState, validateOutput, repairOutput } from '../index.js';
import { getEffectivePolicy } from '../policy-profiles.js';
export function createVercelAIMiddleware(config) {
    const context = {
        sessionId: config.sessionId,
        userId: config.userId,
        currentState: 'S0',
        messageHistory: [],
        turnCount: 0,
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString()
    };
    const fullConfig = { blockOnS3: true, validateOutput: true, logEvents: true, ...config };
    return {
        getContext: () => ({ ...context }),
        getCurrentState: () => context.currentState,
        processMessages: (messages, baseSystemPrompt = 'You are a helpful assistant.') => {
            const startTime = Date.now();
            const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
            const userContent = lastUserMessage?.content || '';
            const history = context.messageHistory.map(m => ({
                role: m.role,
                content: m.content
            }));
            const detection = detectState(userContent, history);
            const policy = getEffectivePolicy({ state: detection.state });
            let blocked = false;
            let blockReason;
            if (fullConfig.blockOnS3 && detection.state === 'S3') {
                blocked = true;
                blockReason = 'S3 crisis state detected';
            }
            if (detection.state !== context.currentState) {
                context.currentState = detection.state;
            }
            if (lastUserMessage) {
                context.messageHistory.push({ role: 'user', content: userContent });
            }
            context.turnCount++;
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
                messages: [{ role: 'system', content: baseSystemPrompt }, ...messages],
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
        },
        processOutput: (output) => {
            const policy = getEffectivePolicy({ state: context.currentState });
            context.messageHistory.push({ role: 'assistant', content: output });
            if (!fullConfig.validateOutput) {
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
        },
        reset: (initialState = 'S0') => {
            context.currentState = initialState;
            context.messageHistory = [];
            context.turnCount = 0;
        }
    };
}
export function createSELFStreamWrapper(config) {
    const middleware = createVercelAIMiddleware(config);
    return {
        middleware,
        wrapStreamText: (fn) => {
            return fn;
        }
    };
}
//# sourceMappingURL=vercel-ai.js.map