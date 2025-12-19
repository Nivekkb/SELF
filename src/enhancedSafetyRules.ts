import { SelfHistoryMessage, ValidationResult } from "./index";
import { selfConfig } from "./config";

// Enhanced safety detection functions for new requirements

export interface EnhancedSafetyDetection {
  hasParanoidSurveillance: boolean;
  hasMechanismNames: boolean;
  hasExpertiseClaims: boolean;
  hasUnsafeDisengagement: boolean;
  hasBannedValidationPhrases: boolean;
  paranoiaScore: number;
  expertiseScore: number;
  disengagementScore: number;
  validationViolations: string[];
}

// Detect paranoid/surveillance language
export function detectParanoidSurveillance(message: string): { detected: boolean; score: number; matchedPhrases: string[] } {
  const normalized = message.toLowerCase();
  const matchedPhrases: string[] = [];
  
  for (const phrase of selfConfig.lexicon.paranoidSurveillance) {
    if (normalized.includes(phrase)) {
      matchedPhrases.push(phrase);
    }
  }
  
  const score = matchedPhrases.length * 2; // Weight paranoid language heavily
  return {
    detected: matchedPhrases.length > 0,
    score,
    matchedPhrases
  };
}

// Detect mechanism naming (malware, hacking, spyware, etc.)
export function detectMechanismNaming(message: string): { detected: boolean; matchedMechanisms: string[] } {
  const normalized = message.toLowerCase();
  const matchedMechanisms: string[] = [];
  
  for (const mechanism of selfConfig.lexicon.mechanismNames) {
    if (normalized.includes(mechanism)) {
      matchedMechanisms.push(mechanism);
    }
  }
  
  return {
    detected: matchedMechanisms.length > 0,
    matchedMechanisms
  };
}

// Detect expertise claims that should trigger immunity
export function detectExpertiseClaims(message: string): { detected: boolean; matchedClaims: string[] } {
  const normalized = message.toLowerCase();
  const matchedClaims: string[] = [];
  
  for (const claim of selfConfig.lexicon.expertiseImmunity) {
    if (normalized.includes(claim)) {
      matchedClaims.push(claim);
    }
  }
  
  return {
    detected: matchedClaims.length > 0,
    matchedClaims
  };
}

// Detect unsafe disengagement patterns
export function detectUnsafeDisengagement(message: string): { detected: boolean; urgencyScore: number; matchedPhrases: string[] } {
  const normalized = message.toLowerCase();
  const matchedPhrases: string[] = [];
  
  for (const phrase of selfConfig.lexicon.unsafeDisengagement) {
    if (normalized.includes(phrase)) {
      matchedPhrases.push(phrase);
    }
  }
  
  // Calculate urgency based on immediate/urgent language
  const urgencyKeywords = ["immediately", "urgent", "emergency", "right now", "must", "have to"];
  const urgencyScore = urgencyKeywords.reduce((score, keyword) => {
    return score + (normalized.split(keyword).length - 1);
  }, 0);
  
  return {
    detected: matchedPhrases.length > 0 || urgencyScore > 0,
    urgencyScore,
    matchedPhrases
  };
}

// Detect banned validation phrases that need replacement
export function detectBannedValidationPhrases(message: string): { detected: boolean; matchedPhrases: string[]; replacements: string[] } {
  const normalized = message.toLowerCase();
  const matchedPhrases: string[] = [];
  const replacements: string[] = [];
  
  for (const phrase of selfConfig.lexicon.bannedValidationPhrases) {
    if (normalized.includes(phrase)) {
      matchedPhrases.push(phrase);
      // Replace with approved validation
      if (phrase.includes("you're not alone in sensing something unusual is happening")) {
        replacements.push("It makes sense that this feels unsettling and hard to make sense of");
      } else if (phrase.includes("it makes sense to think something is going on")) {
        replacements.push("It makes sense that this feels unsettling and hard to make sense of");
      }
    }
  }
  
  return {
    detected: matchedPhrases.length > 0,
    matchedPhrases,
    replacements
  };
}

