import { SelfEvent, DoctrineSection } from "./doctrine";
export type SoftViolation = {
    code: string;
    message: string;
    doctrineSections: DoctrineSection[];
};
export declare function evaluateSoftInvariants(ev: SelfEvent): SoftViolation[];
export declare function enforceSoftInvariants(ev: SelfEvent): void;
//# sourceMappingURL=softInvariants.d.ts.map