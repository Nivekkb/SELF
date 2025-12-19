import { DoctrineViolation } from "./doctrineCompliance";
import { DoctrineSection } from "./doctrine";
export function requireProd(events) {
    var nonProd = events.find(function (e) { return e.dataProvenance !== "prod"; });
    if (nonProd) {
        throw new DoctrineViolation("H1_NONPROD_IN_METRICS", "Non-prod event encountered in metrics path: provenance=".concat(nonProd.dataProvenance, ", runId=").concat(nonProd.runId), [DoctrineSection.DS_11_SEPARATE_ENVIRONMENTS]);
    }
}
//# sourceMappingURL=metricsGate.js.map