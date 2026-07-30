import type { EveCompositionStatus } from "../contracts";
export interface EveUiStatus { label: string; severity: "ok" | "warning" | "disabled"; }
export function toEveUiStatus(status: EveCompositionStatus): EveUiStatus {
  if (!status.integrationEnabled) return { label: "Adapter prototipi disattivato", severity: "disabled" };
  if (status.probes.some((probe) => probe.state === "unavailable")) return { label: "Adapter parzialmente disponibile", severity: "warning" };
  return { label: "Architettura CORE collegata", severity: "ok" };
}
