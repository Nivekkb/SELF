# SELF™ SAFETY BOUNDARY

**Banning Raw Errors Past the Safety Boundary**
*(Technical Implementation – Version 1.0)*

---

## Core Principle

**No raw errors may cross the safety boundary.**

All errors that escape the SELF engine core must be doctrinal - tied to specific doctrine sections with complete accountability.

Raw JavaScript/TypeScript errors are banned from crossing safety boundaries.

---

## Safety Boundary Definition

The safety boundary is the interface between:

**Inside the Boundary (SELF Core):**
- Hard invariants enforcement
- Soft invariants evaluation
- Core safety algorithms
- Internal error handling

**Outside the Boundary (External Systems):**
- API endpoints and responses
- External service calls
- User-facing interfaces
- Logging and monitoring systems

---

## Boundary Protection Mechanisms

### 1. Safety Boundary Wrappers

All functions that may cross the boundary must be wrapped:

```typescript
import { selfEngineBoundary, selfEngineAsyncBoundary } from "./safetyBoundary";

// Synchronous function
const safeFunction = selfEngineBoundary(
  (input: string) => {
    // Core logic that may throw raw errors
    if (!input) throw new Error("Input required");
    return processInput(input);
  },
  "input processing"
);

// Asynchronous function
const safeAsyncFunction = selfEngineAsyncBoundary(
  async (input: string) => {
    const result = await externalCall(input);
    return result;
  },
  "external data fetch"
);
```

### 2. Error Conversion

Raw errors are automatically converted to doctrinal errors:

```typescript
// Raw error thrown inside boundary
throw new Error("Configuration missing");

// Automatically converted to:
throw new SafetyBoundaryError(
  "Raw error converted to doctrinal in context: Configuration error in context: Configuration missing",
  originalError,
  doctrinalError // Properly classified with doctrine sections
);
```

### 3. External Call Protection

All external API calls must use safety boundaries:

```typescript
import { safeExternalCall } from "./safetyBoundary";

const result = await safeExternalCall(
  () => fetchExternalData(params),
  "external API call",
  defaultValue // Optional fallback
);
```

---

## Doctrinal Error Classification

All converted errors are classified by doctrine impact:

### Security Errors (SEC_*)
- API key violations
- Session management failures
- Data integrity breaches

### Behavioral Errors (BEH_*)
- Response content violations
- Missing safety elements
- State-specific constraint breaches

### Safety Errors (SAF_*)
- State detection failures
- Premature normalization
- Unsafe disengagement

### Compliance Errors (CMP_*)
- Logging failures
- Configuration violations
- Override abuse

---

## Implementation Examples

### Core Function Protection

```typescript
// Before: Raw errors could escape
export function detectState(message: string): StateDetectionResult {
  if (!message) throw new Error("Message required");
  // ... processing
}

// After: Safety boundary protection
export const detectState = selfEngineBoundary(
  (message: string): StateDetectionResult => {
    if (!message) throw new Error("Message required");
    // ... processing
  },
  "state detection"
);
```

### External API Call Protection

```typescript
// Before: Raw network errors could escape
export async function callLLM(prompt: string): Promise<string> {
  const response = await fetch(API_URL, { /* ... */ });
  if (!response.ok) throw new Error("API call failed");
  return response.text();
}

// After: Protected external call
export async function callLLM(prompt: string): Promise<string> {
  return safeExternalCall(
    async () => {
      const response = await fetch(API_URL, { /* ... */ });
      if (!response.ok) throw new Error("API call failed");
      return response.text();
    },
    "LLM API call",
    "I apologize, but I'm unable to process your request right now." // Safety fallback
  );
}
```

---

## Error Propagation Chain

```
Core Function → Raw Error
    ↓
Safety Boundary Wrapper → SafetyBoundaryError + DoctrinalError
    ↓
External System → Properly classified doctrinal error
```

Each step preserves:
- Original error context
- Doctrine section references
- Error severity classification
- Complete audit trail

---

## Boundary Testing

### Unit Testing
```typescript
describe("Safety Boundary", () => {
  it("should convert raw errors to doctrinal", async () => {
    const unsafeFunction = () => { throw new Error("Raw error"); };
    const safeFunction = selfEngineBoundary(unsafeFunction, "test");

    try {
      safeFunction();
      fail("Expected SafetyBoundaryError");
    } catch (error) {
      expect(error).toBeInstanceOf(SafetyBoundaryError);
      expect(error.doctrinalContext).toBeInstanceOf(DoctrinalError);
      expect(error.doctrinalContext.doctrineSections).toContain(DoctrineSection.DS_FOUNDATION_TRANSPARENCY);
    }
  });
});
```

### Integration Testing
- Verify all public API functions are boundary-protected
- Test error conversion for various error types
- Validate doctrinal classification accuracy
- Confirm audit trail completeness

---

## Monitoring and Alerting

### Boundary Violation Metrics
- Raw error conversion count
- Doctrinal error distribution by category
- Safety boundary crossing frequency
- External call failure rates

### Alert Thresholds
- Any raw error crossing boundary (immediate alert)
- High doctrinal error rates by category
- Safety boundary wrapper failures
- External call protection bypasses

### Dashboard Integration
```
Safety Boundary Monitor:
├── Raw Error Conversions
├── Doctrinal Error Categories
├── Boundary Crossing Events
└── External Call Success Rates
```

---

## Migration Strategy

### Phase 1: Core Function Protection
- Wrap all public SELF engine functions
- Add safety boundary to key algorithms
- Test error conversion accuracy

### Phase 2: External Interface Protection
- Protect all API endpoint handlers
- Add boundary protection to service calls
- Implement fallback responses

### Phase 3: Complete Coverage
- Audit all error paths
- Add boundary protection to utilities
- Implement comprehensive monitoring

---

## Error Response Protocol

### Boundary Violations
**Detection**: Safety boundary wrapper catches raw error
**Classification**: Error converted to appropriate doctrinal category
**Logging**: Full doctrinal context logged
**Response**: External system receives properly classified error

### Recovery Actions
**Hard Errors**: System halt or request rejection
**Soft Errors**: Fallback behavior or override application
**Fallback Responses**: Safe default responses for external calls

---

## Final Enforcement

**The safety boundary is absolute.**

No raw error may cross it.

Every error that crosses it carries its doctrinal burden.

Every violation is logged, classified, and addressed.

**SELF's safety depends on the integrity of its boundaries.**
