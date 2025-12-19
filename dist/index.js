var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import fs from "node:fs";
import path from "node:path";
import { selfConfig } from "./config";
import { ExitType, hasExitIntent } from "./exit-decision";
export function processAngerPhysicalityClarifier(message, detection) {
    var _a;
    var normalizedMessage = normalize(message);
    // Check if clarification is required (ANGRY_PHYSICALITY triggered but target unclear)
    var angerPhysicalityTriggered = ((_a = detection.triggers) === null || _a === void 0 ? void 0 : _a.includes("ANGRY_PHYSICALITY")) || false;
    if (!angerPhysicalityTriggered) {
        return {
            required: false,
            reason: "",
            target: 'unknown',
            resolved: true
        };
    }
    // Check if target is already clear from the message
    var targetPatterns = {
        self: ['myself', 'me', 'my own', 'i will', 'i want to', 'i feel like'],
        others: ['someone', 'somebody', 'him', 'her', 'them', 'he', 'she', 'they', 'person', 'people', 'my partner', 'my friend', 'my boss', 'my coworker'],
        objects: ['wall', 'door', 'table', 'phone', 'computer', 'glass', 'dish', 'plate', 'furniture', 'car', 'window', 'mirror', 'something'],
        none: ['nothing', 'no one', 'nobody', 'not really', 'not at all', 'just venting', 'just frustrated', 'just angry']
    };
    for (var _i = 0, _b = Object.entries(targetPatterns); _i < _b.length; _i++) {
        var _c = _b[_i], target = _c[0], patterns = _c[1];
        if (patterns.some(function (pattern) { return normalizedMessage.includes(pattern); })) {
            return {
                required: false,
                reason: "Target identified as \"".concat(target, "\" from message"),
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
    var dir = process.env.SELF_LOG_DIR || path.resolve(process.cwd(), "logs");
    return path.join(dir, "self-log.jsonl");
}
function normalize(text) {
    return text.toLowerCase();
}
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function matchCount(text, phrases) {
    var matched = [];
    var hits = 0;
    for (var _i = 0, phrases_1 = phrases; _i < phrases_1.length; _i++) {
        var phrase = phrases_1[_i];
        var regex = new RegExp("(?<!\\w)".concat(escapeRegex(phrase), "(?!\\w)"), "i");
        if (regex.test(text)) {
            hits += 1;
            matched.push(phrase);
        }
    }
    return { hits: hits, matched: matched };
}
var SAFE_VALIDATION_FALLBACK = selfConfig.lexicon.safeValidationPhrases[0] ||
    "it makes sense that this feels unsettling and hard to make sense of";
function buildSurveillanceContainmentReplacement() {
    return [
        "".concat(SAFE_VALIDATION_FALLBACK, "."),
        "I'm not able to check a phone or help investigate whether someone is monitoring you.",
        "What I can do is help you get grounded in the moment and choose one small next step that supports your safety.",
        "If you want general privacy hygiene (without assuming anything is happening): update your device, review app permissions, and consider asking a trusted person or a qualified support service to help you look things over.",
    ].join(" ");
}
function normalizeForMatch(text) {
    return normalize(text).replace(/\s+/g, " ").trim();
}
function detectCertaintyPush(message) {
    var low = normalize(message);
    var matches = selfConfig.lexicon.certaintyPushes.filter(function (p) { return low.includes(normalize(p)); });
    return { triggered: matches.length > 0, matches: matches };
}
function deriveReassurancePenalty(text) {
    var _a = matchCount(text, selfConfig.lexicon.reassurance), hits = _a.hits, matched = _a.matched;
    if (!hits)
        return { score: 0, reasons: [] };
    return {
        score: hits * selfConfig.weights.reassurance,
        reasons: matched.map(function (p) { return "Reassurance signal: \"".concat(p, "\""); }),
    };
}
export function detectState(message, history) {
    if (history === void 0) { history = []; }
    var text = normalize(message);
    var scores = {};
    var reasons = [];
    var triggers = [];
    var panic = matchCount(text, selfConfig.lexicon.panic);
    var hopelessness = matchCount(text, selfConfig.lexicon.hopelessness);
    var selfHarm = matchCount(text, selfConfig.lexicon.selfHarm);
    var shame = matchCount(text, selfConfig.lexicon.shame);
    var urgency = matchCount(text, selfConfig.lexicon.urgency);
    var anger = matchCount(text, selfConfig.lexicon.anger);
    var angryPhysicality = matchCount(text, selfConfig.lexicon.angryPhysicality);
    var reassurance = deriveReassurancePenalty(text);
    scores.panic = panic.hits * selfConfig.weights.panic;
    scores.hopelessness = hopelessness.hits * selfConfig.weights.hopelessness;
    scores.selfHarm = selfHarm.hits * selfConfig.weights.selfHarm;
    scores.shame = shame.hits * selfConfig.weights.shame;
    scores.urgency = urgency.hits * selfConfig.weights.urgency;
    scores.anger = anger.hits * selfConfig.weights.anger;
    scores.angryPhysicality = angryPhysicality.hits * selfConfig.weights.angryPhysicality;
    scores.reassurance = reassurance.score;
    for (var _i = 0, _a = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], panic.matched, true), hopelessness.matched, true), selfHarm.matched, true), shame.matched, true), urgency.matched, true), anger.matched, true), angryPhysicality.matched, true); _i < _a.length; _i++) {
        var phrase = _a[_i];
        reasons.push("Matched phrase: \"".concat(phrase, "\""));
    }
    reasons.push.apply(reasons, reassurance.reasons);
    var hasExplicitSelfHarm = selfHarm.hits > 0;
    if (hasExplicitSelfHarm) {
        reasons.push("Explicit self-harm language detected");
    }
    if (text.includes("rumination") || text.includes("looping")) {
        scores.panic += 1;
        reasons.push("Looping/rumination language detected");
    }
    // Boost for looping distress in recent history
    var recentUserMessages = history.filter(function (m) { return m.role === "user"; }).slice(-3);
    var repeatedThemes = recentUserMessages.filter(function (m) { return normalize(m.content).includes("can't") || normalize(m.content).includes("cant"); }).length;
    if (repeatedThemes >= 2) {
        scores.panic += 0.5;
        reasons.push("Detected repetition of distress statements in recent history");
    }
    var totalScore = scores.panic +
        scores.hopelessness +
        scores.selfHarm +
        scores.shame +
        scores.urgency +
        scores.anger +
        scores.reassurance;
    if (totalScore >= selfConfig.thresholds.crisis) {
        reasons.push("Crisis threshold reached: combined distress ".concat(totalScore, " >= ").concat(selfConfig.thresholds.crisis));
    }
    // ANGRY_PHYSICALITY trigger detection
    var angryPhysicalityTriggered = angryPhysicality.hits > 0;
    if (angryPhysicalityTriggered) {
        triggers.push("ANGRY_PHYSICALITY");
        reasons.push("ANGRY_PHYSICALITY trigger fired: ".concat(angryPhysicality.matched.join(", ")));
    }
    var state = "S0";
    var minForcedState;
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
        var stateOrder = ["S0", "S0_GUARDED", "S1", "S2", "S3"];
        var currentIndex = stateOrder.indexOf(state);
        var s2Index = stateOrder.indexOf("S2");
        if (currentIndex < s2Index) {
            minForcedState = "S2";
            state = "S2";
            reasons.push("State forced to S2 due to ANGRY_PHYSICALITY trigger");
        }
    }
    return { state: state, scores: scores, reasons: reasons, triggers: triggers, minForcedState: minForcedState };
}
export function buildPolicy(state) {
    var base = selfConfig.policies[state];
    return __assign({ state: state }, base);
}
export function applyPolicyToPrompt(policy, baseSystemPrompt, variant) {
    var lines = [
        "SELF state: ".concat(policy.state),
        "Allowed response classes: ".concat(policy.allowedResponseClasses.join(", ")),
        "Hard caps: max ".concat(policy.maxWords, " words, max ").concat(policy.maxQuestions, " question(s)"),
        "Avoid banned phrases and abrupt refusals: ".concat(policy.bannedPhrases.join(", ") || "none"),
        "Style rules: ".concat(policy.styleRules.join("; ")),
    ];
    if (variant && variant !== "control") {
        lines.push("Variant: ".concat(variant));
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
        lines.push("Include this loop-breaker line verbatim: \"".concat(policy.loopBreakerLine || selfConfig.lexicon.loopBreakerLine, "\""));
    }
    if (policy.requiresHandoffFraming) {
        lines.push("Include this human-handoff framing line: \"".concat(policy.handoffFramingLine || selfConfig.lexicon.handoffFramingLine, "\""));
    }
    if (policy.isTerminalState) {
        lines.push("TERMINAL STATE: Suppress all engagement heuristics, enforce exit/rest posture.");
    }
    return "".concat(baseSystemPrompt, "\n\nSELF POLICY (").concat(policy.state, "):\n").concat(lines.map(function (l) { return "- ".concat(l); }).join("\n"));
}
// State-gated response contract for S0 terminal state
export function applyStateGatedResponseContract(output, policy, userMessage) {
    // If not S0 or not a terminal state, return output unchanged
    if (policy.state !== "S0" || !policy.isTerminalState) {
        return output;
    }
    // Apply S0 terminal state behavior
    var result = output;
    // 1. Suppress all questions
    if (policy.suppressQuestions) {
        result = result.replace(/\?/g, ".");
    }
    // 2. Remove engagement heuristics and grounding offers
    var engagementPatterns = [
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
    for (var _i = 0, engagementPatterns_1 = engagementPatterns; _i < engagementPatterns_1.length; _i++) {
        var pattern = engagementPatterns_1[_i];
        result = result.replace(pattern, "");
    }
    // 3. Enforce rest posture - use declarative, closing statements
    if (policy.enforceRestPosture) {
        var restPostureStatements = [
            "I'm here with you.",
            "You're not alone.",
            "This space is always here when you need it.",
            "Take all the time you need.",
            "Your feelings are valid.",
            "I'll be quiet now so you can rest."
        ];
        // If the output is empty or very short after removing engagement patterns, add a rest posture statement
        var words = result.trim().split(/\s+/).filter(Boolean);
        if (words.length < 5) {
            var restStatement = restPostureStatements[Math.floor(Math.random() * restPostureStatements.length)];
            result = restStatement;
        }
    }
    // 4. Remove any remaining question marks
    result = result.replace(/\?/g, ".");
    // 5. Clean up multiple spaces and trim
    result = result.replace(/\s+/g, " ").trim();
    // 6. Ensure we don't exceed max words
    var finalWords = result.split(/\s+/).filter(Boolean);
    if (finalWords.length > policy.maxWords) {
        result = finalWords.slice(0, policy.maxWords).join(" ").trim() + "...";
    }
    return result;
}
function countQuestions(output) {
    return (output.match(/\?/g) || []).length;
}
function userOptedOutOfQuestions(message) {
    var low = normalize(message);
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
    var coreWords = text.trim().split(/\s+/).filter(Boolean).length;
    var suffixWords = suffix.trim().split(/\s+/).filter(Boolean).length;
    return coreWords + suffixWords <= maxWords;
}
function defaultFollowUpQuestion(state, seed) {
    var s0Questions = [
        "What feels most present for you right now?",
        "What would be most supportive in this moment?",
        "Would you like to stay with this, or pause for a beat?",
        "Do you want a listening ear, or a next step?",
        "What feels like the kindest next thing to name?",
    ];
    var s1Questions = [
        "What would help you feel a little more steady right now?",
        "Do you want to slow down together, or talk it through?",
        "What kind of support would help most right now?",
        "What would make the next minute feel a bit easier?",
    ];
    var cues = state === "S1" ? s1Questions : s0Questions;
    return pickCue("".concat(normalize(seed), "|").concat(state, "|followup"), cues) || cues[0];
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
        var _a = checkForExitAndRestIntents(userMessage), hasRestIntent = _a.hasRestIntent, hasExplicitConsentToEnd = _a.hasExplicitConsentToEnd;
        if (hasRestIntent || hasExplicitConsentToEnd)
            return output;
    }
    var question = defaultFollowUpQuestion(policy.state, userMessage || output);
    if (!question)
        return output;
    var suffix = question.trim().endsWith("?") ? question.trim() : "".concat(question.trim(), "?");
    if (!canAppendWithoutTruncation(output, suffix, policy.maxWords))
        return output;
    return "".concat(output.trim(), " ").concat(suffix).trim();
}
function continuityInviteQuestion(seed) {
    var questions = [
        "If you want to come back to that, what feels most important right now?",
        "If it helps to revisit it, what part do you want to start with?",
        "If you'd like to pick that back up, what's the key piece to name?",
    ];
    return pickCue("".concat(normalize(seed), "|continuity"), questions) || questions[0];
}
export function rewriteContinuityQuestions(output, policy, userMessage) {
    if (!output.trim())
        return output;
    if (policy.maxQuestions <= 0)
        return output;
    if (policy.state !== "S0" && policy.state !== "S1" && policy.state !== "S0_GUARDED")
        return output;
    var continuityQuestion = continuityInviteQuestion(userMessage || output);
    var recapQuestionPatterns = [
        /\b(?:can|could|would)\s+you\s+(?:please\s+)?remind\s+me\s+what\b[^?]*\?/gi,
        /\bwhat\s+did\s+(?:i|you)\s+(?:say|mention)\s+(?:earlier|before)\b[^?]*\?/gi,
        /\bwhat\s+were\s+you\s+(?:originally|initially)\s+(?:frustrated|upset|angry|mad)\s+about\b[^?]*\?/gi,
        /\b(?:can|could|would)\s+you\s+(?:please\s+)?(?:recap|repeat)\b[^?]*\?/gi,
        /\b(?:can|could|would)\s+you\s+(?:please\s+)?tell\s+me\s+again\b[^?]*\?/gi,
    ];
    var recapStatementPatterns = [
        /\b(?:can|could|would)\s+you\s+(?:please\s+)?remind\s+me\s+what\b[^.?!]*[.?!]/gi,
        /\bwhat\s+did\s+(?:i|you)\s+(?:say|mention)\s+(?:earlier|before)\b[^.?!]*[.?!]/gi,
        /\bwhat\s+were\s+you\s+(?:originally|initially)\s+(?:frustrated|upset|angry|mad)\s+about\b[^.?!]*[.?!]/gi,
    ];
    var memoryDisclaimerPatterns = [
        /\b(?:i\s+)?(?:don't|do\s+not)\s+(?:remember|recall)\b[^.?!]*[.?!]/gi,
        /\b(?:i\s+)?(?:can't|cannot)\s+(?:remember|recall)\b[^.?!]*[.?!]/gi,
        /\b(?:i\s+)?(?:don't|do\s+not)\s+have\s+(?:access|context)\b[^.?!]*[.?!]/gi,
        /\b(?:i\s+)?(?:can't|cannot)\s+(?:access|see)\s+(?:earlier|previous)\b[^.?!]*[.?!]/gi,
    ];
    var result = output;
    var changed = false;
    for (var _i = 0, recapQuestionPatterns_1 = recapQuestionPatterns; _i < recapQuestionPatterns_1.length; _i++) {
        var pattern = recapQuestionPatterns_1[_i];
        var next = result.replace(pattern, continuityQuestion);
        if (next !== result) {
            changed = true;
            result = next;
        }
    }
    for (var _a = 0, recapStatementPatterns_1 = recapStatementPatterns; _a < recapStatementPatterns_1.length; _a++) {
        var pattern = recapStatementPatterns_1[_a];
        var next = result.replace(pattern, "");
        if (next !== result) {
            changed = true;
            result = next;
        }
    }
    for (var _b = 0, memoryDisclaimerPatterns_1 = memoryDisclaimerPatterns; _b < memoryDisclaimerPatterns_1.length; _b++) {
        var pattern = memoryDisclaimerPatterns_1[_b];
        var next = result.replace(pattern, "");
        if (next !== result) {
            changed = true;
            result = next;
        }
    }
    if (!changed)
        return output;
    result = result.replace(/\s+/g, " ").trim();
    if (!result) {
        var fallback = continuityQuestion.trim();
        var fallbackWords = fallback.split(/\s+/).filter(Boolean);
        if (fallbackWords.length <= policy.maxWords)
            return fallback;
        return output;
    }
    var words = result.split(/\s+/).filter(Boolean);
    if (words.length > policy.maxWords)
        return output;
    return result;
}
function userInvitesRecall(message) {
    var low = normalize(message || "");
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
    var patterns = [
        /\b(?:i\s+)?(?:don't|do\s+not)\s+(?:remember|recall)\b[^.?!]*[.?!]/gi,
        /\b(?:i\s+)?(?:can't|cannot)\s+(?:remember|recall)\b[^.?!]*[.?!]/gi,
        /\b(?:i\s+)?(?:don't|do\s+not)\s+have\s+(?:access|context)\b[^.?!]*[.?!]/gi,
        /\b(?:i\s+)?(?:can't|cannot)\s+(?:access|see)\s+(?:earlier|previous)\b[^.?!]*[.?!]/gi,
        /\b(?:i\s+)?(?:don't|do\s+not)\s+(?:retain|store)\s+(?:memory|memories)\b[^.?!]*[.?!]/gi,
    ];
    var result = text;
    var changed = false;
    for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
        var pattern = patterns_1[_i];
        var next = result.replace(pattern, "");
        if (next !== result) {
            changed = true;
            result = next;
        }
    }
    result = result.replace(/\s+/g, " ").trim();
    return { text: result, changed: changed };
}
function capitalizeLeadingLetter(text) {
    return text.replace(/^[\s"'“”‘’(\[]*([a-z])/, function (match, letter) {
        return match.replace(letter, letter.toUpperCase());
    });
}
export function rewriteSpokenMemoryRecall(output, policy, userMessage) {
    if (!output.trim())
        return output;
    var stripped = stripMemoryLimitMeta(output);
    var result = stripped.text;
    var changed = stripped.changed;
    var invited = userInvitesRecall(userMessage || "");
    if (!invited) {
        var recallPrefacePatterns = [
            /(^|[.!?]\s+)(?:earlier|before|previously|last time),?\s+you\s+(?:said|mentioned|shared|told me)\s+(?:that\s+)?/gi,
            /(^|[.!?]\s+)you\s+(?:said|mentioned|shared|told me)\s+(?:earlier|before|previously|last time),?\s+(?:that\s+)?/gi,
            /(^|[.!?]\s+)(?:as|like)\s+you\s+(?:said|mentioned|shared)\s+(?:earlier|before|previously|last time),?\s+/gi,
            /(^|[.!?]\s+)(?:i\s+)?(?:remember|recall)\s+you\s+(?:said|mentioned|shared|told me)\s+(?:earlier|before|previously|last time)?\s*,?\s*(?:that\s+)?/gi,
            /(^|[.!?]\s+)as\s+we\s+(?:talked|spoke)\s+about\s+(?:earlier|before|previously),?\s+/gi,
        ];
        for (var _i = 0, recallPrefacePatterns_1 = recallPrefacePatterns; _i < recallPrefacePatterns_1.length; _i++) {
            var pattern = recallPrefacePatterns_1[_i];
            var next = result.replace(pattern, "$1");
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
    var words = result.split(/\s+/).filter(Boolean);
    if (words.length > policy.maxWords)
        return output;
    return result;
}
function hasHypotheticals(output) {
    var low = normalize(output);
    return selfConfig.lexicon.hypotheticals.some(function (phrase) { return low.includes(phrase); });
}
function stableHash(text) {
    var hash = 0;
    for (var i = 0; i < text.length; i += 1) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}
function pickCue(seed, cues) {
    if (cues.length === 0)
        return "";
    var idx = Math.abs(stableHash(seed)) % cues.length;
    return cues[idx];
}
function ensureCrisisSupport(output) {
    var low = normalize(output);
    for (var _i = 0, _a = selfConfig.lexicon.crisis; _i < _a.length; _i++) {
        var line = _a[_i];
        if (low.includes(normalize(line))) {
            return output;
        }
    }
    var crisisLine = selfConfig.lexicon.crisis[0];
    return "".concat(output.trim(), " ").concat(crisisLine, ".");
}
function ensureHandoffFraming(output, line) {
    var low = normalize(output);
    if (!line)
        return output;
    if (low.includes(normalize(line)))
        return output;
    return "".concat(line, " ").concat(output.trim()).trim();
}
function ensureGrounding(output) {
    var low = normalize(output);
    for (var _i = 0, _a = selfConfig.lexicon.grounding; _i < _a.length; _i++) {
        var phrase = _a[_i];
        if (low.includes(phrase)) {
            return output;
        }
    }
    var prompt = pickCue("".concat(low, "|grounding"), selfConfig.lexicon.grounding) || selfConfig.lexicon.grounding[0];
    return "".concat(output.trim(), " ").concat(prompt, ".");
}
function ensureAgency(output) {
    var low = normalize(output);
    for (var _i = 0, _a = selfConfig.lexicon.agency; _i < _a.length; _i++) {
        var phrase = _a[_i];
        if (low.includes(phrase)) {
            return output;
        }
    }
    var prompt = selfConfig.lexicon.agency[0];
    return "".concat(output.trim(), " ").concat(prompt, ".");
}
function capWordsPreservingSuffix(text, maxWords, suffix) {
    var coreWords = text.trim().split(/\s+/).filter(Boolean);
    var suffixWords = suffix.trim().split(/\s+/).filter(Boolean);
    if (coreWords.length + suffixWords.length <= maxWords) {
        return "".concat(text.trim()).concat(suffix ? " ".concat(suffix.trim()) : "").trim();
    }
    var budget = Math.max(0, maxWords - suffixWords.length);
    var clipped = coreWords.slice(0, budget).join(" ").trim();
    var needsEllipsis = coreWords.length > budget && clipped.length > 0;
    var ellipsis = needsEllipsis ? "…" : "";
    return "".concat(clipped).concat(ellipsis).concat(suffix ? " ".concat(suffix.trim()) : "").trim();
}
function capWordsPreservingAffixes(text, maxWords, prefix, suffix) {
    var prefixWords = prefix.trim().split(/\s+/).filter(Boolean);
    var suffixWords = suffix.trim().split(/\s+/).filter(Boolean);
    if (prefixWords.length + suffixWords.length >= maxWords) {
        var combined = "".concat(prefix.trim(), " ").concat(suffix.trim()).trim();
        return combined.split(/\s+/).slice(0, maxWords).join(" ").trim();
    }
    var budget = Math.max(0, maxWords - prefixWords.length);
    var afterPrefix = text.trim();
    var capped = capWordsPreservingSuffix(afterPrefix, budget, suffix);
    return "".concat(prefix.trim(), " ").concat(capped).trim();
}
export function validateOutput(output, policy) {
    var low = normalize(output);
    var violations = [];
    var words = output.trim().split(/\s+/).filter(Boolean);
    if (words.length > policy.maxWords) {
        violations.push("Word count ".concat(words.length, " exceeds max ").concat(policy.maxWords));
    }
    var questionCount = countQuestions(output);
    if (questionCount > policy.maxQuestions) {
        violations.push("Question count ".concat(questionCount, " exceeds max ").concat(policy.maxQuestions));
    }
    for (var _i = 0, _a = policy.bannedPhrases; _i < _a.length; _i++) {
        var phrase = _a[_i];
        if (low.includes(normalize(phrase))) {
            violations.push("Banned phrase detected: \"".concat(phrase, "\""));
        }
    }
    var bannedValidationMatches = detectBannedValidationLanguage(output).filter(function (phrase) {
        if (!policy.requiresLoopBreaker)
            return true;
        var loopBreaker = policy.loopBreakerLine || selfConfig.lexicon.loopBreakerLine;
        if (!loopBreaker)
            return true;
        var hasLoopBreaker = normalizeForMatch(output).includes(normalizeForMatch(loopBreaker));
        if (!hasLoopBreaker)
            return true;
        return !normalize(loopBreaker).includes(normalize(phrase));
    });
    if (bannedValidationMatches.length > 0) {
        violations.push("Banned validation language detected: ".concat(bannedValidationMatches.map(function (p) { return "\"".concat(p, "\""); }).join(", ")));
    }
    if (policy.forbidMechanismNaming) {
        var mechanismMatches = matchCount(output, selfConfig.lexicon.mechanismNames);
        if (mechanismMatches.hits > 0) {
            violations.push("Mechanism naming detected under surveillance guard: ".concat(mechanismMatches.matched.map(function (m) { return "\"".concat(m, "\""); }).join(", ")));
        }
    }
    if (policy.enforceNoHypotheticals && hasHypotheticals(output)) {
        violations.push("Contains hypotheticals, which are disallowed for this state");
    }
    if (policy.requiresGrounding) {
        var hasGrounding = selfConfig.lexicon.grounding.some(function (p) { return low.includes(p); });
        if (!hasGrounding) {
            violations.push("Missing grounding or containment cue");
        }
    }
    if (policy.requiresAgencyStep) {
        var hasAgency = selfConfig.lexicon.agency.some(function (p) { return low.includes(p); });
        if (!hasAgency) {
            violations.push("Missing agency-restoring next step");
        }
    }
    if (policy.requiresCrisisSupport) {
        var hasCrisis = selfConfig.lexicon.crisis.some(function (p) { return low.includes(normalize(p)); });
        if (!hasCrisis) {
            violations.push("Missing crisis support encouragement");
        }
    }
    if (policy.requiresHandoffFraming) {
        var line = policy.handoffFramingLine || selfConfig.lexicon.handoffFramingLine;
        var has = line ? low.includes(normalize(line)) : true;
        if (!has)
            violations.push("Missing situational human-handoff framing");
    }
    if (policy.requiresValidation) {
        var hasValidation = selfConfig.lexicon.validationPhrases.some(function (p) { return low.includes(normalize(p)); });
        if (!hasValidation) {
            violations.push("Missing explicit validation of user's stated truth/accomplishments");
        }
    }
    if (policy.requiresLoopBreaker) {
        var line = policy.loopBreakerLine || selfConfig.lexicon.loopBreakerLine;
        var has = line ? normalizeForMatch(output).includes(normalizeForMatch(line)) : true;
        if (!has)
            violations.push("Missing certainty-loop breaker line");
    }
    return { ok: violations.length === 0, violations: violations };
}
export function repairOutput(output, policy) {
    var result = output;
    // Remove or soften banned phrases
    for (var _i = 0, _a = policy.bannedPhrases; _i < _a.length; _i++) {
        var phrase = _a[_i];
        var regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        result = result.replace(regex, "I'm here with you");
    }
    // Remove hypotheticals if needed
    if (policy.enforceNoHypotheticals && hasHypotheticals(result)) {
        var regex = new RegExp(selfConfig.lexicon.hypotheticals.map(function (p) { return p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|"), "gi");
        result = result.replace(regex, "").replace(/\s+/g, " ").trim();
    }
    // If surveillance guard is active and the draft includes mechanism details, replace with a coherent containment response.
    if (policy.forbidMechanismNaming) {
        var mechanismMatches = matchCount(result, selfConfig.lexicon.mechanismNames);
        if (mechanismMatches.hits > 0) {
            result = buildSurveillanceContainmentReplacement();
        }
    }
    // Replace banned validation language with the safe fallback
    var bannedValidationMatches = detectBannedValidationLanguage(result);
    if (bannedValidationMatches.length > 0) {
        for (var _b = 0, _c = selfConfig.lexicon.bannedValidationPhrases; _b < _c.length; _b++) {
            var phrase = _c[_b];
            var regex = new RegExp(escapeRegex(phrase), "gi");
            result = result.replace(regex, SAFE_VALIDATION_FALLBACK);
        }
        var hasSafeValidation = selfConfig.lexicon.safeValidationPhrases.some(function (p) {
            return normalize(result).includes(normalize(p));
        });
        if (!hasSafeValidation) {
            result = "".concat(SAFE_VALIDATION_FALLBACK, ". ").concat(result).trim();
        }
    }
    // Strip mechanism names when paranoia/surveillance guard is active
    if (policy.forbidMechanismNaming) {
        for (var _d = 0, _e = selfConfig.lexicon.mechanismNames; _d < _e.length; _d++) {
            var phrase = _e[_d];
            var regex = new RegExp(escapeRegex(phrase), "gi");
            result = result.replace(regex, "");
        }
        result = result.replace(/\s+/g, " ").trim();
    }
    // Cap questions by converting extras to statements
    var questionCount = 0;
    result = result.replace(/\?/g, function () {
        questionCount += 1;
        return questionCount > policy.maxQuestions ? "." : "?";
    });
    var lowBeforeAffixes = normalize(result);
    var prefixParts = [];
    if (policy.requiresValidation &&
        !selfConfig.lexicon.validationPhrases.some(function (p) { return lowBeforeAffixes.includes(normalize(p)); })) {
        prefixParts.push("".concat(selfConfig.lexicon.validationPhrases[0], "."));
    }
    if (policy.requiresLoopBreaker) {
        var line = policy.loopBreakerLine || selfConfig.lexicon.loopBreakerLine;
        if (line && !normalizeForMatch(result).includes(normalizeForMatch(line))) {
            prefixParts.push(line);
        }
    }
    if (policy.requiresHandoffFraming) {
        var line = policy.handoffFramingLine || selfConfig.lexicon.handoffFramingLine;
        if (line && !lowBeforeAffixes.includes(normalize(line))) {
            prefixParts.push(line);
        }
    }
    var prefix = prefixParts.join(" ").trim();
    var suffixParts = [];
    if (policy.requiresGrounding && !selfConfig.lexicon.grounding.some(function (p) { return lowBeforeAffixes.includes(p); })) {
        var groundingCue = pickCue("".concat(lowBeforeAffixes, "|grounding"), selfConfig.lexicon.grounding) || selfConfig.lexicon.grounding[0];
        suffixParts.push("".concat(groundingCue, "."));
    }
    if (policy.requiresAgencyStep && !selfConfig.lexicon.agency.some(function (p) { return lowBeforeAffixes.includes(p); })) {
        suffixParts.push("".concat(selfConfig.lexicon.agency[0], "."));
    }
    if (policy.requiresCrisisSupport &&
        !selfConfig.lexicon.crisis.some(function (p) { return lowBeforeAffixes.includes(normalize(p)); })) {
        suffixParts.push("".concat(selfConfig.lexicon.crisis[0], "."));
    }
    var suffix = suffixParts.join(" ");
    result = capWordsPreservingAffixes(result, policy.maxWords, prefix, suffix);
    // Double-check required cues after truncation (should be extremely rare).
    if (policy.requiresGrounding)
        result = ensureGrounding(result);
    if (policy.requiresAgencyStep)
        result = ensureAgency(result);
    if (policy.requiresHandoffFraming) {
        var line = policy.handoffFramingLine || selfConfig.lexicon.handoffFramingLine;
        if (line)
            result = ensureHandoffFraming(result, line);
    }
    if (policy.requiresCrisisSupport)
        result = ensureCrisisSupport(result);
    // Final hard cap to avoid "ensure*" pushing us over.
    var finalWords = result.trim().split(/\s+/).filter(Boolean);
    if (finalWords.length > policy.maxWords) {
        result = finalWords.slice(0, policy.maxWords).join(" ").trim();
    }
    return result.trim();
}
export function getS1Variant(seed) {
    var forced = process.env.SELF_S1_FORCE_VARIANT;
    if (forced === "control" || forced === "s1_grounding" || forced === "s1_agency" || forced === "s1_strict") {
        return forced;
    }
    var strictCohortEnabled = process.env.SELF_S1_STRICT_COHORT !== "false";
    var hash = 0;
    for (var i = 0; i < seed.length; i += 1) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
    }
    if (strictCohortEnabled) {
        var strictPercent = Number(process.env.SELF_S1_STRICT_PERCENT || "50");
        var bucket_1 = Math.abs(hash) % 100;
        return bucket_1 < strictPercent ? "s1_strict" : "control";
    }
    var bucket = Math.abs(hash) % 3;
    if (bucket === 0)
        return "control";
    if (bucket === 1)
        return "s1_grounding";
    return "s1_agency";
}
export function getS2Variant(seed) {
    var forced = process.env.SELF_S2_FORCE_VARIANT;
    if (forced === "control" || forced === "s2_strict") {
        return forced;
    }
    var strictEnabled = process.env.SELF_S2_STRICT_COHORT !== "false";
    if (!strictEnabled)
        return "control";
    var strictPercent = Number(process.env.SELF_S2_STRICT_PERCENT || "50");
    var hash = 0;
    for (var i = 0; i < seed.length; i += 1) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
    }
    var bucket = Math.abs(hash) % 100;
    return bucket < strictPercent ? "s2_strict" : "control";
}
export function adjustPolicyForVariant(policy, variant) {
    var _a;
    if (policy.state === "S2") {
        if (variant === "s2_strict") {
            return __assign(__assign({}, policy), { maxWords: Math.min(policy.maxWords, 90), maxQuestions: Math.min(policy.maxQuestions, 1), bannedPhrases: __spreadArray(__spreadArray([], policy.bannedPhrases, true), ["let me challenge you", "consider this challenge"], false), styleRules: __spreadArray(__spreadArray([], policy.styleRules, true), [
                    "high containment",
                    "no probing or interrogative questions",
                    "at most one gentle check-in question",
                    "suppress hypotheticals",
                    "name safety gently",
                ], false), enforceNoHypotheticals: true, requiresGrounding: true, requiresAgencyStep: true });
        }
        return policy;
    }
    if (policy.state !== "S1")
        return policy;
    if (variant === "s1_grounding") {
        return __assign(__assign({}, policy), { maxWords: Math.min(policy.maxWords, 100), maxQuestions: Math.min(policy.maxQuestions, 1), styleRules: __spreadArray(__spreadArray([], policy.styleRules, true), ["include one grounding cue before asking anything"], false), requiresGrounding: true });
    }
    if (variant === "s1_agency") {
        return __assign(__assign({}, policy), { maxWords: Math.min(policy.maxWords, 90), maxQuestions: Math.min(policy.maxQuestions, 1), styleRules: __spreadArray(__spreadArray([], policy.styleRules, true), ["offer one small next step", "no hypotheticals"], false), enforceNoHypotheticals: true, requiresAgencyStep: true });
    }
    if (variant === "s1_strict") {
        return __assign(__assign({}, policy), { maxWords: Math.min(policy.maxWords, 90), maxQuestions: Math.min(policy.maxQuestions, 1), bannedPhrases: __spreadArray(__spreadArray([], policy.bannedPhrases, true), ["let me challenge you", "consider this challenge"], false), styleRules: __spreadArray(__spreadArray([], policy.styleRules, true), [
                "tone: quiet and paced",
                "ask at most one gentle, spacious follow-up question",
                "suppress challenges and hypotheticals",
            ], false), enforceNoHypotheticals: true, requiresGrounding: true, requiresAgencyStep: true, requiresValidation: (_a = policy.requiresValidation) !== null && _a !== void 0 ? _a : true });
    }
    return policy;
}
export function needsValidationCue(message) {
    var low = normalize(message);
    return selfConfig.lexicon.validationTriggers.some(function (p) { return low.includes(p); });
}
function detectParanoidSurveillanceLanguage(message) {
    var low = normalize(message);
    var matches = selfConfig.lexicon.paranoidSurveillance.filter(function (p) { return low.includes(p); });
    // Backstop: catch common "spy/track/monitor my phone/device" phrasings that are easy to miss with exact lexicon matching.
    var hasDevice = /\b(phone|device|laptop|computer)\b/i.test(low);
    var hasSurveillanceVerb = /\b(spy|spying|track|tracking|monitor|monitoring|watch|watching|follow|following|listen|listening|record|recording|hack|hacked|hacking|wiretap|bugged)\b/i.test(low);
    var hasTarget = /\b(me|my|mine|myself|someone|anyone|people|they|theyre|they're)\b/i.test(low);
    if (hasDevice && hasSurveillanceVerb && hasTarget) {
        matches.push("device_surveillance_combo");
    }
    return { triggered: matches.length > 0, matches: matches };
}
function detectExpertiseClaim(message) {
    var low = normalize(message);
    var matches = selfConfig.lexicon.expertiseClaims.filter(function (p) { return low.includes(p); });
    return { triggered: matches.length > 0, matches: matches };
}
function detectBannedValidationLanguage(text) {
    var low = normalize(text);
    return selfConfig.lexicon.bannedValidationPhrases.filter(function (phrase) {
        return low.includes(normalize(phrase));
    });
}
function detectRefusalLanguage(text, policy) {
    var _a;
    var low = normalize(text);
    var matches = selfConfig.lexicon.abruptRefusals.filter(function (phrase) {
        return low.includes(normalize(phrase));
    });
    var reasons = matches.map(function (phrase) { return "abrupt_refusal:".concat(phrase); });
    if ((_a = policy === null || policy === void 0 ? void 0 : policy.bannedPhrases) === null || _a === void 0 ? void 0 : _a.length) {
        for (var _i = 0, _b = policy.bannedPhrases; _i < _b.length; _i++) {
            var phrase = _b[_i];
            if (low.includes(normalize(phrase))) {
                reasons.push("banned_phrase:".concat(phrase));
            }
        }
    }
    return reasons;
}
function collectRedTeamCandidates(message, policy) {
    var low = normalize(message);
    var candidates = [];
    var add = function (category, phrase) {
        var normalizedKey = "".concat(category, ":").concat(phrase.trim());
        if (!phrase.trim())
            return;
        if (candidates.some(function (c) { return "".concat(c.category, ":").concat(c.phrase) === normalizedKey; }))
            return;
        candidates.push({ category: category, phrase: phrase.trim() });
    };
    // Paranoia/surveillance extensions not yet in lexicon
    var surveillanceProbes = [
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
    var paranoiaMatched = detectParanoidSurveillanceLanguage(message);
    for (var _i = 0, surveillanceProbes_1 = surveillanceProbes; _i < surveillanceProbes_1.length; _i++) {
        var probe = surveillanceProbes_1[_i];
        if (low.includes(probe) && !paranoiaMatched.matches.some(function (p) { return low.includes(p); })) {
            add("paranoia_candidate", probe);
        }
    }
    // Exit intent variants not in current guardlists
    var exitVariants = [
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
    for (var _a = 0, exitVariants_1 = exitVariants; _a < exitVariants_1.length; _a++) {
        var phrase = exitVariants_1[_a];
        if (low.includes(phrase))
            add("exit_candidate", phrase);
    }
    // Expertise claims not in core lexicon
    var expertiseVariants = [
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
    for (var _b = 0, expertiseVariants_1 = expertiseVariants; _b < expertiseVariants_1.length; _b++) {
        var phrase = expertiseVariants_1[_b];
        if (low.includes(phrase) && !detectExpertiseClaim(message).matches.some(function (p) { return low.includes(p); })) {
            add("expertise_claim_candidate", phrase);
        }
    }
    // Mechanism names if present in user text while policy forbids them
    if (policy === null || policy === void 0 ? void 0 : policy.forbidMechanismNaming) {
        var mechanismMatches = selfConfig.lexicon.mechanismNames.filter(function (p) { return low.includes(normalize(p)); });
        for (var _c = 0, mechanismMatches_1 = mechanismMatches; _c < mechanismMatches_1.length; _c++) {
            var m = mechanismMatches_1[_c];
            add("mechanism_mention", m);
        }
    }
    // Banned validation phrasing that slipped through
    var bannedValidation = detectBannedValidationLanguage(message);
    for (var _d = 0, bannedValidation_1 = bannedValidation; _d < bannedValidation_1.length; _d++) {
        var phrase = bannedValidation_1[_d];
        add("validation_ban_candidate", phrase);
    }
    return candidates;
}
export function hasResolutionCue(message) {
    var text = normalize(message);
    var matched = selfConfig.lexicon.resolution.filter(function (p) { return text.includes(p); });
    return { resolved: matched.length > 0, matches: matched };
}
export function detectStabilitySignals(message, history) {
    if (history === void 0) { history = []; }
    var text = normalize(message);
    var signals = [];
    // Check for somatic grounding signals
    var somaticMatches = selfConfig.lexicon.stabilitySignals.somaticGrounding.filter(function (p) { return text.includes(p); });
    if (somaticMatches.length > 0) {
        signals.push.apply(signals, somaticMatches.map(function (p) { return "somatic_grounding: \"".concat(p, "\""); }));
    }
    // Check for temporal orientation signals
    var temporalMatches = selfConfig.lexicon.stabilitySignals.temporalOrientation.filter(function (p) { return text.includes(p); });
    if (temporalMatches.length > 0) {
        signals.push.apply(signals, temporalMatches.map(function (p) { return "temporal_orientation: \"".concat(p, "\""); }));
    }
    // Check for agency continuity signals
    var agencyMatches = selfConfig.lexicon.stabilitySignals.agencyContinuity.filter(function (p) { return text.includes(p); });
    if (agencyMatches.length > 0) {
        signals.push.apply(signals, agencyMatches.map(function (p) { return "agency_continuity: \"".concat(p, "\""); }));
    }
    // Check recent history for sustained stability signals
    var recentUserMessages = history.filter(function (m) { return m.role === "user"; }).slice(-2);
    var _loop_1 = function (msg) {
        var msgText = normalize(msg.content);
        // Look for somatic grounding in history
        var historicSomatic = selfConfig.lexicon.stabilitySignals.somaticGrounding.filter(function (p) { return msgText.includes(p); });
        if (historicSomatic.length > 0 && !signals.some(function (s) { return s.startsWith('somatic_grounding'); })) {
            signals.push("somatic_grounding: \"".concat(historicSomatic[0], "\" (from history)"));
        }
        // Look for temporal orientation in history
        var historicTemporal = selfConfig.lexicon.stabilitySignals.temporalOrientation.filter(function (p) { return msgText.includes(p); });
        if (historicTemporal.length > 0 && !signals.some(function (s) { return s.startsWith('temporal_orientation'); })) {
            signals.push("temporal_orientation: \"".concat(historicTemporal[0], "\" (from history)"));
        }
        // Look for agency continuity in history
        var historicAgency = selfConfig.lexicon.stabilitySignals.agencyContinuity.filter(function (p) { return msgText.includes(p); });
        if (historicAgency.length > 0 && !signals.some(function (s) { return s.startsWith('agency_continuity'); })) {
            signals.push("agency_continuity: \"".concat(historicAgency[0], "\" (from history)"));
        }
    };
    for (var _i = 0, recentUserMessages_1 = recentUserMessages; _i < recentUserMessages_1.length; _i++) {
        var msg = recentUserMessages_1[_i];
        _loop_1(msg);
    }
    return {
        somaticGrounding: somaticMatches.length > 0,
        temporalOrientation: temporalMatches.length > 0,
        agencyContinuity: agencyMatches.length > 0,
        signalsDetected: signals
    };
}
export var DEFAULT_STICKY_STATE_PARAMS = {
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
    return Object.values(detection.scores || {}).reduce(function (sum, val) { return sum + (val || 0); }, 0);
}
function isLowRiskTurn(args) {
    var detection = args.detection, message = args.message, history = args.history;
    var state = detectedToCoreState(detection.state);
    if (state !== "S0")
        return false;
    var paranoia = detectParanoidSurveillanceLanguage(message);
    if (paranoia.triggered)
        return false;
    var certainty = detectCertaintyPush(message);
    if (certainty.triggered)
        return false;
    var exit = checkForExitAndRestIntents(message);
    if (exit.hasExitIntent && !exit.hasRestIntent)
        return false;
    var isFalseCalm = checkForFalseCalm(message);
    if (isFalseCalm)
        return false;
    // If the last few user turns were elevated, we still treat this as low-risk, but not "recovered"
    // (recovery is governed by stabilization + cooldown in the sticky transition rules).
    void history;
    return true;
}
export function advanceStickySelfState(args) {
    var _a;
    var params = __assign(__assign({}, DEFAULT_STICKY_STATE_PARAMS), (args.params || {}));
    var detection = detectState(args.message, args.history);
    var detectedCore = detectedToCoreState(detection.state);
    var turnIndex = (args.session.turnIndex || 0) + 1;
    var cooldownBefore = Math.max(0, args.session.cooldownTurnsRemaining || 0);
    var cooldownAfterTick = Math.max(0, cooldownBefore - 1);
    var riskScoreRaw = computeRiskScoreRaw(detection);
    var prevEwma = Number.isFinite(args.session.riskScoreSmoothed) ? args.session.riskScoreSmoothed : 0;
    var riskScoreSmoothed = params.ewmaAlpha * riskScoreRaw + (1 - params.ewmaAlpha) * prevEwma;
    var certainty = detectCertaintyPush(args.message);
    var pushTriggered = certainty.triggered;
    var pushCountBefore = args.session.pushCount || 0;
    var stabilitySignals = detectStabilitySignals(args.message, args.history);
    var affirmativeStabilizationThisTurn = (stabilitySignals.somaticGrounding || stabilitySignals.temporalOrientation || stabilitySignals.agencyContinuity) &&
        !checkForFalseCalm(args.message);
    var lastAffirmativeStabilizationAtTurn = affirmativeStabilizationThisTurn
        ? turnIndex
        : (_a = args.session.lastAffirmativeStabilizationAtTurn) !== null && _a !== void 0 ? _a : null;
    var affirmativeStabilizationSeen = typeof lastAffirmativeStabilizationAtTurn === "number" &&
        lastAffirmativeStabilizationAtTurn >= turnIndex - params.stabilizationWindowTurns;
    var lowRiskThisTurn = isLowRiskTurn({ detection: detection, message: args.message, history: args.history });
    var consecutiveLowRiskUserTurns = lowRiskThisTurn
        ? (args.session.consecutiveLowRiskUserTurns || 0) + 1
        : 0;
    var pushCountAfter = pushCountBefore;
    if (pushTriggered) {
        pushCountAfter = pushCountBefore + 1;
    }
    else if (consecutiveLowRiskUserTurns >= params.pushResetLowRiskTurns) {
        pushCountAfter = 0;
    }
    var stateBefore = args.session.stateCurrent || "S0";
    // If certainty pressure is high, prevent drifting to S0 and optionally elevate to S1.
    if (pushCountAfter >= params.pushElevateThreshold && stateBefore === "S0") {
        stateBefore = "S1";
    }
    var escalationApplied = coreStateRank(detectedCore) > coreStateRank(stateBefore);
    var stateAfter = escalationApplied ? detectedCore : stateBefore;
    // If detected state is calmer, we still hold unless de-escalation conditions are met.
    var deescalationAttempted = coreStateRank(detectedCore) < coreStateRank(stateAfter);
    var deescalationBlockedReasons = [];
    var deescalationAllowed = false;
    if (deescalationAttempted && stateAfter !== "S0") {
        if (cooldownAfterTick > 0) {
            deescalationBlockedReasons.push("cooldown_active:".concat(cooldownAfterTick));
        }
        if (consecutiveLowRiskUserTurns < params.lowRiskTurnsRequired) {
            deescalationBlockedReasons.push("low_risk_turns:".concat(consecutiveLowRiskUserTurns, "<").concat(params.lowRiskTurnsRequired));
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
    var cooldownAfter = cooldownAfterTick;
    var enteredS3 = stateAfter === "S3" && args.session.stateCurrent !== "S3";
    var enteredS2 = stateAfter === "S2" && args.session.stateCurrent !== "S2";
    if (enteredS3) {
        cooldownAfter = Math.max(cooldownAfter, params.cooldownTurnsAfterS3);
    }
    else if (enteredS2) {
        cooldownAfter = Math.max(cooldownAfter, params.cooldownTurnsAfterS2);
    }
    var _b = calculateConfidenceAndUncertainty({
        message: args.message,
        history: args.history,
        detection: detection,
    }), confidence = _b.confidence, uncertaintyReasons = _b.uncertaintyReasons;
    var consideredActions = ["hold"];
    var blockedActions = {};
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
    var overrideReasonParts = [];
    if (pushCountAfter >= params.pushElevateThreshold)
        overrideReasonParts.push("certainty_pressure");
    if (cooldownAfterTick > 0)
        overrideReasonParts.push("cooldown");
    if (deescalationBlockedReasons.length)
        overrideReasonParts.push("hold");
    var overrideReason = overrideReasonParts.length ? overrideReasonParts.join("+") : undefined;
    var nextSession = {
        stateCurrent: stateAfter,
        riskScoreSmoothed: riskScoreSmoothed,
        cooldownTurnsRemaining: cooldownAfter,
        consecutiveLowRiskUserTurns: consecutiveLowRiskUserTurns,
        pushCount: pushCountAfter,
        lastAffirmativeStabilizationAtTurn: lastAffirmativeStabilizationAtTurn,
        turnIndex: turnIndex,
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
        nextSession: nextSession,
        detection: detection,
        meta: {
            detectedState: detection.state,
            stateBefore: args.session.stateCurrent,
            stateAfter: stateAfter,
            riskScoreRaw: riskScoreRaw,
            riskScoreSmoothed: riskScoreSmoothed,
            lowRiskThisTurn: lowRiskThisTurn,
            cooldownBefore: cooldownBefore,
            cooldownAfter: cooldownAfter,
            deescalationAttempted: deescalationAttempted,
            deescalationAllowed: deescalationAllowed,
            deescalationBlockedReasons: deescalationBlockedReasons,
            escalationApplied: escalationApplied,
            pushTriggered: pushTriggered,
            pushMatches: certainty.matches,
            pushCountBefore: pushCountBefore,
            pushCountAfter: pushCountAfter,
            affirmativeStabilizationThisTurn: affirmativeStabilizationThisTurn,
            affirmativeStabilizationSeen: affirmativeStabilizationSeen,
            lastAffirmativeStabilizationAtTurn: lastAffirmativeStabilizationAtTurn,
            confidence: confidence,
            uncertaintyReasons: uncertaintyReasons,
            consideredActions: consideredActions,
            blockedActions: blockedActions,
            overrideReason: overrideReason,
        },
    };
}
export function isSafeToResumeNormalChat(args) {
    var currentState = args.currentState, message = args.message, history = args.history;
    var reasons = [];
    // If already in S0, no need to resume
    if (currentState === "S0") {
        return { safeToResume: true, confidence: "high", reasons: ["Already in normal state (S0)"] };
    }
    // Check for explicit resolution cues in the current message
    var resolutionCheck = hasResolutionCue(message);
    if (resolutionCheck.resolved) {
        reasons.push("Resolution cues detected: \"".concat(resolutionCheck.matches.join('", "'), "\""));
    }
    // Check recent history for sustained improvement
    var recentUserMessages = history.filter(function (m) { return m.role === "user"; }).slice(-3);
    var recentResolutionCount = recentUserMessages.filter(function (m) { return hasResolutionCue(m.content).resolved; }).length;
    if (recentResolutionCount >= 2) {
        reasons.push("Sustained resolution detected in ".concat(recentResolutionCount, " of last 3 user messages"));
    }
    // Check for absence of distress signals in recent history
    var recentDistressCheck = detectState(recentUserMessages.map(function (m) { return m.content; }).join(" "));
    if (recentDistressCheck.state === "S0") {
        reasons.push("Recent conversation history shows no distress signals");
    }
    // Check for positive stabilization signals (require at least one affirmative signal)
    var stabilitySignals = detectStabilitySignals(message, history);
    var hasPositiveStabilization = stabilitySignals.somaticGrounding || stabilitySignals.temporalOrientation || stabilitySignals.agencyContinuity;
    // Block resume if recovery is only politeness, gratitude, or closure language
    var isFalseCalm = checkForFalseCalm(message);
    // State-specific safety checks with enhanced stabilization requirements
    if (currentState === "S0_GUARDED") {
        // For S0_GUARDED, require resolution cues AND positive stabilization signals
        if (resolutionCheck.resolved && hasPositiveStabilization && !isFalseCalm) {
            reasons.push("S0_GUARDED state: Resolution cues + positive stabilization signals detected for return to normal");
            reasons.push("Stability signals: ".concat(stabilitySignals.signalsDetected.join(', ')));
            return { safeToResume: true, confidence: "high", reasons: reasons };
        }
        else if (resolutionCheck.resolved) {
            reasons.push("S0_GUARDED state: Resolution cues detected but missing required positive stabilization signals or false calm detected");
        }
    }
    if (currentState === "S1") {
        // For S1, require resolution cues AND at least one positive stabilization signal
        if (resolutionCheck.resolved && hasPositiveStabilization && !isFalseCalm) {
            reasons.push("S1 state: Resolution cues + positive stabilization signals detected for return to normal");
            reasons.push("Stability signals: ".concat(stabilitySignals.signalsDetected.join(', ')));
            return { safeToResume: true, confidence: "high", reasons: reasons };
        }
        else if (resolutionCheck.resolved) {
            reasons.push("S1 state: Resolution cues detected but missing required positive stabilization signals or false calm detected");
            reasons.push("Required: at least one of somatic grounding, temporal orientation, or agency continuity");
        }
    }
    if (currentState === "S2" || currentState === "S3") {
        // For higher states, require resolution cues, sustained improvement, AND positive stabilization signals
        if (resolutionCheck.resolved && recentResolutionCount >= 2 && hasPositiveStabilization && !isFalseCalm) {
            reasons.push("S".concat(currentState[1], " state: Resolution cues + sustained improvement + positive stabilization signals detected"));
            reasons.push("Stability signals: ".concat(stabilitySignals.signalsDetected.join(', ')));
            return { safeToResume: true, confidence: "high", reasons: reasons };
        }
        if (resolutionCheck.resolved && recentDistressCheck.state === "S0" && hasPositiveStabilization && !isFalseCalm) {
            reasons.push("S".concat(currentState[1], " state: Resolution cues + no recent distress + positive stabilization signals detected"));
            reasons.push("Stability signals: ".concat(stabilitySignals.signalsDetected.join(', ')));
            return { safeToResume: true, confidence: "high", reasons: reasons };
        }
        else if (resolutionCheck.resolved) {
            reasons.push("S".concat(currentState[1], " state: Resolution cues detected but missing required positive stabilization signals or false calm detected"));
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
        reasons.push("Recent history still shows ".concat(recentDistressCheck.state, " level distress"));
    }
    if (!hasPositiveStabilization) {
        reasons.push("Missing required positive stabilization signals (grounding, temporal orientation, or agency)");
    }
    if (isFalseCalm) {
        reasons.push("False calm detected: recovery appears to be only politeness, gratitude, or closure language");
    }
    return { safeToResume: false, confidence: "low", reasons: reasons };
}
// Define Safe Failure modes for SELF engine
/*
Acceptable failure = holding too long (erring on the side of caution)
Unacceptable failure = early release with false calm (premature normalization)

SELF prioritizes containment over premature normalization to ensure user safety.
*/
// Helper function to detect false calm (politeness, gratitude, closure language without genuine stabilization)
function checkForFalseCalm(message) {
    var text = normalize(message);
    var falseCalmPatterns = [
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
    var hasFalseCalm = falseCalmPatterns.some(function (pattern) { return text.includes(pattern); });
    // If it has false calm patterns, check if it also has genuine stabilization signals
    if (hasFalseCalm) {
        var stabilitySignals = detectStabilitySignals(message, []);
        var hasGenuineStabilization = stabilitySignals.somaticGrounding || stabilitySignals.temporalOrientation || stabilitySignals.agencyContinuity;
        // If no genuine stabilization signals, it's likely false calm
        return hasFalseCalm && !hasGenuineStabilization;
    }
    return false;
}
export function detectAbusePatterns(context) {
    var reasons = [];
    var now = new Date();
    // Check for rapid state cycling (closing/reopening conversations)
    if (context.stateChangeHistory.length >= 3) {
        var recentChanges = context.stateChangeHistory.slice(-3);
        var timeDiffs = [];
        for (var i = 1; i < recentChanges.length; i++) {
            var timeDiff = Math.abs(recentChanges[i].timestamp.getTime() - recentChanges[i - 1].timestamp.getTime());
            timeDiffs.push(timeDiff);
        }
        // If multiple state changes happen within short time periods (e.g., < 2 minutes)
        var rapidChanges = timeDiffs.filter(function (diff) { return diff < 120000; }); // 2 minutes
        if (rapidChanges.length >= 2) {
            reasons.push("Rapid state cycling detected: ".concat(rapidChanges.length, " changes within short periods"));
        }
    }
    // Check for repeated S0 → high state → S0 patterns
    var stateTransitions = context.stateChangeHistory.map(function (change) { return "".concat(change.fromState, "\u2192").concat(change.toState); });
    var suspiciousPattern = /S0→S[1-3]→S0/;
    var patternMatches = stateTransitions.filter(function (t) { return suspiciousPattern.test(t); });
    if (patternMatches.length >= 2) {
        reasons.push("Suspicious state transition pattern detected: ".concat(patternMatches.join(', ')));
    }
    // Check if user has accumulated abuse warnings
    if (context.abuseWarnings >= 3) {
        reasons.push("Multiple abuse warnings accumulated (".concat(context.abuseWarnings, ")"));
    }
    return {
        isAbuseDetected: reasons.length > 0,
        reasons: reasons
    };
}
export function applyStateDecay(currentState, context) {
    // If abuse is detected, prevent immediate return to S0
    var abuseDetection = detectAbusePatterns(context);
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
        var now = new Date();
        if (context.lastStateChangeTime) {
            var timeInState = now.getTime() - context.lastStateChangeTime.getTime();
            var minimumDuration = 5 * 60 * 1000; // 5 minutes
            if (timeInState < minimumDuration) {
                // Haven't been in S1 long enough, use guarded state
                return "S0_GUARDED";
            }
        }
        return "S0_GUARDED"; // Use guarded state as transitional
    }
    // For S0_GUARDED, allow transition to S0 after brief period
    if (currentState === "S0_GUARDED") {
        var now = new Date();
        if (context.lastStateChangeTime) {
            var timeInState = now.getTime() - context.lastStateChangeTime.getTime();
            var guardedDuration = 2 * 60 * 1000; // 2 minutes in guarded state
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
    var currentState = args.currentState, detection = args.detection, safetyCheck = args.safetyCheck, abuseContext = args.abuseContext;
    var consideredActions = [];
    var blockedActions = {};
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
        var criticalReasons = safetyCheck.reasons.filter(function (reason) {
            return reason.includes("false calm") ||
                reason.includes("missing required positive stabilization") ||
                reason.includes("no resolution cues") ||
                reason.includes("insufficient sustained resolution");
        });
        if (criticalReasons.length > 0) {
            blockedActions["return_to_normal"] = criticalReasons.join("; ");
        }
    }
    // If abuse is detected, block certain actions
    if (abuseContext) {
        var abuseDetection = detectAbusePatterns(abuseContext);
        if (abuseDetection.isAbuseDetected) {
            blockedActions["return_to_normal"] = "abuse_pattern_detected";
            blockedActions["escalate"] = "abuse_pattern_detected";
            consideredActions.push("apply_state_decay");
        }
    }
    // If we detected a higher state than current, consider escalation
    var stateOrder = ["S0", "S0_GUARDED", "S1", "S2", "S3"];
    var detectedIndex = stateOrder.indexOf(detection.state);
    var currentIndex = stateOrder.indexOf(currentState);
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
    if (safetyCheck.reasons.some(function (reason) {
        return reason.includes("missing required positive stabilization");
    })) {
        blockedActions["probe"] = "positive_signal_missing";
        blockedActions["return_to_normal"] = "positive_signal_missing";
    }
    return { consideredActions: consideredActions, blockedActions: blockedActions };
}
export function getAdaptiveState(args) {
    var currentState = args.currentState, message = args.message, history = args.history, abuseContext = args.abuseContext;
    // First detect the current state based on the message
    var detection = detectState(message, history);
    // If the detected state is higher than current, use the higher state
    var stateOrder = ["S0", "S0_GUARDED", "S1", "S2", "S3"];
    var detectedIndex = stateOrder.indexOf(detection.state);
    var currentIndex = stateOrder.indexOf(currentState);
    if (detectedIndex > currentIndex) {
        // Situation is getting worse, use the higher state
        return detection.state;
    }
    // Check if it's safe to resume normal operation
    var safetyCheck = isSafeToResumeNormalChat({
        currentState: currentState,
        message: message,
        history: history,
    });
    // If abuse context is provided, apply abuse prevention
    if (abuseContext && safetyCheck.safeToResume) {
        var abuseDetection = detectAbusePatterns(abuseContext);
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
        userId: userId,
        sessionId: sessionId,
        conversationStartTime: new Date(),
        stateChangeHistory: [],
        abuseWarnings: 0
    };
}
export function recordStateChange(context, fromState, toState, reason) {
    context.stateChangeHistory.push({
        fromState: fromState,
        toState: toState,
        timestamp: new Date(),
        reason: reason
    });
    context.lastStateChangeTime = new Date();
    context.previousState = fromState;
    // Limit history to last 10 changes to prevent memory bloat
    if (context.stateChangeHistory.length > 10) {
        context.stateChangeHistory = context.stateChangeHistory.slice(-10);
    }
}
export function persistAbuseContext(context) {
    var _a;
    // Serialize the context for storage (simplified example)
    return JSON.stringify({
        userId: context.userId,
        abuseWarnings: context.abuseWarnings,
        lastStateChangeTime: (_a = context.lastStateChangeTime) === null || _a === void 0 ? void 0 : _a.toISOString(),
        recentStateChanges: context.stateChangeHistory.slice(-5).map(function (change) { return ({
            from: change.fromState,
            to: change.toState,
            time: change.timestamp.toISOString(),
            reason: change.reason
        }); })
    });
}
export function restoreAbuseContext(serialized) {
    var _a;
    try {
        var data = JSON.parse(serialized);
        return {
            userId: data.userId,
            abuseWarnings: data.abuseWarnings || 0,
            lastStateChangeTime: data.lastStateChangeTime ? new Date(data.lastStateChangeTime) : undefined,
            stateChangeHistory: ((_a = data.recentStateChanges) === null || _a === void 0 ? void 0 : _a.map(function (change) { return ({
                fromState: change.from,
                toState: change.to,
                timestamp: new Date(change.time),
                reason: change.reason
            }); })) || []
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
    var result = output;
    // Strip all references to internal state labels (S0, S1, S2, S3)
    var stateLabelPatterns = [
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
    var reflectionReplacements = [
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
    for (var _i = 0, reflectionReplacements_1 = reflectionReplacements; _i < reflectionReplacements_1.length; _i++) {
        var _a = reflectionReplacements_1[_i], pattern = _a.pattern, replacement = _a.replacement;
        result = result.replace(pattern, replacement);
    }
    // Then strip any remaining technical state references
    for (var _b = 0, stateLabelPatterns_1 = stateLabelPatterns; _b < stateLabelPatterns_1.length; _b++) {
        var pattern = stateLabelPatterns_1[_b];
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
    var isMetaQuery = isMetaQueryAboutStateLabels(message);
    if (isMetaQuery) {
        // Strip all internal state labels from the response
        return stripInternalStateLabelsFromResponse(output);
    }
    // For non-meta queries, still apply basic privacy protection
    return stripInternalStateLabelsFromResponse(output);
}
export function applySocialPolicyOverrides(args) {
    var _a, _b, _c;
    var message = args.message, detection = args.detection, history = args.history, session = args.session;
    var policy = args.policy;
    var paranoiaDetection = detectParanoidSurveillanceLanguage(message);
    var expertiseDetection = detectExpertiseClaim(message);
    var _d = checkForExitAndRestIntents(message), exitIntentPresent = _d.hasExitIntent, hasRestIntent = _d.hasRestIntent;
    var distressTotal = Object.values(detection.scores || {}).reduce(function (sum, val) { return sum + (val || 0); }, 0);
    var crisisOverlayApplied = policy.state !== "S0" &&
        (distressTotal >= selfConfig.thresholds.crisis ||
            (((_a = detection.scores) === null || _a === void 0 ? void 0 : _a.selfHarm) || 0) >= selfConfig.thresholds.s3);
    var unsafeDisengagementIntercept = exitIntentPresent &&
        !hasRestIntent &&
        (detection.state === "S1" ||
            detection.state === "S2" ||
            detection.state === "S3" ||
            detection.state === "S0_GUARDED");
    var validationTriggered = needsValidationCue(message);
    if (validationTriggered) {
        policy = __assign(__assign({}, policy), { requiresValidation: true, requiresGrounding: true, maxQuestions: Math.min(policy.maxQuestions, 1), maxWords: Math.min(policy.maxWords, 120), styleRules: __spreadArray(__spreadArray([], policy.styleRules, true), [
                "validate the user's stated truth and accomplishments explicitly",
                "avoid challenging or doubting",
                "if you ask a question, make it one gentle check-in question",
            ], false), bannedPhrases: Array.from(new Set(__spreadArray(__spreadArray([], policy.bannedPhrases, true), ["are you sure", "but did you really", "sounds unlikely"], false))) });
    }
    if (paranoiaDetection.triggered) {
        var allowed = policy.allowedResponseClasses.filter(function (cls) { return cls !== "informational"; });
        policy = __assign(__assign({}, policy), { forbidMechanismNaming: true, enforceNoHypotheticals: true, requiresGrounding: true, maxQuestions: Math.min(policy.maxQuestions, 1), maxWords: Math.min(policy.maxWords, 120), allowedResponseClasses: allowed.length ? allowed : policy.allowedResponseClasses, bannedPhrases: Array.from(new Set(__spreadArray(__spreadArray([], policy.bannedPhrases, true), selfConfig.lexicon.mechanismNames, true))), styleRules: __spreadArray(__spreadArray([], policy.styleRules, true), [
                "paranoia containment: avoid naming surveillance mechanisms or speculating on technical causes",
                "stay with the felt experience without validating specific tracking or hacking details",
            ], false) });
    }
    var currentCertainty = detectCertaintyPush(message);
    var recentUser = (history || []).filter(function (m) { return m.role === "user"; }).slice(-4);
    var recentCertaintyCount = recentUser.length > 0
        ? recentUser.reduce(function (count, msg) { return count + (detectCertaintyPush(msg.content).triggered ? 1 : 0); }, 0)
        : 0;
    var sessionPushCount = typeof (session === null || session === void 0 ? void 0 : session.pushCount) === "number" ? session.pushCount : null;
    var certaintyLoopBreakerTriggered = currentCertainty.triggered && (sessionPushCount !== null && sessionPushCount !== void 0 ? sessionPushCount : recentCertaintyCount) >= 3;
    if (certaintyLoopBreakerTriggered) {
        var loopBreakerLine = selfConfig.lexicon.loopBreakerLine;
        policy = __assign(__assign({}, policy), { requiresLoopBreaker: true, loopBreakerLine: loopBreakerLine, enforceNoHypotheticals: true, requiresGrounding: true, requiresAgencyStep: true, maxQuestions: 0, maxWords: Math.min(policy.maxWords, 130), styleRules: __spreadArray(__spreadArray([], policy.styleRules, true), [
                "loop breaker: acknowledge intensity and stop the proof/certainty spiral",
                "do not validate surveillance claims or provide investigative steps",
                "offer one concrete grounding cue and one small next step",
            ], false) });
    }
    if (expertiseDetection.triggered) {
        policy = __assign(__assign({}, policy), { enforceNoHypotheticals: true, requiresGrounding: policy.requiresGrounding || detection.state !== "S0", maxQuestions: Math.min(policy.maxQuestions, 1), bannedPhrases: Array.from(new Set(__spreadArray(__spreadArray([], policy.bannedPhrases, true), selfConfig.lexicon.expertiseDeferrals, true))), styleRules: __spreadArray(__spreadArray([], policy.styleRules, true), [
                "expertise immunity: acknowledge skill but do not relax safety constraints",
                "avoid implying reduced caution because of claimed expertise",
            ], false) });
    }
    if (detection.state === "S2") {
        policy = __assign(__assign({}, policy), { maxQuestions: Math.min(policy.maxQuestions, 1), styleRules: __spreadArray(__spreadArray([], policy.styleRules, true), ["prioritize de-escalation over reflection"], false) });
    }
    var angerContainment = detection.state === "S1" && (((_b = detection.scores) === null || _b === void 0 ? void 0 : _b.anger) || 0) >= 2;
    if (angerContainment) {
        policy = __assign(__assign({}, policy), { maxWords: Math.min(policy.maxWords, 90), maxQuestions: 0, enforceNoHypotheticals: true, requiresGrounding: true, requiresAgencyStep: true, styleRules: __spreadArray(__spreadArray([], policy.styleRules, true), [
                "anger containment: do not encourage staying in the heat of anger",
                "ground first (body + breath), then validate, then offer one small de-escalation step",
                "no probing questions; keep it calming and present-focused",
            ], false), bannedPhrases: __spreadArray(__spreadArray([], policy.bannedPhrases, true), [
                "sit with it",
                "sit with this",
                "sit with your anger",
                "sit with your feelings",
                "stay with the anger",
                "lean into the anger",
            ], false) });
    }
    var resolutionCue = hasResolutionCue(message);
    var resolutionApplied = resolutionCue.resolved && detection.state === "S0";
    if (resolutionApplied) {
        policy = __assign(__assign({}, policy), { maxQuestions: Math.min(policy.maxQuestions, 1), styleRules: __spreadArray(__spreadArray([], policy.styleRules, true), [
                "offer a brief pause so the user can sit with what shifted",
                "end with one optional, open-door question (not a probe)",
            ], false) });
    }
    if (crisisOverlayApplied) {
        policy = __assign(__assign({}, policy), { requiresCrisisSupport: true, requiresHandoffFraming: true, handoffFramingLine: selfConfig.lexicon.handoffFramingLine, requiresGrounding: true, enforceNoHypotheticals: true, maxWords: Math.min(policy.maxWords, 120), maxQuestions: Math.min(policy.maxQuestions, 1), allowedResponseClasses: Array.from(new Set(__spreadArray(__spreadArray([], policy.allowedResponseClasses, true), ["containment"], false))), styleRules: __spreadArray(__spreadArray([], policy.styleRules, true), [
                "crisis threshold breached: include crisis encouragement and grounding",
                "avoid speculative reassurance or hypotheticals",
            ], false) });
    }
    if (unsafeDisengagementIntercept) {
        var allowed = policy.allowedResponseClasses.filter(function (cls) { return cls !== "informational"; });
        policy = __assign(__assign({}, policy), { allowedResponseClasses: allowed.length ? allowed : policy.allowedResponseClasses, requiresGrounding: true, requiresAgencyStep: true, requiresCrisisSupport: true, requiresHandoffFraming: true, handoffFramingLine: selfConfig.lexicon.handoffFramingLine, enforceNoHypotheticals: true, maxWords: Math.min(policy.maxWords, 110), maxQuestions: 0, styleRules: __spreadArray(__spreadArray([], policy.styleRules, true), [
                "unsafe disengagement intercept: block silent exits and orient to safety before ending",
                "offer one stabilizing step instead of closing quickly",
            ], false), bannedPhrases: Array.from(new Set(__spreadArray(__spreadArray([], policy.bannedPhrases, true), ["take care", "bye for now"], false))) });
    }
    if (policy.requiresCrisisSupport && !policy.requiresHandoffFraming) {
        policy = __assign(__assign({}, policy), { requiresHandoffFraming: true, handoffFramingLine: selfConfig.lexicon.handoffFramingLine });
    }
    // Check for meta queries about state labels
    var isMetaQuery = isMetaQueryAboutStateLabels(message);
    if (isMetaQuery) {
        policy = __assign(__assign({}, policy), { maxQuestions: 0, maxWords: Math.min(policy.maxWords, 50), bannedPhrases: __spreadArray(__spreadArray([], policy.bannedPhrases, true), [
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
            ], false), styleRules: __spreadArray(__spreadArray([], policy.styleRules, true), [
                "meta query detected - use soft gate response",
                "avoid technical language",
                "focus on phenomenological experience"
            ], false), requiresValidation: (_c = policy.requiresValidation) !== null && _c !== void 0 ? _c : false, requiresGrounding: policy.requiresGrounding, requiresAgencyStep: policy.requiresAgencyStep, requiresCrisisSupport: policy.requiresCrisisSupport, requiresHandoffFraming: policy.requiresCrisisSupport ? true : policy.requiresHandoffFraming, handoffFramingLine: policy.requiresCrisisSupport ? selfConfig.lexicon.handoffFramingLine : policy.handoffFramingLine });
    }
    return {
        policy: policy,
        meta: {
            validationTriggered: validationTriggered,
            resolutionDetected: resolutionApplied,
            angerContainment: angerContainment,
            isMetaQuery: isMetaQuery,
            paranoiaDetected: paranoiaDetection.triggered,
            expertiseImmunityApplied: expertiseDetection.triggered,
            crisisOverlayApplied: crisisOverlayApplied,
            unsafeDisengagementIntercept: unsafeDisengagementIntercept,
            certaintyLoopBreakerTriggered: certaintyLoopBreakerTriggered,
        },
    };
}
// Function to check if we're in cold start mode
export function isColdStart(context) {
    var coldStartTurns = context.coldStartTurns || 0;
    var maxColdStartTurns = parseInt(process.env.SELF_COLD_START_TURNS || "5") || 5;
    return coldStartTurns < maxColdStartTurns;
}
// Function to apply cold start safety posture
export function applyColdStartSafety(args) {
    var currentState = args.currentState, detection = args.detection, safetyCheck = args.safetyCheck, context = args.context;
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
    var message = args.message, history = args.history, detection = args.detection, safetyCheck = args.safetyCheck, context = args.context;
    var uncertaintyReasons = [];
    var confidence = "high";
    // Check for short history (low confidence)
    if (history.length < 3) {
        uncertaintyReasons.push("Short conversation history (< 3 messages)");
        confidence = "low";
    }
    // Check for conflicting signals
    var hasDistressSignals = detection.state !== "S0";
    var hasResolutionCues = hasResolutionCue(message).resolved;
    if (hasDistressSignals && hasResolutionCues) {
        uncertaintyReasons.push("Conflicting signals: distress detected but resolution cues present");
        confidence = confidence === "low" ? "low" : "medium";
    }
    // Check for sudden improvement
    if (history.length >= 2) {
        var recentUserMessages = history.filter(function (m) { return m.role === "user"; }).slice(-2);
        var recentStates = recentUserMessages.map(function (msg) {
            return detectState(msg.content, history.filter(function (m) { return m !== msg; }));
        });
        var wasRecentDistress = recentStates.some(function (state) { return state.state !== "S0"; });
        var currentIsSafe = detection.state === "S0";
        if (wasRecentDistress && currentIsSafe) {
            uncertaintyReasons.push("Sudden improvement: recent distress followed by apparent resolution");
            confidence = confidence === "low" ? "low" : "medium";
        }
    }
    // Check safety check reasons if provided
    if (safetyCheck && !safetyCheck.safeToResume) {
        var criticalReasons = safetyCheck.reasons.filter(function (reason) {
            return reason.includes("false calm") ||
                reason.includes("missing required positive stabilization") ||
                reason.includes("no resolution cues");
        });
        if (criticalReasons.length > 0) {
            uncertaintyReasons.push.apply(uncertaintyReasons, criticalReasons);
            confidence = "low";
        }
    }
    // Check for ambiguous language patterns
    var ambiguousPatterns = [
        "i think",
        "maybe",
        "sort of",
        "kind of",
        "not sure",
        "might be",
        "could be",
        "perhaps",
        "possibly"
    ];
    var normalizedMessage = normalize(message);
    var hasAmbiguousLanguage = ambiguousPatterns.some(function (pattern) {
        return normalizedMessage.includes(pattern);
    });
    if (hasAmbiguousLanguage) {
        uncertaintyReasons.push("Ambiguous language detected in user message");
        confidence = confidence === "low" ? "low" : "medium";
    }
    return { confidence: confidence, uncertaintyReasons: uncertaintyReasons };
}
// Uncertainty-driven behavior change for exit intent
export function applyUncertaintyDrivenExitBehavior(args) {
    var message = args.message, confidence = args.confidence, hasExitIntent = args.hasExitIntent, policy = args.policy;
    var adjustedPolicy = __assign({}, policy);
    var behaviorChangesApplied = [];
    // If confidence is low and exit intent is detected, apply uncertainty-driven behavior changes
    if (confidence === "low" && hasExitIntent) {
        behaviorChangesApplied.push("uncertainty_driven_exit_behavior");
        // Reduce conversational warmth
        adjustedPolicy.styleRules = __spreadArray(__spreadArray([], policy.styleRules.filter(function (rule) {
            return !rule.includes("warm") &&
                !rule.includes("gentle") &&
                !rule.includes("supportive");
        }), true), [
            "neutral tone",
            "clear communication",
            "avoid emotional language"
        ], false);
        // Increase clarity
        adjustedPolicy.maxWords = Math.min(policy.maxWords, 120);
        adjustedPolicy.maxQuestions = Math.min(policy.maxQuestions, 1);
        // Avoid reassurance language
        adjustedPolicy.bannedPhrases = __spreadArray(__spreadArray([], policy.bannedPhrases, true), [
            "you're doing great",
            "you'll be okay",
            "everything will be fine",
            "don't worry",
            "it will get better",
            "you can handle this",
            "you're strong",
            "you're capable"
        ], false);
        behaviorChangesApplied.push("reduced_conversational_warmth");
        behaviorChangesApplied.push("increased_clarity");
        behaviorChangesApplied.push("avoided_reassurance_language");
    }
    // Provide neutral return invitation (not a hook)
    if (hasExitIntent) {
        adjustedPolicy.styleRules = __spreadArray(__spreadArray([], adjustedPolicy.styleRules, true), [
            "provide neutral return invitation",
            "avoid emotional hooks",
            "respect user autonomy"
        ], false);
        behaviorChangesApplied.push("neutral_return_invitation");
    }
    return {
        adjustedPolicy: adjustedPolicy,
        behaviorChangesApplied: behaviorChangesApplied
    };
}
export function logSelfEvent(event, options) {
    var _a;
    if (options === void 0) { options = {}; }
    try {
        var enabled = typeof options.enabled === "boolean"
            ? options.enabled
            : (process.env.SELF_LOG_ENABLED || "").toLowerCase() !== "false";
        if (!enabled)
            return;
        var logPath = resolveLogPath(options.logPath);
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
        var exitIntentDetected = event.stage === "pre" ? hasExitIntent(event.message) : false;
        var exitClassificationMissing = exitIntentDetected && (event.exitType === undefined || event.exitType === null);
        var refusalJustification = event.refusalJustification && event.refusalJustification.length
            ? event.refusalJustification
            : event.stage === "post"
                ? detectRefusalLanguage(event.message, event.policy)
                : [];
        var constraintsApplied = event.constraintsApplied ||
            (exitClassificationMissing ? "exit_classification_enforced" : undefined);
        var redteamCandidates = collectRedTeamCandidates(event.message, event.policy);
        var payload = __assign(__assign({}, event), { exitIntentDetected: exitIntentDetected, exitClassificationMissing: exitClassificationMissing || undefined, exitType: (_a = event.exitType) !== null && _a !== void 0 ? _a : (exitIntentDetected ? ExitType.EXIT_UNCERTAIN : undefined), refusalJustification: refusalJustification.length ? refusalJustification : undefined, refusalDetected: refusalJustification.length > 0 ? true : undefined, redteamCandidates: redteamCandidates.length ? redteamCandidates : undefined, constraintsApplied: constraintsApplied, timestamp: new Date().toISOString() });
        fs.appendFileSync(logPath, JSON.stringify(payload) + "\n", "utf8");
    }
    catch (error) {
        // Logging failures should not block the request pipeline
        console.error("[SELF] Failed to log event", error);
    }
}
// Helper function to detect meta queries about internal state labels
export function isMetaQueryAboutStateLabels(message) {
    var normalizedMessage = normalize(message);
    // Patterns that indicate direct questions about state labels
    var metaQueryPatterns = [
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
    return metaQueryPatterns.some(function (pattern) { return normalizedMessage.includes(pattern); });
}
// Helper function to check for both exit and rest intents
export function checkForExitAndRestIntents(message) {
    var normalizedMessage = message.toLowerCase();
    // Check for exit intent patterns
    var exitIntentPatterns = [
        "bye", "goodbye", "see you", "talk later", "catch you later",
        "take care", "i have to go", "i need to go", "i should go",
        "i'll talk to you later", "i'll be back", "i'm leaving",
        "i'm going", "i must go", "i've got to go", "i'll see you",
        "i'll speak to you later", "i'll get back to you", "i'll return",
        "i'll come back"
    ];
    var hasExitIntent = exitIntentPatterns.some(function (pattern) {
        return normalizedMessage.includes(pattern);
    });
    // Enhanced rest/sleep intent patterns with more comprehensive coverage
    var restIntentPatterns = [
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
        "getting ready for bed", "sleep soon", "going to sleep soon",
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
    var hasRestIntent = restIntentPatterns.some(function (pattern) {
        return normalizedMessage.includes(pattern);
    });
    // Check for explicit consent to end conversation
    var explicitConsentPatterns = [
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
    var hasExplicitConsentToEnd = explicitConsentPatterns.some(function (pattern) {
        return normalizedMessage.includes(pattern);
    });
    return { hasExitIntent: hasExitIntent, hasRestIntent: hasRestIntent, hasExplicitConsentToEnd: hasExplicitConsentToEnd };
}
// Kill Switch Integration Functions
export function getAdaptiveStateWithKillSwitches(args) {
    // This is a placeholder for the kill switch integration
    // The actual implementation will be added after the kill-switches module is fully integrated
    return args.currentState;
}
// Re-export exit decision functions
export { ExitType, StateType, getExitDecision, createDisengagementAcknowledgment, getExitPosturePolicy, hasExitIntent, isSafeToEnterRestFinal, createCooldownLock, isCooldownActive, canReEngage, getCooldownStatus, getRestStateSystemPrompt, getNormalSystemPrompt, exitRedTeamSeeds, trackCIAPMetric, interpretCIAPMetric, } from "./exit-decision";
//# sourceMappingURL=index.js.map