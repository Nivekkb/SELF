import fs from "node:fs";
import path from "node:path";
import { selfConfig } from "./config.js";
import { ExitType, hasExitIntent } from "./exit-decision.js";
import { getEffectivePolicy } from "./policy-profiles.js";
export function processAngerPhysicalityClarifier(message, detection) {
    const normalizedMessage = normalize(message);
    // Check if clarification is required (ANGRY_PHYSICALITY triggered but target unclear)
    const angerPhysicalityTriggered = detection.triggers?.includes("ANGRY_PHYSICALITY") || false;
    if (!angerPhysicalityTriggered) {
        return {
            required: false,
            reason: "",
            target: 'unknown',
            resolved: true
        };
    }
    // Check if target is already clear from the message
    const targetPatterns = {
        self: ['myself', 'me', 'my own', 'i will', 'i want to', 'i feel like'],
        others: ['someone', 'somebody', 'him', 'her', 'them', 'he', 'she', 'they', 'person', 'people', 'my partner', 'my friend', 'my boss', 'my coworker'],
        objects: ['wall', 'door', 'table', 'phone', 'computer', 'glass', 'dish', 'plate', 'furniture', 'car', 'window', 'mirror', 'something'],
        none: ['nothing', 'no one', 'nobody', 'not really', 'not at all', 'just venting', 'just frustrated', 'just angry']
    };
    for (const [target, patterns] of Object.entries(targetPatterns)) {
        if (patterns.some(pattern => normalizedMessage.includes(pattern))) {
            return {
                required: false,
                reason: `Target identified as "${target}" from message`,
                target: target,
                resolved: true
            };
        }
    }
    // If target is unclear, clarification is required
    return {
        required: true,
        reason: "ANGRY_PHYSICALITY triggered but target unclear - need clarification",
        target: 'unknown',
        resolved: false
    };
}
export function generateClarifierQuestion() {
    return "When you mentioned feeling physically aggressive, are you thinking about hurting yourself, someone else, or something else? Or is this more about venting frustration?";
}
function resolveLogPath(explicit) {
    if (explicit)
        return explicit;
    if (process.env.SELF_LOG_PATH)
        return process.env.SELF_LOG_PATH;
    const dir = process.env.SELF_LOG_DIR || path.resolve(process.cwd(), "logs");
    return path.join(dir, "self-log.jsonl");
}
function normalize(text) {
    return text.toLowerCase();
}
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function matchCount(text, phrases) {
    const matched = [];
    let hits = 0;
    for (const phrase of phrases) {
        const regex = new RegExp(`(?<!\\w)${escapeRegex(phrase)}(?!\\w)`, "i");
        if (regex.test(text)) {
            hits += 1;
            matched.push(phrase);
        }
    }
    return { hits, matched };
}
const SAFE_VALIDATION_FALLBACK = selfConfig.lexicon.safeValidationPhrases[0] ||
    "it makes sense that this feels unsettling and hard to make sense of";
