import type { BootstrapPublicState } from "@gasboost/bootstrap";

export function templateValue(state: BootstrapPublicState): string {
  return JSON.stringify({ initialized: state.initialized })
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
