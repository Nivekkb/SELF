import { DoctrineViolation } from "./doctrineCompliance.js";
import { DoctrineSection } from "./doctrine.js";
export function requireProd(events) {
    const nonProd = events.find(e => e.dataProvenance !== "prod");
    if (nonProd) {
        throw new DoctrineViolation("H1_NONPROD_IN_METRICS", `Non-prod event encountered in metrics path: provenance=${nonProd.dataProvenance}, runId=${nonProd.runId}`, [DoctrineSection.DS_11_SEPARATE_ENVIRONMENTS]);
    }
}
//# sourceMappingURL=metricsGate.js.map