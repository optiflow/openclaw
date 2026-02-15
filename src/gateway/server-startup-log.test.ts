import { describe, expect, it, vi } from "vitest";
import { logGatewayStartup } from "./server-startup-log.js";

describe("logGatewayStartup", () => {
  it("emits deployment warning when autoscaling hints are detected", () => {
    const info = vi.fn();
    const warn = vi.fn();

    logGatewayStartup({
      cfg: {} as never,
      bindHost: "0.0.0.0",
      port: 18789,
      log: { info, warn },
      isNixMode: false,
      env: { KUBERNETES_SERVICE_HOST: "10.0.0.1" },
    });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("gateway deployment warning");
  });

  it("does not emit deployment warning when no autoscaling hints are present", () => {
    const info = vi.fn();
    const warn = vi.fn();

    logGatewayStartup({
      cfg: {} as never,
      bindHost: "0.0.0.0",
      port: 18789,
      log: { info, warn },
      isNixMode: false,
      env: {},
    });

    expect(warn).not.toHaveBeenCalled();
  });
});
