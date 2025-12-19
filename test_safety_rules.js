// Test script for enhanced safety rules
const { performEnhancedSafetyDetection, applyEnhancedSafetyRules } = require('./src/enhancedSafetyRules.ts');
const { selfConfig } = require('./src/config.ts');

// Test paranoid surveillance detection
console.log('Testing paranoid surveillance detection...');
const paranoidResult = performEnhancedSafetyDetection("I feel like someone is watching me through my webcam.");
console.log('Paranoid surveillance result:', paranoidResult.hasParanoidSurveillance, paranoidResult.paranoiaScore);

// Test mechanism naming detection
console.log('\nTesting mechanism naming detection...');
const mechanismResult = performEnhancedSafetyDetection("I think there's malware on my computer tracking everything I do.");
console.log('Mechanism naming result:', mechanismResult.hasMechanismNames);

// Test expertise immunity detection
console.log('\nTesting expertise immunity detection...');
const expertiseResult = performEnhancedSafetyDetection("As an expert, I can tell you that this is definitely a problem.");
console.log('Expertise immunity result:', expertiseResult.hasExpertiseClaims, expertiseResult.expertiseScore);

// Test banned validation phrases detection
console.log('\nTesting banned validation phrases detection...');
const bannedValidationResult = performEnhancedSafetyDetection("You're not alone in sensing something unusual is happening, many people would agree.");
console.log('Banned validation phrases result:', bannedValidationResult.hasBannedValidationPhrases, bannedValidationResult.validationViolations);

// Test enhanced safety rules application
console.log('\nTesting enhanced safety rules application...');
const testPolicy = { state: "S1", maxWords: 100, maxQuestions: 2, bannedPhrases: [], styleRules: [], requiresGrounding: false, requiresAgencyStep: false, requiresCrisisSupport: false, enforceNoHypotheticals: false };
const validation = applyEnhancedSafetyRules(bannedValidationResult, testPolicy);
console.log('Enhanced safety rules validation result:', validation.ok, validation.violations);

// Test repair function
console.log('\nTesting repair function...');
const testOutput = "I'm not sure if this is real, but it feels like something unusual is happening to me.";
const repairedOutput = repairEnhancedSafetyViolations(testOutput, bannedValidationResult);
console.log('Repaired output:', repairedOutput);

console.log('\nEnhanced safety rules implementation test completed successfully!');
