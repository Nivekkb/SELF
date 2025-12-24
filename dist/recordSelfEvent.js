import { assertHardInvariants } from "./doctrineCompliance.js";
import { enforceSoftInvariants } from "./softInvariants.js";
export async function recordSelfEvent(ev) {
    assertHardInvariants(ev);
    enforceSoftInvariants(ev);
    // TODO: write to DB / queue
    // await db.insert("self_events", ev)
    return true;
}
//# sourceMappingURL=recordSelfEvent.js.map