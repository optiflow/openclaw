const AUTOSCALING_ENV_HINTS: ReadonlyArray<{
  key: string;
  reason: string;
}> = [
  {
    key: "KUBERNETES_SERVICE_HOST",
    reason: "Kubernetes runtime detected",
  },
  {
    key: "K_SERVICE",
    reason: "Cloud Run runtime detected",
  },
  {
    key: "GAE_ENV",
    reason: "App Engine runtime detected",
  },
];

export type DeploymentRiskWarning = {
  reasonSummary: string;
  hints: string[];
};

function isTruthy(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized !== "" && normalized !== "0" && normalized !== "false";
}

export function resolveDeploymentRiskWarning(
  env: NodeJS.ProcessEnv = process.env,
): DeploymentRiskWarning | null {
  if (isTruthy(env.OPENCLAW_SUPPRESS_STATEFUL_DEPLOY_WARNING)) {
    return null;
  }

  const activeHints = AUTOSCALING_ENV_HINTS.filter((hint) => isTruthy(env[hint.key]));
  if (activeHints.length === 0) {
    return null;
  }

  const hints = activeHints.map((hint) => `${hint.reason} (${hint.key})`);
  return {
    reasonSummary: hints.join(", "),
    hints,
  };
}
