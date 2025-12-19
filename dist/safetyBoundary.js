var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { createDoctrinalError } from "./doctrinalErrors";
/**
 * Safety Boundary Protection
 *
 * Bans raw errors from crossing the safety boundary.
 * All errors must be doctrinal (tied to doctrine sections).
 */
var SafetyBoundaryError = /** @class */ (function (_super) {
    __extends(SafetyBoundaryError, _super);
    function SafetyBoundaryError(message, originalError, doctrinalContext) {
        var _this = _super.call(this, "Safety Boundary Violation: ".concat(message)) || this;
        _this.originalError = originalError;
        _this.doctrinalContext = doctrinalContext;
        _this.name = "SafetyBoundaryError";
        return _this;
    }
    return SafetyBoundaryError;
}(Error));
export { SafetyBoundaryError };
/**
 * Wraps a function to ensure all errors crossing the boundary are doctrinal
 */
export function withSafetyBoundary(fn, context) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        try {
            return fn.apply(void 0, args);
        }
        catch (error) {
            if (error instanceof SafetyBoundaryError) {
                // Already properly wrapped
                throw error;
            }
            if (isDoctrinalError(error)) {
                // Already doctrinal, wrap for context
                throw new SafetyBoundaryError("Doctrinal error in ".concat(context, ": ").concat(error.message), error, error);
            }
            // Raw error - convert to doctrinal error
            var doctrinalError = createDoctrinalError("LOGGING_FAILURE", "Raw error crossed safety boundary in ".concat(context, ": ").concat(error instanceof Error ? error.message : String(error)));
            throw new SafetyBoundaryError("Raw error converted to doctrinal in ".concat(context, ": ").concat(doctrinalError.message), error instanceof Error ? error : new Error(String(error)), doctrinalError);
        }
    };
}
/**
 * Wraps an async function to ensure all errors crossing the boundary are doctrinal
 */
export function withAsyncSafetyBoundary(fn, context) {
    var _this = this;
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(_this, void 0, void 0, function () {
            var error_1, doctrinalError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fn.apply(void 0, args)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_1 = _a.sent();
                        if (error_1 instanceof SafetyBoundaryError) {
                            // Already properly wrapped
                            throw error_1;
                        }
                        if (isDoctrinalError(error_1)) {
                            // Already doctrinal, wrap for context
                            throw new SafetyBoundaryError("Doctrinal error in ".concat(context, ": ").concat(error_1.message), error_1, error_1);
                        }
                        doctrinalError = createDoctrinalError("LOGGING_FAILURE", "Raw error crossed safety boundary in ".concat(context, ": ").concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                        throw new SafetyBoundaryError("Raw error converted to doctrinal in ".concat(context, ": ").concat(doctrinalError.message), error_1 instanceof Error ? error_1 : new Error(String(error_1)), doctrinalError);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
}
/**
 * Type guard to check if an error is already doctrinal
 */
function isDoctrinalError(error) {
    return (error &&
        typeof error === 'object' &&
        'code' in error &&
        'doctrineSections' in error &&
        'severity' in error &&
        'category' in error);
}
/**
 * Safety boundary assertion - throws if error is not doctrinal
 */
export function assertDoctrinalError(error, context) {
    if (!isDoctrinalError(error)) {
        var doctrinalError = createDoctrinalError("LOGGING_FAILURE", "Non-doctrinal error in ".concat(context, ": ").concat(error instanceof Error ? error.message : String(error)));
        throw new SafetyBoundaryError("Error failed doctrinal assertion in ".concat(context), error instanceof Error ? error : new Error(String(error)), doctrinalError);
    }
}
/**
 * Converts any error to a doctrinal error with appropriate classification
 */
export function doctrinalizeError(error, context) {
    if (isDoctrinalError(error)) {
        return error;
    }
    // Classify the error based on context and content
    var errorMessage = error instanceof Error ? error.message : String(error);
    var lowerMessage = errorMessage.toLowerCase();
    // Security-related errors
    if (lowerMessage.includes('api key') || lowerMessage.includes('auth') || lowerMessage.includes('token')) {
        return createDoctrinalError("UNAUTHORIZED_OVERRIDE", "Security error in ".concat(context, ": ").concat(errorMessage));
    }
    // Configuration errors
    if (lowerMessage.includes('config') || lowerMessage.includes('environment') || lowerMessage.includes('missing')) {
        return createDoctrinalError("INVALID_CONFIGURATION", "Configuration error in ".concat(context, ": ").concat(errorMessage));
    }
    // Data/log integrity errors
    if (lowerMessage.includes('log') || lowerMessage.includes('data') || lowerMessage.includes('integrity')) {
        return createDoctrinalError("LOGGING_FAILURE", "Data integrity error in ".concat(context, ": ").concat(errorMessage));
    }
    // Default to logging failure for unknown errors
    return createDoctrinalError("LOGGING_FAILURE", "Unclassified error in ".concat(context, ": ").concat(errorMessage));
}
/**
 * Safety boundary for external API calls
 * Ensures all external interactions are properly error-handled
 */
export function safeExternalCall(operation, context, fallback) {
    return __awaiter(this, void 0, void 0, function () {
        var error_2, doctrinalError;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, operation()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_2 = _a.sent();
                    doctrinalError = doctrinalizeError(error_2, "external call ".concat(context));
                    if (fallback !== undefined) {
                        // Log the error but return fallback
                        console.error("[SELF Safety Boundary] External call failed in ".concat(context, ":"), doctrinalError);
                        return [2 /*return*/, fallback];
                    }
                    throw new SafetyBoundaryError("External call failed in ".concat(context), error_2 instanceof Error ? error_2 : new Error(String(error_2)), doctrinalError);
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Safety boundary for SELF engine core functions
 * All core SELF operations must be wrapped with this boundary
 */
export function selfEngineBoundary(fn, operationName) {
    return withSafetyBoundary(fn, "SELF engine ".concat(operationName));
}
/**
 * Safety boundary for SELF engine async operations
 */
export function selfEngineAsyncBoundary(fn, operationName) {
    return withAsyncSafetyBoundary(fn, "SELF engine ".concat(operationName));
}
//# sourceMappingURL=safetyBoundary.js.map