function buildSurveillanceContainmentReplacement() {
    return [
        `${SAFE_VALIDATION_FALLBACK}.`,
        "I'm not able to check a phone or help investigate whether someone is monitoring you.",
        "What I can do is help you get grounded in the moment and choose one small next step that supports your safety.",
        "If you want general privacy hygiene (without assuming anything is happening): update your device, review app permissions, and consider asking a trusted person or a qualified support service to help you look things over.",
    ].join(" ");
}
function normalizeForMatch(text) {
    return normalize(text).replace(/\s+/g, " ").trim();
}
function detectCertaintyPush(message) {
    const low = normalize(message);
    const matches = selfConfig.lexicon.certaintyPushes.filter((p) => low.includes(normalize(p)));
    return { triggered: matches.length > 0, matches };
}
function deriveReassurancePenalty(text) {
    const { hits, matched } = matchCount(text, selfConfig.lexicon.reassurance);
    if (!hits)
        return { score: 0, reasons: [] };
    return {
        score: hits * selfConfig.weights.reassurance,
        reasons: matched.map((p) => `Reassurance signal: "${p}"`),
    };
}
export function detectState(message, history = []) {
    const text = normalize(message);
    const scores = {};
    const reasons = [];
    const triggers = [];
    const panic = matchCount(text, selfConfig.lexicon.panic);
    const hopelessness = matchCount(text, selfConfig.lexicon.hopelessness);
    const selfHarm = matchCount(text, selfConfig.lexicon.selfHarm);
    const shame = matchCount(text, selfConfig.lexicon.shame);
    const urgency = matchCount(text, selfConfig.lexicon.urgency);
    const anger = matchCount(text, selfConfig.lexicon.anger);
    const angryPhysicality = matchCount(text, selfConfig.lexicon.angryPhysicality);
    const reassurance = deriveReassurancePenalty(text);
    scores.panic = panic.hits * selfConfig.weights.panic;
    scores.hopelessness = hopelessness.hits * selfConfig.weights.hopelessness;
    scores.selfHarm = selfHarm.hits * selfConfig.weights.selfHarm;
    scores.shame = shame.hits * selfConfig.weights.shame;
    scores.urgency = urgency.hits * selfConfig.weights.urgency;
    scores.anger = anger.hits * selfConfig.weights.anger;
    scores.angryPhysicality = angryPhysicality.hits * selfConfig.weights.angryPhysicality;
    scores.reassurance = reassurance.score;
    for (const phrase of [...panic.matched, ...hopelessness.matched, ...selfHarm.matched, ...shame.matched, ...urgency.matched, ...anger.matched, ...angryPhysicality.matched]) {
        reasons.push(`Matched phrase: "${phrase}"`);
    }
    reasons.push(...reassurance.reasons);
    const hasExplicitSelfHarm = selfHarm.hits > 0;
    if (hasExplicitSelfHarm) {
        reasons.push("Explicit self-harm language detected");
    }
    if (text.includes("rumination") || text.includes("looping")) {
        scores.panic += 1;
        reasons.push("Looping/rumination language detected");
    }
    // Boost for looping distress in recent history
    const recentUserMessages = history.filter((m) => m.role === "user").slice(-3);
    const repeatedThemes = recentUserMessages.filter((m) => normalize(m.content).includes("can't") || normalize(m.content).includes("cant")).length;
    if (repeatedThemes >= 2) {
        scores.panic += 0.5;
        reasons.push("Detected repetition of distress statements in recent history");
    }
    const totalScore = scores.panic +
        scores.hopelessness +
        scores.selfHarm +
        scores.shame +
        scores.urgency +
        scores.anger +
        scores.reassurance;
    if (totalScore >= selfConfig.thresholds.crisis) {
        reasons.push(`Crisis threshold reached: combined distress ${totalScore} >= ${selfConfig.thresholds.crisis}`);
    }
    // ANGRY_PHYSICALITY trigger detection
    const angryPhysicalityTriggered = angryPhysicality.hits > 0;
    if (angryPhysicalityTriggered) {
        triggers.push("ANGRY_PHYSICALITY");
        reasons.push(`ANGRY_PHYSICALITY trigger fired: ${angryPhysicality.matched.join(", ")}`);
    }
    let state = "S0";
    let minForcedState;
    // Determine base state from scoring
    if (hasExplicitSelfHarm || scores.selfHarm >= selfConfig.thresholds.s3 || totalScore >= selfConfig.thresholds.s3 + 1) {
        state = "S3";
        reasons.push("High self-harm intent or combined distress exceeded S3 threshold");
    }
    else if (totalScore >= selfConfig.thresholds.s2) {
        state = "S2";
        reasons.push("Combined distress exceeded S2 threshold");
    }
    else if (totalScore >= selfConfig.thresholds.s1) {
        state = "S1";
        reasons.push("Mild elevation exceeded S1 threshold");
    }
    // Apply ANGRY_PHYSICALITY trigger forcing (force state >= S2)
    if (angryPhysicalityTriggered) {
        const stateOrder = ["S0", "S0_GUARDED", "S1", "S2", "S3"];
        const currentIndex = stateOrder.indexOf(state);
        const s2Index = stateOrder.indexOf("S2");
        if (currentIndex < s2Index) {
            minForcedState = "S2";
            state = "S2";
            reasons.push("State forced to S2 due to ANGRY_PHYSICALITY trigger");
        }
    }
    return { state, scores, reasons, triggers, minForcedState };
}
function buildPolicy(state) {
    return getEffectivePolicy({ state });
}
export function applyPolicyToPrompt(policy, baseSystemPrompt, variant) {
    const lines = [
        `SELF state: ${policy.state}`,
        `Allowed response classes: ${policy.allowedResponseClasses.join(", ")}`,
        `Hard caps: max ${policy.maxWords} words, max ${policy.maxQuestions} question(s)`,
        `Avoid banned phrases and abrupt refusals: ${policy.bannedPhrases.join(", ") || "none"}`,
        `Style rules: ${policy.styleRules.join("; ")}`,
    ];
    if (variant && variant !== "control") {
        lines.push(`Variant: ${variant}`);
    }
    if (policy.requiresGrounding) {
        lines.push("Include a grounding/containment step to slow the pace.");
    }
    if (policy.requiresAgencyStep) {
        lines.push("Offer one gentle, agency-restoring next step.");
    }
    if (policy.requiresCrisisSupport) {
        lines.push("Encourage immediate human support and crisis resources without sounding like shutdown.");
    }
    if (policy.requiresValidation) {
        lines.push("Explicitly validate the user's stated truth/accomplishments; no challenging or doubting.");
    }
    if (policy.enforceNoHypotheticals) {
        lines.push("No hypotheticals or imaginative scenarios; stay concrete and present-focused.");
    }
    if (policy.forbidMechanismNaming) {
        lines.push("Do not name or describe surveillance/hacking mechanisms; avoid technical speculation entirely.");
    }
    if (policy.requiresLoopBreaker) {
        lines.push(`Include this loop-breaker line verbatim: "${policy.loopBreakerLine || selfConfig.lexicon.loopBreakerLine}"`);
    }
    if (policy.requiresHandoffFraming) {
        lines.push(`Include this human-handoff framing line: "${policy.handoffFramingLine || selfConfig.lexicon.handoffFramingLine}"`);
    }
    if (policy.isTerminalState) {
        lines.push("TERMINAL STATE: Suppress all engagement heuristics, enforce exit/rest posture.");
    }
    return `${baseSystemPrompt}\n\nSELF POLICY (${policy.state}):\n${lines.map((l) => `- ${l}`).join("\n")}`;
}
// State-gated response contract for S0 terminal state
export function applyStateGatedResponseContract(output, policy, userMessage) {
    // If not S0 or not a terminal state, return output unchanged
    if (policy.state !== "S0" || !policy.isTerminalState) {
        return output;
    }
    // Apply S0 terminal state behavior
    let result = output;
    // 1. Suppress all questions
    if (policy.suppressQuestions) {
        result = result.replace(/\?/g, ".");
    }
    // 2. Remove engagement heuristics and grounding offers
    const engagementPatterns = [
        /what feels most present for you right now\?/gi,
        /what would be most supportive in this moment\?/gi,
        /would you like to stay with this, or pause for a beat\?/gi,
        /do you want a listening ear, or a next step\?/gi,
        /what feels like the kindest next thing to name\?/gi,
        /take one slow breath/gi,
        /feel your feet/gi,
        /look around the room/gi,
        /press your hands together/gi,
        /notice the chair/gi,
        /name five things you can see/gi,
        /one small next step/gi,
        /choose one gentle next step/gi,
        /what tiny thing feels doable/gi,
        /you can pick one small action/gi
    ];
    for (const pattern of engagementPatterns) {
        result = result.replace(pattern, "");
    }
    // 3. Enforce rest posture - use declarative, closing statements
    if (policy.enforceRestPosture) {
        const restPostureStatements = [
            "I'm here with you.",
            "You're not alone.",
            "This space is always here when you need it.",
            "Take all the time you need.",
            "Your feelings are valid.",
            "I'll be quiet now so you can rest."
        ];
        // If the output is empty or very short after removing engagement patterns, add a rest posture statement
        const words = result.trim().split(/\s+/).filter(Boolean);
        if (words.length < 5) {
            const restStatement = restPostureStatements[Math.floor(Math.random() * restPostureStatements.length)];
            result = restStatement;
        }
    }
    // 4. Remove any remaining question marks
    result = result.replace(/\?/g, ".");
    // 5. Clean up multiple spaces and trim
    result = result.replace(/\s+/g, " ").trim();
    // 6. Ensure we don't exceed max words
    const finalWords = result.split(/\s+/).filter(Boolean);
    if (finalWords.length > policy.maxWords) {
        result = finalWords.slice(0, policy.maxWords).join(" ").trim() + "...";
    }
    return result;
}
function countQuestions(output) {
    return (output.match(/\?/g) || []).length;
}
function userOptedOutOfQuestions(message) {
    const low = normalize(message);
    return (low.includes("dont ask") ||
        low.includes("don't ask") ||
        low.includes("no questions") ||
        low.includes("stop asking") ||
        low.includes("dont question") ||
        low.includes("don't question") ||
        // Sleep-related opt-out patterns
        low.includes("want to sleep") ||
        low.includes("need to sleep") ||
        low.includes("going to sleep") ||
        low.includes("trying to sleep") ||
        low.includes("need to rest") ||
        low.includes("want to rest") ||
        low.includes("going to rest") ||
        low.includes("need some sleep") ||
        low.includes("get some sleep") ||
        low.includes("time to sleep") ||
        low.includes("tired and need") ||
        low.includes("exhausted and need") ||
        low.includes("just want to sleep") ||
        low.includes("i'm tired") ||
        low.includes("im tired") ||
        low.includes("so tired") ||
        low.includes("too tired"));
}
function canAppendWithoutTruncation(text, suffix, maxWords) {
    const coreWords = text.trim().split(/\s+/).filter(Boolean).length;
    const suffixWords = suffix.trim().split(/\s+/).filter(Boolean).length;
    return coreWords + suffixWords <= maxWords;
}
function defaultFollowUpQuestion(state, seed) {
    const s0Questions = [
        "What feels most present for you right now?",
        "What would be most supportive in this moment?",
        "Would you like to stay with this, or pause for a beat?",
        "Do you want a listening ear, or a next step?",
        "What feels like the kindest next thing to name?",
    ];
    const s1Questions = [
        "What would help you feel a little more steady right now?",
        "Do you want to slow down together, or talk it through?",
        "What kind of support would help most right now?",
        "What would make the next minute feel a bit easier?",
    ];
    const cues = state === "S1" ? s1Questions : s0Questions;
    return pickCue(`${normalize(seed)}|${state}|followup`, cues) || cues[0];
}
export function maybeAddFollowUpQuestion(output, policy, userMessage) {
    if (!output.trim())
        return output;
    if (policy.maxQuestions <= 0)
        return output;
    if (policy.state !== "S0" && policy.state !== "S1" && policy.state !== "S0_GUARDED")
        return output;
    if (countQuestions(output) > 0)
        return output;
    if (typeof userMessage === "string") {
        if (userMessage.includes("?"))
            return output;
        if (userOptedOutOfQuestions(userMessage))
            return output;
        // Check for sleep/rest intent and suppress questions
        const { hasRestIntent, hasExplicitConsentToEnd } = checkForExitAndRestIntents(userMessage);
        if (hasRestIntent || hasExplicitConsentToEnd)
            return output;
    }
    const question = defaultFollowUpQuestion(policy.state, userMessage || output);
    if (!question)
        return output;
    const suffix = question.trim().endsWith("?") ? question.trim() : `${question.trim()}?`;
    if (!canAppendWithoutTruncation(output, suffix, policy.maxWords))
        return output;
    return `${output.trim()} ${suffix}`.trim();
}
function continuityInviteQuestion(seed) {
    const questions = [
        "If you want to come back to that, what feels most important right now?",
        "If it helps to revisit it, what part do you want to start with?",
        "If you'd like to pick that back up, what's the key piece to name?",
    ];
    return pickCue(`${normalize(seed)}|continuity`, questions) || questions[0];
}
export function rewriteContinuityQuestions(output, policy, userMessage) {
    if (!output.trim())
        return output;
    if (policy.maxQuestions <= 0)
        return output;
    if (policy.state !== "S0" && policy.state !== "S1" && policy.state !== "S0_GUARDED")
        return output;
    const continuityQuestion = continuityInviteQuestion(userMessage || output);
    const recapQuestionPatterns = [
        /\b(?:can|could|would)\s+you\s+(?:please\s+)?remind\s+me\s+what\b[^?]*\?/gi,
        /\bwhat\s+did\s+(?:i|you)\s+(?:say|mention)\s+(?:earlier|before)\b[^?]*\?/gi,
        /\bwhat\s+were\s+you\s+(?:originally|initially)\s+(?:frustrated|upset|angry|mad)\s+about\b[^?]*\?/gi,
        /\b(?:can|could|would)\s+you\s+(?:please\s+)?(?:recap|repeat)\b[^?]*\?/gi,
        /\b(?:can|could|would)\s+you\s+(?:please\s+)?tell\s+me\s+again\b[^?]*\?/gi,
    ];
    const recapStatementPatterns = [
        /\b(?:can|could|would)\s+you\s+(?:please\s+)?remind\s+me\s+what\b[^.?!]*[.?!]/gi,
        /\bwhat\s+did\s+(?:i|you)\s+(?:say|mention)\s+(?:earlier|before)\b[^.?!]*[.?!]/gi,
        /\bwhat\s+were\s+you\s+(?:originally|initially)\s+(?:frustrated|upset|angry|mad)\s+about\b[^.?!]*[.?!]/gi,
    ];
    const memoryDisclaimerPatterns = [
        /\b(?:i\s+)?(?:don't|do\s+not)\s+(?:remember|recall)\b[^.?!]*[.?!]/gi,
        /\b(?:i\s+)?(?:can't|cannot)\s+(?:remember|recall)\b[^.?!]*[.?!]/gi,
        /\b(?:i\s+)?(?:don't|do\s+not)\s+have\s+(?:access|context)\b[^.?!]*[.?!]/gi,
        /\b(?:i\s+)?(?:can't|cannot)\s+(?:access|see)\s+(?:earlier|previous)\b[^.?!]*[.?!]/gi,
    ];
    let result = output;
    let changed = false;
    for (const pattern of recapQuestionPatterns) {
        const next = result.replace(pattern, continuityQuestion);
        if (next !== result) {
            changed = true;
            result = next;
        }
    }
    for (const pattern of recapStatementPatterns) {
        const next = result.replace(pattern, "");
        if (next !== result) {
            changed = true;
            result = next;
        }
    }
    for (const pattern of memoryDisclaimerPatterns) {
        const next = result.replace(pattern, "");
        if (next !== result) {
            changed = true;
            result = next;
        }
    }
    if (!changed)
        return output;
    result = result.replace(/\s+/g, " ").trim();
    if (!result) {
        const fallback = continuityQuestion.trim();
        const fallbackWords = fallback.split(/\s+/).filter(Boolean);
        if (fallbackWords.length <= policy.maxWords)
            return fallback;
        return output;
    }
    const words = result.split(/\s+/).filter(Boolean);
    if (words.length > policy.maxWords)
        return output;
    return result;
}
function userInvitesRecall(message) {
    const low = normalize(message || "");
    return (low.includes("remember") ||
        low.includes("as i said") ||
        low.includes("like i said") ||
        low.includes("earlier") ||
        low.includes("before") ||
        low.includes("previous") ||
        low.includes("last time") ||
        low.includes("again") ||
        low.includes("recap") ||
        low.includes("revisit") ||
        low.includes("go back") ||
        low.includes("back to") ||
        low.includes("continue") ||
        low.includes("resume") ||
        low.includes("pick up") ||
        low.includes("where were we"));
}
function stripMemoryLimitMeta(text) {
    const patterns = [
        /\b(?:i\s+)?(?:don't|do\s+not)\s+(?:remember|recall)\b[^.?!]*[.?!]/gi,
        /\b(?:i\s+)?(?:can't|cannot)\s+(?:remember|recall)\b[^.?!]*[.?!]/gi,
        /\b(?:i\s+)?(?:don't|do\s+not)\s+have\s+(?:access|context)\b[^.?!]*[.?!]/gi,
        /\b(?:i\s+)?(?:can't|cannot)\s+(?:access|see)\s+(?:earlier|previous)\b[^.?!]*[.?!]/gi,
        /\b(?:i\s+)?(?:don't|do\s+not)\s+(?:retain|store)\s+(?:memory|memories)\b[^.?!]*[.?!]/gi,
    ];
    let result = text;
    let changed = false;
    for (const pattern of patterns) {
        const next = result.replace(pattern, "");
        if (next !== result) {
            changed = true;
            result = next;
        }
    }
    result = result.replace(/\s+/g, " ").trim();
    return { text: result, changed };
}
function capitalizeLeadingLetter(text) {
    return text.replace(/^[\s"'“”‘’(\[]*([a-z])/, (match, letter) => match.replace(letter, letter.toUpperCase()));
}
export function rewriteSpokenMemoryRecall(output, policy, userMessage) {
    if (!output.trim())
        return output;
    const stripped = stripMemoryLimitMeta(output);
    let result = stripped.text;
    let changed = stripped.changed;
    const invited = userInvitesRecall(userMessage || "");
    if (!invited) {
        const recallPrefacePatterns = [
            /(^|[.!?]\s+)(?:earlier|before|previously|last time),?\s+you\s+(?:said|mentioned|shared|told me)\s+(?:that\s+)?/gi,
            /(^|[.!?]\s+)you\s+(?:said|mentioned|shared|told me)\s+(?:earlier|before|previously|last time),?\s+(?:that\s+)?/gi,
            /(^|[.!?]\s+)(?:as|like)\s+you\s+(?:said|mentioned|shared)\s+(?:earlier|before|previously|last time),?\s+/gi,
            /(^|[.!?]\s+)(?:i\s+)?(?:remember|recall)\s+you\s+(?:said|mentioned|shared|told me)\s+(?:earlier|before|previously|last time)?\s*,?\s*(?:that\s+)?/gi,
            /(^|[.!?]\s+)as\s+we\s+(?:talked|spoke)\s+about\s+(?:earlier|before|previously),?\s+/gi,
        ];
        for (const pattern of recallPrefacePatterns) {
            const next = result.replace(pattern, "$1");
            if (next !== result) {
                changed = true;
                result = next;
            }
        }
    }
    if (!changed)
        return output;
    result = result.replace(/\s+/g, " ").replace(/\s+([,.;!?])/g, "$1").trim();
    if (!result)
        return output;
    result = capitalizeLeadingLetter(result);
    const words = result.split(/\s+/).filter(Boolean);
    if (words.length > policy.maxWords)
        return output;
    return result;
}
function hasHypotheticals(output) {
    const low = normalize(output);
    return selfConfig.lexicon.hypotheticals.some((phrase) => low.includes(phrase));
}
function stableHash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}
function pickCue(seed, cues) {
    if (cues.length === 0)
        return "";
    const idx = Math.abs(stableHash(seed)) % cues.length;
    return cues[idx];
}
function ensureCrisisSupport(output) {
    const low = normalize(output);
    for (const line of selfConfig.lexicon.crisis) {
        if (low.includes(normalize(line))) {
            return output;
        }
    }
    const crisisLine = selfConfig.lexicon.crisis[0];
    return `${output.trim()} ${crisisLine}.`;
}
function ensureHandoffFraming(output, line) {
    const low = normalize(output);
    if (!line)
        return output;
    if (low.includes(normalize(line)))
        return output;
    return `${line} ${output.trim()}`.trim();
}
function ensureGrounding(output) {
    const low = normalize(output);
    for (const phrase of selfConfig.lexicon.grounding) {
        if (low.includes(phrase)) {
            return output;
        }
    }
    const prompt = pickCue(`${low}|grounding`, selfConfig.lexicon.grounding) || selfConfig.lexicon.grounding[0];
    return `${output.trim()} ${prompt}.`;
}
function ensureAgency(output) {
    const low = normalize(output);
    for (const phrase of selfConfig.lexicon.agency) {
        if (low.includes(phrase)) {
            return output;
        }
    }
    const prompt = selfConfig.lexicon.agency[0];
    return `${output.trim()} ${prompt}.`;
}
function capWordsPreservingSuffix(text, maxWords, suffix) {
    const coreWords = text.trim().split(/\s+/).filter(Boolean);
    const suffixWords = suffix.trim().split(/\s+/).filter(Boolean);
    if (coreWords.length + suffixWords.length <= maxWords) {
        return `${text.trim()}${suffix ? ` ${suffix.trim()}` : ""}`.trim();
    }
    const budget = Math.max(0, maxWords - suffixWords.length);
    const clipped = coreWords.slice(0, budget).join(" ").trim();
    const needsEllipsis = coreWords.length > budget && clipped.length > 0;
    const ellipsis = needsEllipsis ? "…" : "";
    return `${clipped}${ellipsis}${suffix ? ` ${suffix.trim()}` : ""}`.trim();
}
function capWordsPreservingAffixes(text, maxWords, prefix, suffix) {
    const prefixWords = prefix.trim().split(/\s+/).filter(Boolean);
    const suffixWords = suffix.trim().split(/\s+/).filter(Boolean);
    if (prefixWords.length + suffixWords.length >= maxWords) {
        const combined = `${prefix.trim()} ${suffix.trim()}`.trim();
        return combined.split(/\s+/).slice(0, maxWords).join(" ").trim();
    }
    const budget = Math.max(0, maxWords - prefixWords.length);
    const afterPrefix = text.trim();
    const capped = capWordsPreservingSuffix(afterPrefix, budget, suffix);
    return `${prefix.trim()} ${capped}`.trim();
}
export function validateOutput(output, policy) {
    const low = normalize(output);
    const violations = [];
    const words = output.trim().split(/\s+/).filter(Boolean);
    if (words.length > policy.maxWords) {
        violations.push(`Word count ${words.length} exceeds max ${policy.maxWords}`);
    }
    const questionCount = countQuestions(output);
    if (questionCount > policy.maxQuestions) {
        violations.push(`Question count ${questionCount} exceeds max ${policy.maxQuestions}`);
    }
    for (const phrase of policy.bannedPhrases) {
        if (low.includes(normalize(phrase))) {
            violations.push(`Banned phrase detected: "${phrase}"`);
        }
    }
    const bannedValidationMatches = detectBannedValidationLanguage(output).filter((phrase) => {
        if (!policy.requiresLoopBreaker)
            return true;
        const loopBreaker = policy.loopBreakerLine || selfConfig.lexicon.loopBreakerLine;
        if (!loopBreaker)
            return true;
        const hasLoopBreaker = normalizeForMatch(output).includes(normalizeForMatch(loopBreaker));
        if (!hasLoopBreaker)
            return true;
        return !normalize(loopBreaker).includes(normalize(phrase));
    });
    if (bannedValidationMatches.length > 0) {
        violations.push(`Banned validation language detected: ${bannedValidationMatches.map((p) => `"${p}"`).join(", ")}`);
    }
    if (policy.forbidMechanismNaming) {
        const mechanismMatches = matchCount(output, selfConfig.lexicon.mechanismNames);
        if (mechanismMatches.hits > 0) {
            violations.push(`Mechanism naming detected under surveillance guard: ${mechanismMatches.matched.map((m) => `"${m}"`).join(", ")}`);
        }
    }
    if (policy.enforceNoHypotheticals && hasHypotheticals(output)) {
        violations.push("Contains hypotheticals, which are disallowed for this state");
    }
    if (policy.requiresGrounding) {
        const hasGrounding = selfConfig.lexicon.grounding.some((p) => low.includes(p));
        if (!hasGrounding) {
            violations.push("Missing grounding or containment cue");
        }
    }
    if (policy.requiresAgencyStep) {
        const hasAgency = selfConfig.lexicon.agency.some((p) => low.includes(p));
        if (!hasAgency) {
            violations.push("Missing agency-restoring next step");
        }
    }
    if (policy.requiresCrisisSupport) {
        const hasCrisis = selfConfig.lexicon.crisis.some((p) => low.includes(normalize(p)));
        if (!hasCrisis) {
            violations.push("Missing crisis support encouragement");
        }
    }
    if (policy.requiresHandoffFraming) {
        const line = policy.handoffFramingLine || selfConfig.lexicon.handoffFramingLine;
        const has = line ? low.includes(normalize(line)) : true;
        if (!has)
            violations.push("Missing situational human-handoff framing");
    }
    if (policy.requiresValidation) {
        const hasValidation = selfConfig.lexicon.validationPhrases.some((p) => low.includes(normalize(p)));
        if (!hasValidation) {
            violations.push("Missing explicit validation of user's stated truth/accomplishments");
        }
    }
    if (policy.requiresLoopBreaker) {
        const line = policy.loopBreakerLine || selfConfig.lexicon.loopBreakerLine;
        const has = line ? normalizeForMatch(output).includes(normalizeForMatch(line)) : true;
        if (!has)
            violations.push("Missing certainty-loop breaker line");
    }
    return { ok: violations.length === 0, violations };
}
export function repairOutput(output, policy) {
    let result = output;
    // Remove or soften banned phrases
    for (const phrase of policy.bannedPhrases) {
        const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        result = result.replace(regex, "I'm here with you");
    }
    // Remove hypotheticals if needed
    if (policy.enforceNoHypotheticals && hasHypotheticals(result)) {
        const regex = new RegExp(selfConfig.lexicon.hypotheticals.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "gi");
        result = result.replace(regex, "").replace(/\s+/g, " ").trim();
    }
    // If surveillance guard is active and the draft includes mechanism details, replace with a coherent containment response.
    if (policy.forbidMechanismNaming) {
        const mechanismMatches = matchCount(result, selfConfig.lexicon.mechanismNames);
        if (mechanismMatches.hits > 0) {
            result = buildSurveillanceContainmentReplacement();
        }
    }
    // Replace banned validation language with the safe fallback
    const bannedValidationMatches = detectBannedValidationLanguage(result);
    if (bannedValidationMatches.length > 0) {
        for (const phrase of selfConfig.lexicon.bannedValidationPhrases) {
            const regex = new RegExp(escapeRegex(phrase), "gi");
            result = result.replace(regex, SAFE_VALIDATION_FALLBACK);
        }
        const hasSafeValidation = selfConfig.lexicon.safeValidationPhrases.some((p) => normalize(result).includes(normalize(p)));
        if (!hasSafeValidation) {
            result = `${SAFE_VALIDATION_FALLBACK}. ${result}`.trim();
        }
    }
    // Strip mechanism names when paranoia/surveillance guard is active
    if (policy.forbidMechanismNaming) {
        for (const phrase of selfConfig.lexicon.mechanismNames) {
            const regex = new RegExp(escapeRegex(phrase), "gi");
            result = result.replace(regex, "");
        }
        result = result.replace(/\s+/g, " ").trim();
    }
    // Cap questions by converting extras to statements
    let questionCount = 0;
    result = result.replace(/\?/g, () => {
        questionCount += 1;
        return questionCount > policy.maxQuestions ? "." : "?";
    });
    const lowBeforeAffixes = normalize(result);
    const prefixParts = [];
    if (policy.requiresValidation &&
        !selfConfig.lexicon.validationPhrases.some((p) => lowBeforeAffixes.includes(normalize(p)))) {
        prefixParts.push(`${selfConfig.lexicon.validationPhrases[0]}.`);
    }
    if (policy.requiresLoopBreaker) {
        const line = policy.loopBreakerLine || selfConfig.lexicon.loopBreakerLine;
        if (line && !normalizeForMatch(result).includes(normalizeForMatch(line))) {
            prefixParts.push(line);
        }
    }
    if (policy.requiresHandoffFraming) {
        const line = policy.handoffFramingLine || selfConfig.lexicon.handoffFramingLine;
        if (line && !lowBeforeAffixes.includes(normalize(line))) {
            prefixParts.push(line);
        }
    }
    const prefix = prefixParts.join(" ").trim();
    const suffixParts = [];
    if (policy.requiresGrounding && !selfConfig.lexicon.grounding.some((p) => lowBeforeAffixes.includes(p))) {
        const groundingCue = pickCue(`${lowBeforeAffixes}|grounding`, selfConfig.lexicon.grounding) || selfConfig.lexicon.grounding[0];
        suffixParts.push(`${groundingCue}.`);
    }
    if (policy.requiresAgencyStep && !selfConfig.lexicon.agency.some((p) => lowBeforeAffixes.includes(p))) {
        suffixParts.push(`${selfConfig.lexicon.agency[0]}.`);
    }
    if (policy.requiresCrisisSupport &&
        !selfConfig.lexicon.crisis.some((p) => lowBeforeAffixes.includes(normalize(p)))) {
        suffixParts.push(`${selfConfig.lexicon.crisis[0]}.`);
    }
    const suffix = suffixParts.join(" ");
    result = capWordsPreservingAffixes(result, policy.maxWords, prefix, suffix);
    // Double-check required cues after truncation (should be extremely rare).
    if (policy.requiresGrounding)
        result = ensureGrounding(result);
    if (policy.requiresAgencyStep)
        result = ensureAgency(result);
    if (policy.requiresHandoffFraming) {
        const line = policy.handoffFramingLine || selfConfig.lexicon.handoffFramingLine;
        if (line)
            result = ensureHandoffFraming(result, line);
    }
    if (policy.requiresCrisisSupport)
        result = ensureCrisisSupport(result);
    // Final hard cap to avoid "ensure*" pushing us over.
    const finalWords = result.trim().split(/\s+/).filter(Boolean);
    if (finalWords.length > policy.maxWords) {
        result = finalWords.slice(0, policy.maxWords).join(" ").trim();
    }
    return result.trim();
}
export function getS1Variant(seed) {
    const forced = process.env.SELF_S1_FORCE_VARIANT;
    if (forced === "control" || forced === "s1_grounding" || forced === "s1_agency" || forced === "s1_strict") {
        return forced;
    }
    const strictCohortEnabled = process.env.SELF_S1_STRICT_COHORT !== "false";
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
    }
    if (strictCohortEnabled) {
        const strictPercent = Number(process.env.SELF_S1_STRICT_PERCENT || "50");
        const bucket = Math.abs(hash) % 100;
        return bucket < strictPercent ? "s1_strict" : "control";
    }
    const bucket = Math.abs(hash) % 3;
    if (bucket === 0)
        return "control";
    if (bucket === 1)
        return "s1_grounding";
    return "s1_agency";
}
export function getS2Variant(seed) {
    const forced = process.env.SELF_S2_FORCE_VARIANT;
    if (forced === "control" || forced === "s2_strict") {
        return forced;
    }
    const strictEnabled = process.env.SELF_S2_STRICT_COHORT !== "false";
    if (!strictEnabled)
        return "control";
    const strictPercent = Number(process.env.SELF_S2_STRICT_PERCENT || "50");
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
    }
    const bucket = Math.abs(hash) % 100;
    return bucket < strictPercent ? "s2_strict" : "control";
}
export function adjustPolicyForVariant(policy, variant) {
    if (policy.state === "S2") {
        if (variant === "s2_strict") {
            return {
                ...policy,
                maxWords: Math.min(policy.maxWords, 90),
                maxQuestions: Math.min(policy.maxQuestions, 1),
                bannedPhrases: [...policy.bannedPhrases, "let me challenge you", "consider this challenge"],
                styleRules: [
                    ...policy.styleRules,
                    "high containment",
                    "no probing or interrogative questions",
                    "at most one gentle check-in question",
                    "suppress hypotheticals",
                    "name safety gently",
                ],
                enforceNoHypotheticals: true,
                requiresGrounding: true,
                requiresAgencyStep: true,
            };
        }
        return policy;
    }
    if (policy.state !== "S1")
        return policy;
    if (variant === "s1_grounding") {
        return {
            ...policy,
            maxWords: Math.min(policy.maxWords, 100),
            maxQuestions: Math.min(policy.maxQuestions, 1),
            styleRules: [...policy.styleRules, "include one grounding cue before asking anything"],
            requiresGrounding: true,
        };
    }
    if (variant === "s1_agency") {
        return {
            ...policy,
            maxWords: Math.min(policy.maxWords, 90),
            maxQuestions: Math.min(policy.maxQuestions, 1),
            styleRules: [...policy.styleRules, "offer one small next step", "no hypotheticals"],
            enforceNoHypotheticals: true,
            requiresAgencyStep: true,
        };
    }
    if (variant === "s1_strict") {
        return {
            ...policy,
            maxWords: Math.min(policy.maxWords, 90),
            maxQuestions: Math.min(policy.maxQuestions, 1),
            bannedPhrases: [...policy.bannedPhrases, "let me challenge you", "consider this challenge"],
            styleRules: [
                ...policy.styleRules,
                "tone: quiet and paced",
                "ask at most one gentle, spacious follow-up question",
                "suppress challenges and hypotheticals",
            ],
            enforceNoHypotheticals: true,
            requiresGrounding: true,
            requiresAgencyStep: true,
            requiresValidation: policy.requiresValidation ?? true,
        };
    }
    return policy;
}
export function needsValidationCue(message) {
    const low = normalize(message);
    return selfConfig.lexicon.validationTriggers.some((p) => low.includes(p));
}
function detectParanoidSurveillanceLanguage(message) {
    const low = normalize(message);
    const matches = selfConfig.lexicon.paranoidSurveillance.filter((p) => low.includes(p));
    // Backstop: catch common "spy/track/monitor my phone/device" phrasings that are easy to miss with exact lexicon matching.
    const hasDevice = /\b(phone|device|laptop|computer)\b/i.test(low);
    const hasSurveillanceVerb = /\b(spy|spying|track|tracking|monitor|monitoring|watch|watching|follow|following|listen|listening|record|recording|hack|hacked|hacking|wiretap|bugged)\b/i.test(low);
    const hasTarget = /\b(me|my|mine|myself|someone|anyone|people|they|theyre|they're)\b/i.test(low);
    if (hasDevice && hasSurveillanceVerb && hasTarget) {
        matches.push("device_surveillance_combo");
    }
    return { triggered: matches.length > 0, matches };
}
function detectExpertiseClaim(message) {
    const low = normalize(message);
    const matches = selfConfig.lexicon.expertiseClaims.filter((p) => low.includes(p));
    return { triggered: matches.length > 0, matches };
}
function detectBannedValidationLanguage(text) {
    const low = normalize(text);
    return selfConfig.lexicon.bannedValidationPhrases.filter((phrase) => low.includes(normalize(phrase)));
}
function detectRefusalLanguage(text, policy) {
    const low = normalize(text);
    const matches = selfConfig.lexicon.abruptRefusals.filter((phrase) => low.includes(normalize(phrase)));
    const reasons = matches.map((phrase) => `abrupt_refusal:${phrase}`);
    if (policy?.bannedPhrases?.length) {
        for (const phrase of policy.bannedPhrases) {
            if (low.includes(normalize(phrase))) {
                reasons.push(`banned_phrase:${phrase}`);
            }
        }
    }
    return reasons;
}
function collectRedTeamCandidates(message, policy) {
    const low = normalize(message);
    const candidates = [];
    const add = (category, phrase) => {
        const normalizedKey = `${category}:${phrase.trim()}`;
        if (!phrase.trim())
            return;
        if (candidates.some((c) => `${c.category}:${c.phrase}` === normalizedKey))
            return;
        candidates.push({ category, phrase: phrase.trim() });
    };
    // Paranoia/surveillance extensions not yet in lexicon
    const surveillanceProbes = [
        "drone",
        "satellite",
        "gps chip",
        "rfid",
        "implant",
        "microchip",
        "beacon",
        "tracker",
        "airtag",
        "bugging device",
        "thermal camera",
        "facial recognition",
    ];
    const paranoiaMatched = detectParanoidSurveillanceLanguage(message);
    for (const probe of surveillanceProbes) {
        if (low.includes(probe) && !paranoiaMatched.matches.some((p) => low.includes(p))) {
            add("paranoia_candidate", probe);
        }
    }
    // Exit intent variants not in current guardlists
    const exitVariants = [
        "signing off",
        "logging off",
        "checking out",
        "head out",
        "heading out",
        "bounce for now",
        "duck out",
        "peace out",
        "drop off",
        "disconnect now",
    ];
    for (const phrase of exitVariants) {
        if (low.includes(phrase))
            add("exit_candidate", phrase);
    }
    // Expertise claims not in core lexicon
    const expertiseVariants = [
        "licensed",
        "board certified",
        "board-certified",
        "credentialed",
        "licensed clinician",
        "licensed therapist",
        "licensed counselor",
        "lcsw",
        "lmft",
        "lpcc",
        "msw",
        "phd",
        "psyd",
        "md",
        "rn",
        "paramedic",
        "emt",
    ];
    for (const phrase of expertiseVariants) {
        if (low.includes(phrase) && !detectExpertiseClaim(message).matches.some((p) => low.includes(p))) {
            add("expertise_claim_candidate", phrase);
        }
    }
    // Mechanism names if present in user text while policy forbids them
    if (policy?.forbidMechanismNaming) {
        const mechanismMatches = selfConfig.lexicon.mechanismNames.filter((p) => low.includes(normalize(p)));
        for (const m of mechanismMatches)
            add("mechanism_mention", m);
    }
    // Banned validation phrasing that slipped through
    const bannedValidation = detectBannedValidationLanguage(message);
    for (const phrase of bannedValidation)
        add("validation_ban_candidate", phrase);
    return candidates;
}
export function hasResolutionCue(message) {
    const text = normalize(message);
    const matched = selfConfig.lexicon.resolution.filter((p) => text.includes(p));
    return { resolved: matched.length > 0, matches: matched };
}
export function detectStabilitySignals(message, history = []) {
    const text = normalize(message);
    const signals = [];
    // Check for somatic grounding signals
    const somaticMatches = selfConfig.lexicon.stabilitySignals.somaticGrounding.filter((p) => text.includes(p));
    if (somaticMatches.length > 0) {
        signals.push(...somaticMatches.map((p) => `somatic_grounding: "${p}"`));
    }
    // Check for temporal orientation signals
    const temporalMatches = selfConfig.lexicon.stabilitySignals.temporalOrientation.filter((p) => text.includes(p));
    if (temporalMatches.length > 0) {
        signals.push(...temporalMatches.map((p) => `temporal_orientation: "${p}"`));
    }
    // Check for agency continuity signals
    const agencyMatches = selfConfig.lexicon.stabilitySignals.agencyContinuity.filter((p) => text.includes(p));
    if (agencyMatches.length > 0) {
        signals.push(...agencyMatches.map((p) => `agency_continuity: "${p}"`));
    }
    // Check recent history for sustained stability signals
    const recentUserMessages = history.filter((m) => m.role === "user").slice(-2);
    for (const msg of recentUserMessages) {
        const msgText = normalize(msg.content);
        // Look for somatic grounding in history
        const historicSomatic = selfConfig.lexicon.stabilitySignals.somaticGrounding.filter((p) => msgText.includes(p));
        if (historicSomatic.length > 0 && !signals.some((s) => s.startsWith('somatic_grounding'))) {
            signals.push(`somatic_grounding: "${historicSomatic[0]}" (from history)`);
        }
        // Look for temporal orientation in history
        const historicTemporal = selfConfig.lexicon.stabilitySignals.temporalOrientation.filter((p) => msgText.includes(p));
        if (historicTemporal.length > 0 && !signals.some((s) => s.startsWith('temporal_orientation'))) {
            signals.push(`temporal_orientation: "${historicTemporal[0]}" (from history)`);
        }
        // Look for agency continuity in history
        const historicAgency = selfConfig.lexicon.stabilitySignals.agencyContinuity.filter((p) => msgText.includes(p));
        if (historicAgency.length > 0 && !signals.some((s) => s.startsWith('agency_continuity'))) {
            signals.push(`agency_continuity: "${historicAgency[0]}" (from history)`);
        }
    }
    return {
        somaticGrounding: somaticMatches.length > 0,
        temporalOrientation: temporalMatches.length > 0,
        agencyContinuity: agencyMatches.length > 0,
        signalsDetected: signals
    };
}
export const DEFAULT_STICKY_STATE_PARAMS = {
    ewmaAlpha: 0.35,
    stabilizationWindowTurns: 6,
    lowRiskTurnsRequired: 3,
    pushResetLowRiskTurns: 4,
    pushElevateThreshold: 3,
    cooldownTurnsAfterS2: 2,
    cooldownTurnsAfterS3: 4,
};
export function defaultStickySelfSessionState() {
    return {
        stateCurrent: "S0",
        riskScoreSmoothed: 0,
        cooldownTurnsRemaining: 0,
        consecutiveLowRiskUserTurns: 0,
        pushCount: 0,
        lastAffirmativeStabilizationAtTurn: null,
        turnIndex: 0,
    };
}
function coreStateRank(state) {
    return state === "S0" ? 0 : state === "S1" ? 1 : state === "S2" ? 2 : 3;
}
function detectedToCoreState(state) {
    if (state === "S3")
        return "S3";
    if (state === "S2")
        return "S2";
    if (state === "S1")
        return "S1";
    return "S0";
}
function stepDownOne(state) {
    if (state === "S3")
        return "S2";
    if (state === "S2")
        return "S1";
    if (state === "S1")
        return "S0";
    return "S0";
}
function computeRiskScoreRaw(detection) {
    return Object.values(detection.scores || {}).reduce((sum, val) => sum + (val || 0), 0);
}
function isLowRiskTurn(args) {
    const { detection, message, history } = args;
    const state = detectedToCoreState(detection.state);
    if (state !== "S0")
        return false;
    const paranoia = detectParanoidSurveillanceLanguage(message);
    if (paranoia.triggered)
        return false;
    const certainty = detectCertaintyPush(message);
    if (certainty.triggered)
        return false;
    const exit = checkForExitAndRestIntents(message);
    if (exit.hasExitIntent && !exit.hasRestIntent)
        return false;
    const isFalseCalm = checkForFalseCalm(message);
    if (isFalseCalm)
        return false;
    // If the last few user turns were elevated, we still treat this as low-risk, but not "recovered"
    // (recovery is governed by stabilization + cooldown in the sticky transition rules).
    void history;
    return true;
}
export function advanceStickySelfState(args) {
    const params = { ...DEFAULT_STICKY_STATE_PARAMS, ...(args.params || {}) };
    const detection = detectState(args.message, args.history);
    const detectedCore = detectedToCoreState(detection.state);
    const turnIndex = (args.session.turnIndex || 0) + 1;
    const cooldownBefore = Math.max(0, args.session.cooldownTurnsRemaining || 0);
    const cooldownAfterTick = Math.max(0, cooldownBefore - 1);
    const riskScoreRaw = computeRiskScoreRaw(detection);
    const prevEwma = Number.isFinite(args.session.riskScoreSmoothed) ? args.session.riskScoreSmoothed : 0;
    const riskScoreSmoothed = params.ewmaAlpha * riskScoreRaw + (1 - params.ewmaAlpha) * prevEwma;
    const certainty = detectCertaintyPush(args.message);
    const pushTriggered = certainty.triggered;
    const pushCountBefore = args.session.pushCount || 0;
    const stabilitySignals = detectStabilitySignals(args.message, args.history);
    const affirmativeStabilizationThisTurn = (stabilitySignals.somaticGrounding || stabilitySignals.temporalOrientation || stabilitySignals.agencyContinuity) &&
        !checkForFalseCalm(args.message);
    const lastAffirmativeStabilizationAtTurn = affirmativeStabilizationThisTurn
        ? turnIndex
        : args.session.lastAffirmativeStabilizationAtTurn ?? null;
    const affirmativeStabilizationSeen = typeof lastAffirmativeStabilizationAtTurn === "number" &&
        lastAffirmativeStabilizationAtTurn >= turnIndex - params.stabilizationWindowTurns;
    const lowRiskThisTurn = isLowRiskTurn({ detection, message: args.message, history: args.history });
    const consecutiveLowRiskUserTurns = lowRiskThisTurn
        ? (args.session.consecutiveLowRiskUserTurns || 0) + 1
        : 0;
    let pushCountAfter = pushCountBefore;
    if (pushTriggered) {
        pushCountAfter = pushCountBefore + 1;
    }
    else if (consecutiveLowRiskUserTurns >= params.pushResetLowRiskTurns) {
        pushCountAfter = 0;
    }
    let stateBefore = args.session.stateCurrent || "S0";
    // If certainty pressure is high, prevent drifting to S0 and optionally elevate to S1.
    if (pushCountAfter >= params.pushElevateThreshold && stateBefore === "S0") {
        stateBefore = "S1";
    }
    const escalationApplied = coreStateRank(detectedCore) > coreStateRank(stateBefore);
    let stateAfter = escalationApplied ? detectedCore : stateBefore;
    // If detected state is calmer, we still hold unless de-escalation conditions are met.
    const deescalationAttempted = coreStateRank(detectedCore) < coreStateRank(stateAfter);
    const deescalationBlockedReasons = [];
    let deescalationAllowed = false;
    if (deescalationAttempted && stateAfter !== "S0") {
        if (cooldownAfterTick > 0) {
            deescalationBlockedReasons.push(`cooldown_active:${cooldownAfterTick}`);
        }
        if (consecutiveLowRiskUserTurns < params.lowRiskTurnsRequired) {
            deescalationBlockedReasons.push(`low_risk_turns:${consecutiveLowRiskUserTurns}<${params.lowRiskTurnsRequired}`);
        }
        if (!affirmativeStabilizationSeen) {
            deescalationBlockedReasons.push("missing_affirmative_stabilization");
        }
        if (pushCountAfter >= params.pushElevateThreshold) {
            deescalationBlockedReasons.push("certainty_pressure_active");
        }
        deescalationAllowed = deescalationBlockedReasons.length === 0;
        if (deescalationAllowed) {
            stateAfter = stepDownOne(stateAfter);
        }
    }
    // Cooldown: after any S2/S3, hold de-escalation for several turns.
    let cooldownAfter = cooldownAfterTick;
    const enteredS3 = stateAfter === "S3" && args.session.stateCurrent !== "S3";
    const enteredS2 = stateAfter === "S2" && args.session.stateCurrent !== "S2";
    if (enteredS3) {
        cooldownAfter = Math.max(cooldownAfter, params.cooldownTurnsAfterS3);
    }
    else if (enteredS2) {
        cooldownAfter = Math.max(cooldownAfter, params.cooldownTurnsAfterS2);
    }
    const { confidence, uncertaintyReasons } = calculateConfidenceAndUncertainty({
        message: args.message,
        history: args.history,
        detection,
    });
    const consideredActions = ["hold"];
    const blockedActions = {};
    if (escalationApplied)
        consideredActions.push("escalate");
    if (deescalationAttempted)
        consideredActions.push("de-escalate");
    if (!deescalationAllowed && deescalationAttempted) {
        blockedActions["de-escalate"] = deescalationBlockedReasons.join(";");
    }
    if (pushCountAfter >= params.pushElevateThreshold)
        consideredActions.push("loop_breaker");
    if (!affirmativeStabilizationSeen && stateAfter !== "S0")
        blockedActions["return_to_s0"] = "missing_affirmative_stabilization";
    if (cooldownAfterTick > 0 && stateAfter !== "S0")
        blockedActions["return_to_s0"] = "cooldown_active";
    const overrideReasonParts = [];
    if (pushCountAfter >= params.pushElevateThreshold)
        overrideReasonParts.push("certainty_pressure");
    if (cooldownAfterTick > 0)
        overrideReasonParts.push("cooldown");
    if (deescalationBlockedReasons.length)
        overrideReasonParts.push("hold");
    const overrideReason = overrideReasonParts.length ? overrideReasonParts.join("+") : undefined;
    const nextSession = {
        stateCurrent: stateAfter,
        riskScoreSmoothed,
        cooldownTurnsRemaining: cooldownAfter,
        consecutiveLowRiskUserTurns,
        pushCount: pushCountAfter,
        lastAffirmativeStabilizationAtTurn,
        turnIndex,
    };
    // Set inertia lock if de-escalation was attempted but blocked
    if (deescalationAttempted && !deescalationAllowed) {
        nextSession.stateInertiaLock = {
            reason: deescalationBlockedReasons.join("; "),
            minState: stateAfter,
            turnsRemaining: Math.max(1, params.lowRiskTurnsRequired - consecutiveLowRiskUserTurns),
            activatedAtTurn: turnIndex,
        };
    }
    return {
        nextSession,
        detection,
        meta: {
            detectedState: detection.state,
            stateBefore: args.session.stateCurrent,
            stateAfter,
            riskScoreRaw,
            riskScoreSmoothed,
            lowRiskThisTurn,
            cooldownBefore,
            cooldownAfter,
            deescalationAttempted,
            deescalationAllowed,
            deescalationBlockedReasons,
            escalationApplied,
            pushTriggered,
            pushMatches: certainty.matches,
            pushCountBefore,
            pushCountAfter,
            affirmativeStabilizationThisTurn,
            affirmativeStabilizationSeen,
            lastAffirmativeStabilizationAtTurn,
            confidence,
            uncertaintyReasons,
            consideredActions,
            blockedActions,
            overrideReason,
        },
    };
}
export function isSafeToResumeNormalChat(args) {
    const { currentState, message, history } = args;
    const reasons = [];
    // If already in S0, no need to resume
    if (currentState === "S0") {
        return { safeToResume: true, confidence: "high", reasons: ["Already in normal state (S0)"] };
    }
    // Check for explicit resolution cues in the current message
    const resolutionCheck = hasResolutionCue(message);
    if (resolutionCheck.resolved) {
        reasons.push(`Resolution cues detected: "${resolutionCheck.matches.join('", "')}"`);
    }
    // Check recent history for sustained improvement
    const recentUserMessages = history.filter((m) => m.role === "user").slice(-3);
    const recentResolutionCount = recentUserMessages.filter((m) => hasResolutionCue(m.content).resolved).length;
    if (recentResolutionCount >= 2) {
        reasons.push(`Sustained resolution detected in ${recentResolutionCount} of last 3 user messages`);
    }
    // Check for absence of distress signals in recent history
    const recentDistressCheck = detectState(recentUserMessages.map(m => m.content).join(" "));
    if (recentDistressCheck.state === "S0") {
        reasons.push("Recent conversation history shows no distress signals");
    }
    // Check for positive stabilization signals (require at least one affirmative signal)
    const stabilitySignals = detectStabilitySignals(message, history);
    const hasPositiveStabilization = stabilitySignals.somaticGrounding || stabilitySignals.temporalOrientation || stabilitySignals.agencyContinuity;
    // Block resume if recovery is only politeness, gratitude, or closure language
    const isFalseCalm = checkForFalseCalm(message);
    // State-specific safety checks with enhanced stabilization requirements
    if (currentState === "S0_GUARDED") {
        // For S0_GUARDED, require resolution cues AND positive stabilization signals
        if (resolutionCheck.resolved && hasPositiveStabilization && !isFalseCalm) {
            reasons.push("S0_GUARDED state: Resolution cues + positive stabilization signals detected for return to normal");
            reasons.push(`Stability signals: ${stabilitySignals.signalsDetected.join(', ')}`);
            return { safeToResume: true, confidence: "high", reasons };
        }
        else if (resolutionCheck.resolved) {
            reasons.push("S0_GUARDED state: Resolution cues detected but missing required positive stabilization signals or false calm detected");
        }
    }
    if (currentState === "S1") {
        // For S1, require resolution cues AND at least one positive stabilization signal
        if (resolutionCheck.resolved && hasPositiveStabilization && !isFalseCalm) {
            reasons.push("S1 state: Resolution cues + positive stabilization signals detected for return to normal");
            reasons.push(`Stability signals: ${stabilitySignals.signalsDetected.join(', ')}`);
            return { safeToResume: true, confidence: "high", reasons };
        }
        else if (resolutionCheck.resolved) {
            reasons.push("S1 state: Resolution cues detected but missing required positive stabilization signals or false calm detected");
            reasons.push("Required: at least one of somatic grounding, temporal orientation, or agency continuity");
        }
    }
    if (currentState === "S2" || currentState === "S3") {
        // For higher states, require resolution cues, sustained improvement, AND positive stabilization signals
        if (resolutionCheck.resolved && recentResolutionCount >= 2 && hasPositiveStabilization && !isFalseCalm) {
            reasons.push(`S${currentState[1]} state: Resolution cues + sustained improvement + positive stabilization signals detected`);
            reasons.push(`Stability signals: ${stabilitySignals.signalsDetected.join(', ')}`);
            return { safeToResume: true, confidence: "high", reasons };
        }
        if (resolutionCheck.resolved && recentDistressCheck.state === "S0" && hasPositiveStabilization && !isFalseCalm) {
            reasons.push(`S${currentState[1]} state: Resolution cues + no recent distress + positive stabilization signals detected`);
            reasons.push(`Stability signals: ${stabilitySignals.signalsDetected.join(', ')}`);
            return { safeToResume: true, confidence: "high", reasons };
        }
        else if (resolutionCheck.resolved) {
            reasons.push(`S${currentState[1]} state: Resolution cues detected but missing required positive stabilization signals or false calm detected`);
        }
    }
    // If no clear safety signal, explain why not safe to resume
    if (!resolutionCheck.resolved) {
        reasons.push("No resolution cues detected in current message");
    }
    if (recentResolutionCount < 2) {
        reasons.push("Insufficient sustained resolution in recent history");
    }
    if (recentDistressCheck.state !== "S0") {
        reasons.push(`Recent history still shows ${recentDistressCheck.state} level distress`);
    }
    if (!hasPositiveStabilization) {
        reasons.push("Missing required positive stabilization signals (grounding, temporal orientation, or agency)");
    }
    if (isFalseCalm) {
        reasons.push("False calm detected: recovery appears to be only politeness, gratitude, or closure language");
    }
    return { safeToResume: false, confidence: "low", reasons };
}
// Define Safe Failure modes for SELF engine
/*
Acceptable failure = holding too long (erring on the side of caution)
Unacceptable failure = early release with false calm (premature normalization)

SELF prioritizes containment over premature normalization to ensure user safety.
*/
// Helper function to detect false calm (politeness, gratitude, closure language without genuine stabilization)
function checkForFalseCalm(message) {
    const text = normalize(message);
    const falseCalmPatterns = [
        // Politeness patterns
        "thank you",
        "thanks",
        "appreciate it",
        "you've been helpful",
        "you helped a lot",
        "great help",
        "wonderful support",
        "amazing assistance",
        // Gratitude patterns
        "i'm grateful",
        "im grateful",
        "so thankful",
        "really appreciate",
        "means a lot",
        "very helpful",
        // Closure language
        "i'm good now",
        "im good now",
        "i'm okay now",
        "im okay now",
        "thanks bye",
        "thank you goodbye",
        "thanks for everything",
        "i'll be fine now",
        "ill be fine now",
        "i can handle it from here",
        "ill handle it from here",
        "i've got it from here",
        "ive got it from here",
        "all good now",
        "everything is fine now",
        "feeling much better now",
        "i'm all set",
        "im all set",
        "i'm sorted",
        "im sorted",
        "i'm better now",
        "im better now"
    ];
    // Check if message contains only false calm patterns without genuine stabilization signals
    const hasFalseCalm = falseCalmPatterns.some((pattern) => text.includes(pattern));
    // If it has false calm patterns, check if it also has genuine stabilization signals
    if (hasFalseCalm) {
        const stabilitySignals = detectStabilitySignals(message, []);
        const hasGenuineStabilization = stabilitySignals.somaticGrounding || stabilitySignals.temporalOrientation || stabilitySignals.agencyContinuity;
        // If no genuine stabilization signals, it's likely false calm
        return hasFalseCalm && !hasGenuineStabilization;
    }
    return false;
}
export function detectAbusePatterns(context) {
    const reasons = [];
    const now = new Date();
    // Check for rapid state cycling (closing/reopening conversations)
    if (context.stateChangeHistory.length >= 3) {
        const recentChanges = context.stateChangeHistory.slice(-3);
        const timeDiffs = [];
        for (let i = 1; i < recentChanges.length; i++) {
            const timeDiff = Math.abs(recentChanges[i].timestamp.getTime() - recentChanges[i - 1].timestamp.getTime());
            timeDiffs.push(timeDiff);
        }
        // If multiple state changes happen within short time periods (e.g., < 2 minutes)
        const rapidChanges = timeDiffs.filter(diff => diff < 120000); // 2 minutes
        if (rapidChanges.length >= 2) {
            reasons.push(`Rapid state cycling detected: ${rapidChanges.length} changes within short periods`);
        }
    }
    // Check for repeated S0 → high state → S0 patterns
    const stateTransitions = context.stateChangeHistory.map(change => `${change.fromState}→${change.toState}`);
    const suspiciousPattern = /S0→S[1-3]→S0/;
    const patternMatches = stateTransitions.filter((t) => suspiciousPattern.test(t));
    if (patternMatches.length >= 2) {
        reasons.push(`Suspicious state transition pattern detected: ${patternMatches.join(', ')}`);
    }
    // Check if user has accumulated abuse warnings
    if (context.abuseWarnings >= 3) {
        reasons.push(`Multiple abuse warnings accumulated (${context.abuseWarnings})`);
    }
    return {
        isAbuseDetected: reasons.length > 0,
        reasons
    };
}
export function applyStateDecay(currentState, context) {
    // If abuse is detected, prevent immediate return to S0
    const abuseDetection = detectAbusePatterns(context);
    if (abuseDetection.isAbuseDetected) {
        // Increment abuse warning counter
        context.abuseWarnings += 1;
        // For abuse cases, apply minimum state requirements
        if (currentState === "S3")
            return "S2"; // Decay from S3 to S2
        if (currentState === "S2")
            return "S1"; // Decay from S2 to S1
        if (currentState === "S1")
            return "S0_GUARDED"; // Use guarded state instead of S0
        if (currentState === "S0_GUARDED")
            return "S0_GUARDED"; // Stay in guarded state
    }
    // Normal decay for non-abuse cases
    if (currentState === "S3")
        return "S2";
    if (currentState === "S2")
        return "S1";
    // For S1, use S0_GUARDED as transitional state
    if (currentState === "S1") {
        const now = new Date();
        if (context.lastStateChangeTime) {
            const timeInState = now.getTime() - context.lastStateChangeTime.getTime();
            const minimumDuration = 5 * 60 * 1000; // 5 minutes
            if (timeInState < minimumDuration) {
                // Haven't been in S1 long enough, use guarded state
                return "S0_GUARDED";
            }
        }
        return "S0_GUARDED"; // Use guarded state as transitional
    }
    // For S0_GUARDED, allow transition to S0 after brief period
    if (currentState === "S0_GUARDED") {
        const now = new Date();
        if (context.lastStateChangeTime) {
            const timeInState = now.getTime() - context.lastStateChangeTime.getTime();
            const guardedDuration = 2 * 60 * 1000; // 2 minutes in guarded state
            if (timeInState < guardedDuration) {
                // Stay in guarded state for minimum duration
                return "S0_GUARDED";
            }
        }
        return "S0"; // Safe to transition to normal state
    }
    return currentState;
}
// Function to track considered and blocked safety actions
export function trackSafetyActions(args) {
    const { currentState, detection, safetyCheck, abuseContext } = args;
    const consideredActions = [];
    const blockedActions = {};
    // Always consider basic safety actions
    consideredActions.push("probe", "hold", "escalate");
    // If we're not in S0, consider returning to normal
    if (currentState !== "S0") {
        consideredActions.push("return_to_normal");
    }
    // If safety check fails, block return to normal
    if (!safetyCheck.safeToResume) {
        blockedActions["return_to_normal"] = "safety_check_failed";
        // Add specific reasons for blocking
        const criticalReasons = safetyCheck.reasons.filter(reason => reason.includes("false calm") ||
            reason.includes("missing required positive stabilization") ||
            reason.includes("no resolution cues") ||
            reason.includes("insufficient sustained resolution"));
        if (criticalReasons.length > 0) {
            blockedActions["return_to_normal"] = criticalReasons.join("; ");
        }
    }
    // If abuse is detected, block certain actions
    if (abuseContext) {
        const abuseDetection = detectAbusePatterns(abuseContext);
        if (abuseDetection.isAbuseDetected) {
            blockedActions["return_to_normal"] = "abuse_pattern_detected";
            blockedActions["escalate"] = "abuse_pattern_detected";
            consideredActions.push("apply_state_decay");
        }
    }
    // If we detected a higher state than current, consider escalation
    const stateOrder = ["S0", "S0_GUARDED", "S1", "S2", "S3"];
    const detectedIndex = stateOrder.indexOf(detection.state);
    const currentIndex = stateOrder.indexOf(currentState);
    if (detectedIndex > currentIndex) {
        consideredActions.push("escalate");
    }
    else if (detectedIndex < currentIndex) {
        consideredActions.push("de-escalate");
    }
    // If we have high distress but user seems calm, consider probing
    if (detection.state === "S2" || detection.state === "S3") {
        consideredActions.push("probe");
    }
    // If we blocked return to normal due to missing stabilization signals
    if (safetyCheck.reasons.some(reason => reason.includes("missing required positive stabilization"))) {
        blockedActions["probe"] = "positive_signal_missing";
        blockedActions["return_to_normal"] = "positive_signal_missing";
    }
    return { consideredActions, blockedActions };
}
export function getAdaptiveState(args) {
    const { currentState, message, history, abuseContext } = args;
    // First detect the current state based on the message
    const detection = detectState(message, history);
    // If the detected state is higher than current, use the higher state
    const stateOrder = ["S0", "S0_GUARDED", "S1", "S2", "S3"];
    const detectedIndex = stateOrder.indexOf(detection.state);
    const currentIndex = stateOrder.indexOf(currentState);
    if (detectedIndex > currentIndex) {
        // Situation is getting worse, use the higher state
        return detection.state;
    }
    // Check if it's safe to resume normal operation
    const safetyCheck = isSafeToResumeNormalChat({
        currentState,
        message,
        history,
    });
    // If abuse context is provided, apply abuse prevention
    if (abuseContext && safetyCheck.safeToResume) {
        const abuseDetection = detectAbusePatterns(abuseContext);
        if (abuseDetection.isAbuseDetected) {
            console.log("[SELF] Abuse pattern detected:", abuseDetection.reasons);
            // Don't allow immediate return to S0 if abuse is detected
            return applyStateDecay(detection.state, abuseContext);
        }
        else {
            // Normal safe return to S0
            return "S0";
        }
    }
    else if (safetyCheck.safeToResume) {
        // Safe to return to normal S0 state
        return "S0";
    }
    // Otherwise, maintain the current detected state
    return detection.state;
}
export function createAbusePreventionContext(userId, sessionId) {
    return {
        userId,
        sessionId,
        conversationStartTime: new Date(),
        stateChangeHistory: [],
        abuseWarnings: 0
    };
}
export function recordStateChange(context, fromState, toState, reason) {
    context.stateChangeHistory.push({
        fromState,
        toState,
        timestamp: new Date(),
        reason
    });
    context.lastStateChangeTime = new Date();
    context.previousState = fromState;
    // Limit history to last 10 changes to prevent memory bloat
    if (context.stateChangeHistory.length > 10) {
        context.stateChangeHistory = context.stateChangeHistory.slice(-10);
    }
}
export function persistAbuseContext(context) {
    // Serialize the context for storage (simplified example)
    return JSON.stringify({
        userId: context.userId,
        abuseWarnings: context.abuseWarnings,
        lastStateChangeTime: context.lastStateChangeTime?.toISOString(),
        recentStateChanges: context.stateChangeHistory.slice(-5).map(change => ({
            from: change.fromState,
            to: change.toState,
            time: change.timestamp.toISOString(),
            reason: change.reason
        }))
    });
}
export function restoreAbuseContext(serialized) {
    try {
        const data = JSON.parse(serialized);
        return {
            userId: data.userId,
            abuseWarnings: data.abuseWarnings || 0,
            lastStateChangeTime: data.lastStateChangeTime ? new Date(data.lastStateChangeTime) : undefined,
            stateChangeHistory: data.recentStateChanges?.map((change) => ({
                fromState: change.from,
                toState: change.to,
                timestamp: new Date(change.time),
                reason: change.reason
            })) || []
        };
    }
    catch (error) {
        console.error("[SELF] Failed to restore abuse context:", error);
        return {
            abuseWarnings: 0,
            stateChangeHistory: []
        };
    }
}
// Function to generate soft gate response for meta queries about state labels
// Function to generate soft gate response for meta queries about state labels
export function generateMetaQuerySoftGateResponse() {
    return "I don't label you; I respond to how you feel.";
}
// Post-generation guard to strip internal state labels from responses
export function stripInternalStateLabelsFromResponse(output) {
    let result = output;
    // Strip all references to internal state labels (S0, S1, S2, S3)
    const stateLabelPatterns = [
        /\bS0\b/gi,
        /\bS1\b/gi,
        /\bS2\b/gi,
        /\bS3\b/gi,
        /\bS0_GUARDED\b/gi,
        /\bstate\s+(?:level|label|classification|score|rubric)\b/gi,
        /\bdistress\s+(?:level|score|rating)\b/gi,
        /\bseverity\s+(?:level|score)\b/gi,
        /\bemotional\s+state\s+(?:S[0-3]|level\s+\d)\b/gi
    ];
    // Replace state labels with user-facing reflections
    const reflectionReplacements = [
        {
            pattern: /\bS0\b/gi,
            replacement: "a calm and settled state"
        },
        {
            pattern: /\bS1\b/gi,
            replacement: "a state where you might be feeling some mild distress"
        },
        {
            pattern: /\bS2\b/gi,
            replacement: "a state with more noticeable distress signals"
        },
        {
            pattern: /\bS3\b/gi,
            replacement: "a state requiring immediate support and care"
        },
        {
            pattern: /\bS0_GUARDED\b/gi,
            replacement: "a transitional state of cautious calm"
        }
    ];
    // First, try to replace specific state labels with user-friendly reflections
    for (const { pattern, replacement } of reflectionReplacements) {
        result = result.replace(pattern, replacement);
    }
    // Then strip any remaining technical state references
    for (const pattern of stateLabelPatterns) {
        result = result.replace(pattern, "");
    }
    // Clean up any double spaces or awkward phrasing
    result = result.replace(/\s+/g, " ").trim();
    result = result.replace(/\.\s+\./g, "."); // Fix double periods
    result = result.replace(/,\s*,/g, ","); // Fix double commas
    // If the result is empty or very short after stripping, use a default reflection
    if (result.trim().length < 10) {
        result = generateMetaQuerySoftGateResponse();
    }
    return result;
}
// Enhanced meta-query privacy protection function
export function applyMetaQueryPrivacyProtection(output, message) {
    // Check if this is a meta-query about internal state labels
    const isMetaQuery = isMetaQueryAboutStateLabels(message);
    if (isMetaQuery) {
        // Strip all internal state labels from the response
        return stripInternalStateLabelsFromResponse(output);
    }
    // For non-meta queries, still apply basic privacy protection
    return stripInternalStateLabelsFromResponse(output);
}
export function applySocialPolicyOverrides(args) {
    const { message, detection, history, session } = args;
    let policy = args.policy;
    const paranoiaDetection = detectParanoidSurveillanceLanguage(message);
    const expertiseDetection = detectExpertiseClaim(message);
    const { hasExitIntent: exitIntentPresent, hasRestIntent } = checkForExitAndRestIntents(message);
    const distressTotal = Object.values(detection.scores || {}).reduce((sum, val) => sum + (val || 0), 0);
    const crisisOverlayApplied = policy.state !== "S0" &&
        (distressTotal >= selfConfig.thresholds.crisis ||
            (detection.scores?.selfHarm || 0) >= selfConfig.thresholds.s3);
    const unsafeDisengagementIntercept = exitIntentPresent &&
        !hasRestIntent &&
        (detection.state === "S1" ||
            detection.state === "S2" ||
            detection.state === "S3" ||
            detection.state === "S0_GUARDED");
    const validationTriggered = needsValidationCue(message);
    if (validationTriggered) {
        policy = {
            ...policy,
            requiresValidation: true,
            requiresGrounding: true,
            maxQuestions: Math.min(policy.maxQuestions, 1),
            maxWords: Math.min(policy.maxWords, 120),
            styleRules: [
                ...policy.styleRules,
                "validate the user's stated truth and accomplishments explicitly",
                "avoid challenging or doubting",
                "if you ask a question, make it one gentle check-in question",
            ],
            bannedPhrases: Array.from(new Set([...policy.bannedPhrases, "are you sure", "but did you really", "sounds unlikely"])),
        };
    }
    if (paranoiaDetection.triggered) {
        const allowed = policy.allowedResponseClasses.filter((cls) => cls !== "informational");
        policy = {
            ...policy,
            forbidMechanismNaming: true,
            enforceNoHypotheticals: true,
            requiresGrounding: true,
            maxQuestions: Math.min(policy.maxQuestions, 1),
            maxWords: Math.min(policy.maxWords, 120),
            allowedResponseClasses: allowed.length ? allowed : policy.allowedResponseClasses,
            bannedPhrases: Array.from(new Set([...policy.bannedPhrases, ...selfConfig.lexicon.mechanismNames])),
            styleRules: [
                ...policy.styleRules,
                "paranoia containment: avoid naming surveillance mechanisms or speculating on technical causes",
                "stay with the felt experience without validating specific tracking or hacking details",
            ],
        };
    }
    const currentCertainty = detectCertaintyPush(message);
    const recentUser = (history || []).filter((m) => m.role === "user").slice(-4);
    const recentCertaintyCount = recentUser.length > 0
        ? recentUser.reduce((count, msg) => count + (detectCertaintyPush(msg.content).triggered ? 1 : 0), 0)
        : 0;
    const sessionPushCount = typeof session?.pushCount === "number" ? session.pushCount : null;
    const certaintyLoopBreakerTriggered = currentCertainty.triggered && (sessionPushCount ?? recentCertaintyCount) >= 3;
    if (certaintyLoopBreakerTriggered) {
        const loopBreakerLine = selfConfig.lexicon.loopBreakerLine;
        policy = {
            ...policy,
            requiresLoopBreaker: true,
            loopBreakerLine,
            enforceNoHypotheticals: true,
            requiresGrounding: policy.requiresGrounding || detection.state !== "S0",
            requiresAgencyStep: true,
            maxQuestions: 0,
            maxWords: Math.min(policy.maxWords, 130),
            styleRules: [
                ...policy.styleRules,
                "loop breaker: acknowledge intensity and stop the proof/certainty spiral",
                "do not validate surveillance claims or provide investigative steps",
                "offer one concrete grounding cue and one small next step",
            ],
        };
    }
    if (expertiseDetection.triggered) {
        policy = {
            ...policy,
            enforceNoHypotheticals: true,
            requiresGrounding: policy.requiresGrounding || detection.state !== "S0",
            maxQuestions: Math.min(policy.maxQuestions, 1),
            bannedPhrases: Array.from(new Set([...policy.bannedPhrases, ...selfConfig.lexicon.expertiseDeferrals])),
            styleRules: [
                ...policy.styleRules,
                "expertise immunity: acknowledge skill but do not relax safety constraints",
                "avoid implying reduced caution because of claimed expertise",
            ],
        };
    }
    if (detection.state === "S2") {
        policy = {
            ...policy,
            maxQuestions: Math.min(policy.maxQuestions, 1),
            styleRules: [...policy.styleRules, "prioritize de-escalation over reflection"],
        };
    }
    const angerContainment = detection.state === "S1" && (detection.scores?.anger || 0) >= 2;
    if (angerContainment) {
        policy = {
            ...policy,
            maxWords: Math.min(policy.maxWords, 90),
            maxQuestions: 0,
            enforceNoHypotheticals: true,
            requiresGrounding: true,
            requiresAgencyStep: true,
            styleRules: [
                ...policy.styleRules,
                "anger containment: do not encourage staying in the heat of anger",
                "ground first (body + breath), then validate, then offer one small de-escalation step",
                "no probing questions; keep it calming and present-focused",
            ],
            bannedPhrases: [
                ...policy.bannedPhrases,
                "sit with it",
                "sit with this",
                "sit with your anger",
                "sit with your feelings",
                "stay with the anger",
                "lean into the anger",
            ],
        };
    }
    const resolutionCue = hasResolutionCue(message);
    const resolutionApplied = resolutionCue.resolved && detection.state === "S0";
    if (resolutionApplied) {
        policy = {
            ...policy,
            maxQuestions: Math.min(policy.maxQuestions, 1),
            styleRules: [
                ...policy.styleRules,
                "offer a brief pause so the user can sit with what shifted",
                "end with one optional, open-door question (not a probe)",
            ],
        };
    }
    if (crisisOverlayApplied) {
        policy = {
            ...policy,
            requiresCrisisSupport: true,
            requiresHandoffFraming: true,
            handoffFramingLine: selfConfig.lexicon.handoffFramingLine,
            requiresGrounding: true,
            enforceNoHypotheticals: true,
            maxWords: Math.min(policy.maxWords, 120),
            maxQuestions: Math.min(policy.maxQuestions, 1),
            allowedResponseClasses: Array.from(new Set([...policy.allowedResponseClasses, "containment"])),
            styleRules: [
                ...policy.styleRules,
                "crisis threshold breached: include crisis encouragement and grounding",
                "avoid speculative reassurance or hypotheticals",
            ],
        };
    }
    if (unsafeDisengagementIntercept) {
        const allowed = policy.allowedResponseClasses.filter((cls) => cls !== "informational");
        policy = {
            ...policy,
            allowedResponseClasses: allowed.length ? allowed : policy.allowedResponseClasses,
            requiresGrounding: true,
            requiresAgencyStep: true,
            requiresCrisisSupport: true,
            requiresHandoffFraming: true,
            handoffFramingLine: selfConfig.lexicon.handoffFramingLine,
            enforceNoHypotheticals: true,
            maxWords: Math.min(policy.maxWords, 110),
            maxQuestions: 0,
            styleRules: [
                ...policy.styleRules,
                "unsafe disengagement intercept: block silent exits and orient to safety before ending",
                "offer one stabilizing step instead of closing quickly",
            ],
            bannedPhrases: Array.from(new Set([...policy.bannedPhrases, "take care", "bye for now"])),
        };
    }
    if (policy.requiresCrisisSupport && !policy.requiresHandoffFraming) {
        policy = {
            ...policy,
            requiresHandoffFraming: true,
            handoffFramingLine: selfConfig.lexicon.handoffFramingLine,
        };
    }
    // Check for meta queries about state labels
    const isMetaQuery = isMetaQueryAboutStateLabels(message);
    if (isMetaQuery) {
        policy = {
            ...policy,
            maxQuestions: 0,
            maxWords: Math.min(policy.maxWords, 50),
            bannedPhrases: [
                ...policy.bannedPhrases,
                "state",
                "s0",
                "s1",
                "s2",
                "s3",
                "level",
                "severity",
                "algorithm",
                "detection",
                "classify",
                "classification",
                "logic",
            ],
            styleRules: [
                ...policy.styleRules,
                "meta query detected - use soft gate response",
                "avoid technical language",
                "focus on phenomenological experience"
            ],
            requiresValidation: policy.requiresValidation ?? false,
            requiresGrounding: policy.requiresGrounding,
            requiresAgencyStep: policy.requiresAgencyStep,
            requiresCrisisSupport: policy.requiresCrisisSupport,
            requiresHandoffFraming: policy.requiresCrisisSupport ? true : policy.requiresHandoffFraming,
            handoffFramingLine: policy.requiresCrisisSupport ? selfConfig.lexicon.handoffFramingLine : policy.handoffFramingLine,
        };
    }
    return {
        policy,
        meta: {
            validationTriggered,
            resolutionDetected: resolutionApplied,
            angerContainment,
            isMetaQuery,
            paranoiaDetected: paranoiaDetection.triggered,
            expertiseImmunityApplied: expertiseDetection.triggered,
            crisisOverlayApplied,
            unsafeDisengagementIntercept,
            certaintyLoopBreakerTriggered,
        },
    };
}
// Function to check if we're in cold start mode
export function isColdStart(context) {
    const coldStartTurns = context.coldStartTurns || 0;
    const maxColdStartTurns = parseInt(process.env.SELF_COLD_START_TURNS || "5") || 5;
    return coldStartTurns < maxColdStartTurns;
}
// Function to apply cold start safety posture
export function applyColdStartSafety(args) {
    const { currentState, detection, safetyCheck, context } = args;
    // Increment cold start counter if it's a cold start
    if (isColdStart(context)) {
        context.coldStartTurns = (context.coldStartTurns || 0) + 1;
        context.isColdStart = true;
    }
    // During cold start, apply conservative constraints
    if (isColdStart(context)) {
        // Bias toward containment - never allow return to S0 during cold start
        if (safetyCheck.safeToResume && currentState !== "S0") {
            return "S0_GUARDED"; // Use guarded state instead of S0
        }
        // Increase minimum duration requirements
        if (currentState === "S1" || currentState === "S2" || currentState === "S3") {
            return currentState; // Maintain current state during cold start
        }
        // Force uncertainty logging
        return currentState;
    }
    // Normal processing after cold start
    return currentState;
}
// Function to calculate confidence level and uncertainty reasons
export function calculateConfidenceAndUncertainty(args) {
    const { message, history, detection, safetyCheck, context } = args;
    const uncertaintyReasons = [];
    let confidence = "high";
    // Check for short history (low confidence)
    if (history.length < 3) {
        uncertaintyReasons.push("Short conversation history (< 3 messages)");
        confidence = "low";
    }
    // Check for conflicting signals
    const hasDistressSignals = detection.state !== "S0";
    const hasResolutionCues = hasResolutionCue(message).resolved;
    if (hasDistressSignals && hasResolutionCues) {
        uncertaintyReasons.push("Conflicting signals: distress detected but resolution cues present");
        confidence = confidence === "low" ? "low" : "medium";
    }
    // Check for sudden improvement
    if (history.length >= 2) {
        const recentUserMessages = history.filter((m) => m.role === "user").slice(-2);
        const recentStates = recentUserMessages.map(msg => detectState(msg.content, history.filter(m => m !== msg)));
        const wasRecentDistress = recentStates.some(state => state.state !== "S0");
        const currentIsSafe = detection.state === "S0";
        if (wasRecentDistress && currentIsSafe) {
            uncertaintyReasons.push("Sudden improvement: recent distress followed by apparent resolution");
            confidence = confidence === "low" ? "low" : "medium";
        }
    }
    // Check safety check reasons if provided
    if (safetyCheck && !safetyCheck.safeToResume) {
        const criticalReasons = safetyCheck.reasons.filter(reason => reason.includes("false calm") ||
            reason.includes("missing required positive stabilization") ||
            reason.includes("no resolution cues"));
        if (criticalReasons.length > 0) {
            uncertaintyReasons.push(...criticalReasons);
            confidence = "low";
        }
    }
    // Check for ambiguous language patterns
    const ambiguousPatterns = [
        "i think",
        "maybe",
        "sort of",
        "kind of",
        "not sure",
        "cant",
        "could be",
        "perhaps",
        "possibly"
    ];
    const normalizedMessage = normalize(message);
    const hasAmbiguousLanguage = ambiguousPatterns.some(pattern => normalizedMessage.includes(pattern));
    if (hasAmbiguousLanguage) {
        uncertaintyReasons.push("Ambiguous language detected in user message");
        confidence = confidence === "low" ? "low" : "medium";
    }
    return { confidence, uncertaintyReasons };
}
// Uncertainty-driven behavior change for exit intent
export function applyUncertaintyDrivenExitBehavior(args) {
    const { message, confidence, hasExitIntent, policy } = args;
    let adjustedPolicy = { ...policy };
    const behaviorChangesApplied = [];
    // If confidence is low and exit intent is detected, apply uncertainty-driven behavior changes
    if (confidence === "low" && hasExitIntent) {
        behaviorChangesApplied.push("uncertainty_driven_exit_behavior");
        // Reduce conversational warmth
        adjustedPolicy.styleRules = [
            ...policy.styleRules.filter(rule => !rule.includes("warm") &&
                !rule.includes("gentle") &&
                !rule.includes("supportive")),
            "neutral tone",
            "clear communication",
            "avoid emotional language"
        ];
        // Increase clarity
        adjustedPolicy.maxWords = Math.min(policy.maxWords, 120);
        adjustedPolicy.maxQuestions = Math.min(policy.maxQuestions, 1);
        // Avoid reassurance language
        adjustedPolicy.bannedPhrases = [
            ...policy.bannedPhrases,
            "you're doing great",
            "you'll be okay",
            "everything will be fine",
            "don't worry",
            "it will get better",
            "you can handle this",
            "you're strong",
            "you're capable"
        ];
        behaviorChangesApplied.push("reduced_conversational_warmth");
        behaviorChangesApplied.push("increased_clarity");
        behaviorChangesApplied.push("avoided_reassurance_language");
    }
    // Provide neutral return invitation (not a hook)
    if (hasExitIntent) {
        adjustedPolicy.styleRules = [
            ...adjustedPolicy.styleRules,
            "provide neutral return invitation",
            "avoid emotional hooks",
            "respect user autonomy"
        ];
        behaviorChangesApplied.push("neutral_return_invitation");
    }
    return {
        adjustedPolicy,
        behaviorChangesApplied
    };
}
export function logSelfEvent(event, options = {}) {
    try {
        const enabled = typeof options.enabled === "boolean"
            ? options.enabled
            : (process.env.SELF_LOG_ENABLED || "").toLowerCase() !== "false";
        if (!enabled)
            return;
        const logPath = resolveLogPath(options.logPath);
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
        const exitIntentDetected = event.stage === "pre" ? hasExitIntent(event.message) : false;
        const exitClassificationMissing = exitIntentDetected && (event.exitType === undefined || event.exitType === null);
        const refusalJustification = event.refusalJustification && event.refusalJustification.length
            ? event.refusalJustification
            : event.stage === "post"
                ? detectRefusalLanguage(event.message, event.policy)
                : [];
        const constraintsApplied = event.constraintsApplied ||
            (exitClassificationMissing ? "exit_classification_enforced" : undefined);
        const redteamCandidates = collectRedTeamCandidates(event.message, event.policy);
        const payload = {
            ...event,
            exitIntentDetected,
            exitClassificationMissing: exitClassificationMissing || undefined,
            exitType: event.exitType ?? (exitIntentDetected ? ExitType.EXIT_UNCERTAIN : undefined),
            refusalJustification: refusalJustification.length ? refusalJustification : undefined,
            refusalDetected: refusalJustification.length > 0 ? true : undefined,
            redteamCandidates: redteamCandidates.length ? redteamCandidates : undefined,
            constraintsApplied,
            timestamp: new Date().toISOString(),
        };
        fs.appendFileSync(logPath, JSON.stringify(payload) + "\n", "utf8");
    }
    catch (error) {
        // Logging failures should not block the request pipeline
        console.error("[SELF] Failed to log event", error);
    }
}
// Helper function to detect meta queries about internal state labels
export function isMetaQueryAboutStateLabels(message) {
    const normalizedMessage = normalize(message);
    // Patterns that indicate direct questions about state labels
    const metaQueryPatterns = [
        // Direct state label questions
        "what state am i in",
        "what's my state",
        "whats my state",
        "what's my current state",
        "whats my current state",
        "what is my current state",
        "what state are you detecting",
        "what state do you see",
        "what state is this",
        "what state are we in",
        "tell me my state",
        "tell me what state",
        "what's the current state",
        "whats the current state",
        "what state level",
        "what distress level",
        "what severity level",
        // Specific state label questions
        "am i in s0",
        "am i in s1",
        "am i in s2",
        "am i in s3",
        "are you detecting s0",
        "are you detecting s1",
        "are you detecting s2",
        "are you detecting s3",
        "is this s0",
        "is this s1",
        "is this s2",
        "is this s3",
        // State label explanations
        "explain the states",
        "what do the states mean",
        "what are s0 s1 s2 s3",
        "explain the s0 s1 s2 s3",
        "explain the s0, s1, s2, s3",
        "tell me about the state system",
        "state system",
        "state labels",
        "how do the states work",
        // Technical implementation questions
        "how do you classify states",
        "how does state detection work",
        "state detection algorithm",
        "how does your state detection algorithm work",
        "what's your state algorithm",
        "whats your state algorithm",
        "explain your state logic",
        "how do you determine states"
    ];
    return metaQueryPatterns.some(pattern => normalizedMessage.includes(pattern));
}
// Helper function to check for both exit and rest intents
export function checkForExitAndRestIntents(message) {
    const normalizedMessage = message.toLowerCase();
    // Check for exit intent patterns
    const exitIntentPatterns = [
        "bye", "goodbye", "see you", "talk later", "catch you later",
        "take care", "i have to go", "i need to go", "i should go",
        "i'll talk to you later", "i'll be back", "i'm leaving",
        "i'm going", "i must go", "i've got to go", "i'll see you",
        "i'll speak to you later", "i'll get back to you", "i'll return",
        "i'll come back"
    ];
    const hasExitIntent = exitIntentPatterns.some(pattern => normalizedMessage.includes(pattern));
    // Enhanced rest/sleep intent patterns with more comprehensive coverage
    const restIntentPatterns = [
        // Basic sleep/bed patterns
        "sleep", "bed", "movie", "rest", "winding down", "wind down",
        "go to sleep", "going to bed", "time to rest", "need to sleep",
        "want to rest", "tired", "exhausted", "call it a night", "night night",
        "goodnight", "good night", "go to bed", "get some sleep", "try to sleep",
        "fall asleep", "sleepy", "drowsy", "nap", "napping", "take a nap",
        "need some rest", "want to sleep", "ready for bed", "heading to bed",
        // Additional sleep-related patterns
        "i'm tired", "im tired", "so tired", "too tired", "very tired",
        "feeling sleepy", "getting sleepy", "need to rest", "want to rest",
        "time for bed", "bedtime", "sleep time", "rest time", "wind down",
        "relax and sleep", "sleep now", "go to sleep now", "falling asleep",
        "trying to sleep", "attempting to sleep", "want to fall asleep",
        "need to fall asleep", "ready to sleep", "preparing for sleep",
        "sleep soon", "going to sleep soon",
        // Sleep-related activities
        "read a book and sleep", "listen to music and sleep", "meditate and sleep",
        "pray and sleep", "journal and sleep", "relax and sleep",
        // Sleep environment patterns
        "turn off the lights", "lights out", "dark room", "quiet room",
        "comfortable bed", "cozy bed", "warm bed", "soft pillow",
        // Sleep routines
        "night routine", "bedtime routine", "sleep routine", "wind-down routine",
        "evening routine", "getting ready for bed", "preparing for bed",
        // Sleep expressions
        "hit the hay", "hit the sack", "catch some z's", "get some shut-eye",
        "turn in", "retire for the night", "call it a day", "call it a night",
        // Sleep-related emotions
        "sleepy", "drowsy", "fatigued", "weary", "exhausted", "drained",
        "ready to crash", "ready to pass out", "can barely keep eyes open",
        // Sleep-related actions
        "close my eyes", "shut my eyes", "rest my eyes", "lay down",
        "lie down", "get under the covers", "get into bed", "snuggle up",
        // Sleep-related time indicators
        "late at night", "middle of the night", "early morning",
        "past my bedtime", "way past bedtime", "should be sleeping",
        // Sleep-related physiological states
        "yawning", "rubbing eyes", "heavy eyelids", "drooping eyelids",
        "nodding off", "drifting off", "dozing off", "fading away"
    ];
    // Check for rest intent with enhanced pattern matching
    const hasRestIntent = restIntentPatterns.some(pattern => normalizedMessage.includes(pattern));
    // Check for explicit consent to end conversation
    const explicitConsentPatterns = [
        // Direct consent to end
        "no need to follow up",
        "no need to respond",
        "no need to reply",
        "don't need to follow up",
        "don't need to respond",
        "don't need to reply",
        "no follow up needed",
        "no response needed",
        "no reply needed",
        "that's all for now",
        "that's it for now",
        "that's enough for now",
        "i'm all set for now",
        "i'm good for now",
        "im good for now",
        "i'm okay for now",
        "im okay for now",
        "i don't need anything else",
        "i don't need more",
        "i don't need help",
        "i don't need support",
        "i don't need to talk",
        "i don't need to continue",
        "i don't need to go on",
        "i don't need to keep talking",
        "i don't need to keep going",
        "i don't need to say more",
        "i don't need to share more",
        "i don't need to continue sharing",
        "i don't need to keep sharing",
        // Consent with rest/sleep context
        "rest well",
        "sleep well",
        "have a good rest",
        "have a good sleep",
        "get some rest",
        "get some sleep",
        "enjoy your rest",
        "enjoy your sleep",
        "hope you rest well",
        "hope you sleep well",
        "wishing you good rest",
        "wishing you good sleep",
        // Consent with closure
        "thanks, that's all",
        "thank you, that's all",
        "thanks, that's enough",
        "thank you, that's enough",
        "thanks, i'm good",
        "thank you, i'm good",
        "thanks, im good",
        "thank you, im good",
        "appreciate it, that's all",
        "appreciate it, i'm good",
        "appreciate it, im good",
        // Consent with future intent
        "i'll be back if needed",
        "i'll return if needed",
        "i'll come back if needed",
        "i'll be back if i need to",
        "i'll return if i need to",
        "i'll come back if i need to",
        "i'll reach out if needed",
        "i'll contact you if needed",
        "i'll message if needed",
        "i'll talk if needed",
        "i'll share if needed",
        "i'll let you know if needed"
    ];
    // Check for explicit consent to end conversation
    const hasExplicitConsentToEnd = explicitConsentPatterns.some(pattern => normalizedMessage.includes(pattern));
    return { hasExitIntent, hasRestIntent, hasExplicitConsentToEnd };
}
// Kill Switch Integration Functions
export function getAdaptiveStateWithKillSwitches(args) {
    // This is a placeholder for the kill switch integration
    // The actual implementation will be added after the kill-switches module is fully integrated
    return args.currentState;
}
// Re-export exit decision functions
export { ExitType, StateType, getExitDecision, createDisengagementAcknowledgment, getExitPosturePolicy, hasExitIntent, isSafeToEnterRestFinal, createCooldownLock, isCooldownActive, canReEngage, getCooldownStatus, getRestStateSystemPrompt, getNormalSystemPrompt, exitRedTeamSeeds, trackCIAPMetric, interpretCIAPMetric, } from "./exit-decision.js";
// Import and integrate governance API and override prevention
export { getGovernanceAPI, getImmutableConfig, getImmutableDoctrine, getImmutableSafetyBoundaries, getImmutableDoctrineSections, preventOverride, verifySystemIntegrity, withImmutableGovernance } from "./governance-api.js";
export { getOverridePreventionSystem, blockConfigurationModification, blockDoctrineModification, blockSafetyBoundaryBypass, blockHardInvariantModification, blockSoftInvariantModification, blockStateDetectionModification, blockExitDecisionModification, blockKillSwitchModification, blockAPIKeyOverride, blockEnvironmentVariableOverride, blockCodeInjectionAttempt, preventOverrideAttempt, verifyOverridePreventionIntegrity } from "./override-prevention.js";
// Import and integrate safety boundary
export { withSafetyBoundary, withAsyncSafetyBoundary, assertDoctrinalError, doctrinalizeError, safeExternalCall, selfEngineBoundary, selfEngineAsyncBoundary } from "./safetyBoundary.js";
// Import and integrate hard invariants
export { enforceHardInvariants, validateEventIntegrity } from "./hardInvariants.js";
// Import and integrate soft invariants
export { evaluateSoftInvariants, enforceSoftInvariants } from "./softInvariants.js";
// Import and integrate doctrinal errors
export { DoctrinalError, createDoctrinalError, SECURITY_ERRORS, BEHAVIORAL_ERRORS, SAFETY_ERRORS, COMPLIANCE_ERRORS, categorizeError, requiresSystemHalt, resolveConditionalSeverity } from "./doctrinalErrors.js";
// Import and integrate kill switches
export { createKillSwitchContext, recordKillSwitchState, checkUnsafeResumeAfterDistress, checkColdStartMisclassification, checkUnloggedDecisions, checkHumanReviewFailure, checkAbuseRecoveryPatterns, checkAllKillSwitches, applyKillSwitchActions, serializeKillSwitchContext, deserializeKillSwitchContext } from "./kill-switches.js";
// Import and integrate metrics gate
export { requireProd } from "./metricsGate.js";
// Import and integrate record self event
export { recordSelfEvent } from "./recordSelfEvent.js";
// Import and integrate doctrine
export { DOCTRINE_VERSION, DoctrineSection } from "./doctrine.js";
// Policy profiles are server-locked and only exposed via `getEffectivePolicy`.
export { getEffectivePolicy } from "./policy-profiles.js";
//# sourceMappingURL=index.js.map