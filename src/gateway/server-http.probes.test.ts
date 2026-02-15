import type { IncomingMessage, ServerResponse } from "node:http";
import { describe, expect, test, vi } from "vitest";
import type { ResolvedGatewayAuth } from "./auth.js";
import { createGatewayHttpServer } from "./server-http.js";

function createRequest(params: {
  path: string;
  method?: string;
  authorization?: string;
}): IncomingMessage {
  const headers: Record<string, string> = {
    host: "localhost:18789",
  };
  if (params.authorization) {
    headers.authorization = params.authorization;
  }
  return {
    method: params.method ?? "GET",
    url: params.path,
    headers,
    socket: { remoteAddress: "127.0.0.1" },
  } as IncomingMessage;
}

function createResponse(): {
  res: ServerResponse;
  setHeader: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  getBody: () => string;
} {
  const setHeader = vi.fn();
  let body = "";
  const end = vi.fn((chunk?: unknown) => {
    if (typeof chunk === "string") {
      body = chunk;
      return;
    }
    if (chunk == null) {
      body = "";
      return;
    }
    body = JSON.stringify(chunk);
  });
  const res = {
    headersSent: false,
    statusCode: 200,
    setHeader,
    end,
  } as unknown as ServerResponse;
  return {
    res,
    setHeader,
    end,
    getBody: () => body,
  };
}

async function dispatchRequest(
  server: ReturnType<typeof createGatewayHttpServer>,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  server.emit("request", req, res);
  await new Promise((resolve) => setImmediate(resolve));
}

describe("gateway HTTP probes", () => {
  const resolvedAuth: ResolvedGatewayAuth = {
    mode: "token",
    token: "test-token",
    password: undefined,
    allowTailscale: false,
  };

  test("returns 200 JSON for /healthz without auth", async () => {
    const handlePluginRequest = vi.fn(async () => false);
    const server = createGatewayHttpServer({
      canvasHost: null,
      clients: new Set(),
      controlUiEnabled: false,
      controlUiBasePath: "/__control__",
      openAiChatCompletionsEnabled: false,
      openResponsesEnabled: false,
      handleHooksRequest: async () => false,
      handlePluginRequest,
      resolvedAuth,
    });

    const response = createResponse();
    await dispatchRequest(server, createRequest({ path: "/healthz" }), response.res);

    expect(response.res.statusCode).toBe(200);
    expect(response.getBody()).toBe('{"status":"ok"}');
    expect(handlePluginRequest).not.toHaveBeenCalled();
  });

  test("returns 200 for /readyz when ready callback reports ready", async () => {
    const server = createGatewayHttpServer({
      canvasHost: null,
      clients: new Set(),
      controlUiEnabled: false,
      controlUiBasePath: "/__control__",
      openAiChatCompletionsEnabled: false,
      openResponsesEnabled: false,
      handleHooksRequest: async () => false,
      resolvedAuth,
      isReady: () => true,
    });

    const response = createResponse();
    await dispatchRequest(server, createRequest({ path: "/readyz" }), response.res);

    expect(response.res.statusCode).toBe(200);
    expect(response.getBody()).toBe('{"status":"ready"}');
  });

  test("returns 503 for /readyz when ready callback reports not ready", async () => {
    const server = createGatewayHttpServer({
      canvasHost: null,
      clients: new Set(),
      controlUiEnabled: false,
      controlUiBasePath: "/__control__",
      openAiChatCompletionsEnabled: false,
      openResponsesEnabled: false,
      handleHooksRequest: async () => false,
      resolvedAuth,
      isReady: () => false,
    });

    const response = createResponse();
    await dispatchRequest(server, createRequest({ path: "/readyz" }), response.res);

    expect(response.res.statusCode).toBe(503);
    expect(response.getBody()).toBe('{"status":"not_ready"}');
  });

  test("falls through for unsupported probe methods", async () => {
    const server = createGatewayHttpServer({
      canvasHost: null,
      clients: new Set(),
      controlUiEnabled: false,
      controlUiBasePath: "/__control__",
      openAiChatCompletionsEnabled: false,
      openResponsesEnabled: false,
      handleHooksRequest: async () => false,
      resolvedAuth,
    });

    const response = createResponse();
    await dispatchRequest(
      server,
      createRequest({ path: "/healthz", method: "POST" }),
      response.res,
    );

    expect(response.res.statusCode).toBe(404);
    expect(response.getBody()).toBe("Not Found");
  });
});
