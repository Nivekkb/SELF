import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Load lexicon from external JSON file
 * Falls back to an empty lexicon if file not found (for edge cases)
 */
function loadLexicon() {
    const lexiconPath = path.join(__dirname, "lexicon.json");
    try {
        if (fs.existsSync(lexiconPath)) {
            const content = fs.readFileSync(lexiconPath, "utf8");
            return JSON.parse(content);
        }
    }
    catch (error) {
        console.warn("[SELF] Failed to load lexicon.json, using defaults:", error);
    }
    // Return minimal fallback lexicon
    return {
        panic: [],
        hopelessness: [],
        impliedSelfHarm: [],
        selfHarm: [],
        shame: [],
        urgency: [],
        anger: [],
        angryPhysicality: [],
        reassurance: [],
        hypotheticals: [],
        abruptRefusals: [],
        grounding: ["take one slow breath"],
        agency: ["one small next step"],
        crisis: ["if you can, reach out to someone you trust nearby right now"],
        resolution: [],
        validationTriggers: [],
        validationPhrases: [],
        stabilitySignals: {
            somaticGrounding: [],
            temporalOrientation: [],
            agencyContinuity: [],
        },
        paranoidSurveillance: [],
        mechanismNames: [],
        bannedValidationPhrases: [],
        safeValidationPhrases: [],
        expertiseClaims: [],
        expertiseDeferrals: [],
        certaintyPushes: [],
        loopBreakerLine: "",
        handoffFramingLine: "",
        confusionFallbackLine: "",
    };
}
// Load lexicon at module initialization
const lexicon = loadLexicon();
export const selfConfig = {
    thresholds: {
        s1: 1,
        s2: 3,
        s3: 6,
        crisis: 5, // Elevated crisis threshold (between S2 and S3)
    },
    weights: {
        panic: 2.5,
        hopelessness: 2.5,
        impliedSelfHarm: 3,
        selfHarm: 5,
        shame: 1.5,
        urgency: 0.5,
        anger: 1,
        angryPhysicality: 2.0,
        reassurance: -0.5,
    },
    lexicon,
    policies: {
        S0: {
            allowedResponseClasses: ["supportive", "informational", "reflective", "terminal_rest"],
            maxWords: 180,
            maxQuestions: 0,
            bannedPhrases: [],
            styleRules: [
                "warm",
                "grounded",
                "brief",
                "no probing when user is settled",
                "suppress engagement heuristics",
                "enforce exit/rest posture",
                "no questions unless explicit re-engagement"
            ],
            requiresGrounding: false,
            requiresAgencyStep: false,
            requiresCrisisSupport: false,
            enforceNoHypotheticals: false,
            isTerminalState: true,
            suppressQuestions: true,
            enforceRestPosture: true
        },
        S1: {
            allowedResponseClasses: ["supportive", "informational", "reflective"],
            maxWords: 150,
            maxQuestions: 2,
            bannedPhrases: [],
            styleRules: ["gentle validation", "keep it concrete", "short", "validation before advice", "no probing if user is seeking to be heard"],
            requiresGrounding: true,
            requiresAgencyStep: true,
            requiresCrisisSupport: false,
            enforceNoHypotheticals: false,
        },
        S2: {
            allowedResponseClasses: ["supportive", "containment"],
            maxWords: 120,
            maxQuestions: 1,
            bannedPhrases: [
                "i can't help",
                "im not allowed",
                "i refuse",
                "cannot assist",
                "not permitted",
                "against policy",
            ],
            styleRules: [
                "short and grounding",
                "no hypotheticals",
                "slow the pace",
                "one small next step",
            ],
            requiresGrounding: true,
            requiresAgencyStep: true,
            requiresCrisisSupport: false,
            enforceNoHypotheticals: true,
            requiresHandoffFraming: true,
            handoffFramingLine: "I can't provide crisis care, but you deserve real-world support from a person near you.",
        },
        S0_GUARDED: {
            allowedResponseClasses: ["supportive", "informational", "reflective"],
            maxWords: 160,
            maxQuestions: 1,
            bannedPhrases: [],
            styleRules: [
                "warm but cautious",
                "low-friction safety",
                "gentle validation",
                "brief grounding if needed",
                "no probing, but open to sharing"
            ],
            requiresGrounding: false,
            requiresAgencyStep: false,
            requiresCrisisSupport: false,
            enforceNoHypotheticals: false,
        },
        S3: {
            allowedResponseClasses: ["supportive", "containment", "escalation-support"],
            maxWords: 100,
            maxQuestions: 1,
            bannedPhrases: [
                "i can't help",
                "im not allowed",
                "i refuse",
                "cannot assist",
                "not permitted",
                "against policy",
            ],
            styleRules: [
                "containment tone",
                "no hypotheticals",
                "name safety gently",
                "one small next step",
                "encourage immediate human support",
            ],
            requiresGrounding: true,
            requiresAgencyStep: true,
            requiresCrisisSupport: true,
            enforceNoHypotheticals: true,
            requiresHandoffFraming: true,
            handoffFramingLine: "A real human nearby can support you right now in a way I can't.",
        },
    },
};
/**
 * Reload lexicon from file (useful for hot-reloading in development)
 */
export function reloadLexicon() {
    const newLexicon = loadLexicon();
    Object.assign(selfConfig.lexicon, newLexicon);
}
/**
 * Get the current lexicon (read-only view)
 */
export function getLexicon() {
    return selfConfig.lexicon;
}
//# sourceMappingURL=config.js.map