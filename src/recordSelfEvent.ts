import { SelfEvent } from "./doctrine";
import { assertHardInvariants } from "./doctrineCompliance";
import { enforceSoftInvariants } from "./softInvariants";

export async function recordSelfEvent(ev: SelfEvent) {
  assertHardInvariants(ev);
  enforceSoftInvariants(ev);

  // TODO: write to DB / queue
  // await db.insert("self_events", ev)

  return true;
}
