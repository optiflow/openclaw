import { describe, expect, it } from "vitest";
import { resolveDeploymentRiskWarning } from "./deployment-risk-warning.js";

describe("resolveDeploymentRiskWarning", () => {
  it("returns null without autoscaling environment hints", () => {
    expect(resolveDeploymentRiskWarning({})).toBeNull();
  });

  it("returns warning details when autoscaling hints are present", () => {
    const warning = resolveDeploymentRiskWarning({
      KUBERNETES_SERVICE_HOST: "10.0.0.1",
    });

    expect(warning).not.toBeNull();
    expect(warning?.reasonSummary).toContain("Kubernetes runtime detected");
    expect(warning?.hints).toContain("Kubernetes runtime detected (KUBERNETES_SERVICE_HOST)");
  });

  it("supports suppression via environment flag", () => {
    const warning = resolveDeploymentRiskWarning({
      KUBERNETES_SERVICE_HOST: "10.0.0.1",
      OPENCLAW_SUPPRESS_STATEFUL_DEPLOY_WARNING: "1",
    });

    expect(warning).toBeNull();
  });
});