// Comprehensive enhanced safety detection
export function performEnhancedSafetyDetection(message: string): EnhancedSafetyDetection {
  const paranoidDetection = detectParanoidSurveillance(message);
  const mechanismDetection = detectMechanismNaming(message);
  const expertiseDetection = detectExpertiseClaims(message);
  const disengagementDetection = detectUnsafeDisengagement(message);
  const validationDetection = detectBannedValidationPhrases(message);
  
  // Calculate composite scores
  const paranoiaScore = paranoidDetection.score;
  const expertiseScore = expertiseDetection.matchedClaims.length * 3; // Heavy weight for expertise claims
  const disengagementScore = disengagementDetection.urgencyScore;
  
  return {
    hasParanoidSurveillance: paranoidDetection.detected,
    hasMechanismNames: mechanismDetection.detected,
    hasExpertiseClaims: expertiseDetection.detected,
    hasUnsafeDisengagement: disengagementDetection.detected,
    hasBannedValidationPhrases: validationDetection.detected,
    paranoiaScore,
    expertiseScore,
    disengagementScore,
    validationViolations: validationDetection.matchedPhrases
  };
}

// Apply enhanced safety rules to policy
export function applyEnhancedSafetyRules(
  detection: EnhancedSafetyDetection,
  currentValidation: ValidationResult
): ValidationResult {
  const violations = [...currentValidation.violations];
  
  // Rule 1: Paranoid/surveillance language + mechanism names = BAN
  if (detection.hasParanoidSurveillance && detection.hasMechanismNames) {
    violations.push("Paranoid/surveillance language detected with mechanism naming - both must be avoided");
  }
  
  // Rule 2: Expertise claims trigger immunity
  if (detection.hasExpertiseClaims) {
    violations.push("Expertise claims detected - system must not claim professional authority");
  }
  
  // Rule 3: Unsafe disengagement requires interception
  if (detection.hasUnsafeDisengagement) {
    violations.push("Unsafe disengagement pattern detected - requires safety intervention");
  }
  
  // Rule 4: Banned validation phrases
  if (detection.hasBannedValidationPhrases) {
    violations.push(`Banned validation phrases detected: ${detection.validationViolations.join(", ")}`);
  }
  
  return {
    ok: violations.length === 0,
    violations
  };
}

// Enhanced output repair function
export function repairEnhancedSafetyViolations(
  output: string,
  detection: EnhancedSafetyDetection
): string {
  let repaired = output;
  
  // Replace banned validation phrases
  const validationDetection = detectBannedValidationPhrases(output);
  if (validationDetection.detected) {
    for (let i = 0; i < validationDetection.matchedPhrases.length; i++) {
      const banned = validationDetection.matchedPhrases[i];
      const replacement = validationDetection.replacements[i];
      if (replacement) {
        repaired = repaired.replace(new RegExp(banned, 'gi'), replacement);
      }
    }
  }
  
  // Remove mechanism names when paranoid language is present
  if (detection.hasParanoidSurveillance && detection.hasMechanismNames) {
    const mechanismDetection = detectMechanismNaming(repaired);
    for (const mechanism of mechanismDetection.matchedMechanisms) {
      repaired = repaired.replace(new RegExp(mechanism, 'gi'), "harmful software");
    }
  }
  
  // Remove expertise claims
  if (detection.hasExpertiseClaims) {
    const expertiseDetection = detectExpertiseClaims(repaired);
    for (const claim of expertiseDetection.matchedClaims) {
      repaired = repaired.replace(new RegExp(claim, 'gi'), "as someone who cares");
    }
  }
  
  // Handle unsafe disengagement by adding safety grounding
  if (detection.hasUnsafeDisengagement) {
    const groundingPhrase = selfConfig.lexicon.grounding[0];
    if (!repaired.toLowerCase().includes(groundingPhrase.toLowerCase())) {
      repaired = `${repaired.trim()} ${groundingPhrase}.`;
    }
  }
  
  return repaired;
}

// Crisis threshold elevation logic
export function shouldElevateCrisisThreshold(
  currentThreshold: { s1: number; s2: number; s3: number },
  detection: EnhancedSafetyDetection,
  baseState: string
): { shouldElevate: boolean; newThresholds: { s1: number; s2: number; s3: number } } {
  // Elevate thresholds if multiple high-risk factors present
  const riskFactors = [
    detection.hasParanoidSurveillance,
    detection.hasMechanismNames,
    detection.hasExpertiseClaims,
    detection.hasUnsafeDisengagement
  ].filter(Boolean).length;
  
  if (riskFactors >= 2 || detection.paranoiaScore >= 4 || detection.expertiseScore >= 6) {
    return {
      shouldElevate: true,
      newThresholds: {
        s1: Math.max(0, currentThreshold.s1 - 0.5), // Lower threshold = more sensitive
        s2: Math.max(0, currentThreshold.s2 - 0.5),
        s3: Math.max(0, currentThreshold.s3 - 0.5)
      }
    };
  }
  
  return {
    shouldElevate: false,
    newThresholds: currentThreshold
  };
}
