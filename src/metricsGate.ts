import { DoctrineViolation } from "./doctrineCompliance";
import { SelfEvent, DoctrineSection } from "./doctrine";

export function requireProd(events: SelfEvent[]) {
  const nonProd = events.find(e => e.dataProvenance !== "prod");
  if (nonProd) {
    throw new DoctrineViolation(
      "H1_NONPROD_IN_METRICS",
      `Non-prod event encountered in metrics path: provenance=${nonProd.dataProvenance}, runId=${nonProd.runId}`,
      [DoctrineSection.DS_11_SEPARATE_ENVIRONMENTS]
    );
  }
}
