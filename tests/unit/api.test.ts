import { describe, expect, it } from "vitest";
import { readMutation, apiResponse } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { contentSecurityPolicy } from "@/lib/security-headers";
describe("HTTP request boundaries", () => {
  it("returns a no-store quota error with Retry-After", async () => {
    const response = await apiResponse(async () => {
      throw new AppError(429, "RATE_LIMITED", "Try later.", undefined, 45);
    });
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("45");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
  it("keeps production scripts nonce-protected and allows development debugging only in development", () => {
    const production = contentSecurityPolicy("fixture-nonce", false, true);
    expect(production).toContain(
      "script-src 'self' 'nonce-fixture-nonce' 'strict-dynamic'",
    );
    expect(production).not.toContain("unsafe-eval");
    expect(production).toContain("upgrade-insecure-requests");
    expect(production).toContain("frame-ancestors 'none'");
    const development = contentSecurityPolicy("fixture", true, false);
    expect(development).toContain("unsafe-eval");
    expect(development).not.toContain("upgrade-insecure-requests");
  });
  it("rejects missing or hostile origins and misleading content types", async () => {
    const request = (origin: string, type = "application/json") =>
      new Request("http://localhost:3000/api/tickets", {
        method: "POST",
        headers: { origin, "content-type": type },
        body: "{}",
      });
    await expect(
      readMutation(request("https://untrusted.example")),
    ).rejects.toMatchObject({ status: 403 });
    await expect(readMutation(request(""))).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      readMutation(
        request("http://localhost:3000", "application/json-anything"),
      ),
    ).rejects.toMatchObject({ status: 422 });
    expect(
      await readMutation(
        request("http://localhost:3000", "application/json; charset=utf-8"),
      ),
    ).toEqual({});
  });
  it("bounds streamed UTF-8 bytes without relying on Content-Length", async () => {
    const bytes = new TextEncoder().encode(
      JSON.stringify({ message: "é".repeat(20000) }),
    );
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, 20000));
        controller.enqueue(bytes.slice(20000));
        controller.close();
      },
    });
    const request = new Request("http://localhost:3000/api/tickets", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body,
      duplex: "half",
    } as RequestInit & { duplex: "half" });
    await expect(readMutation(request)).rejects.toMatchObject({ status: 413 });
  });
  it("rejects malformed JSON and prevents cached authorization failures", async () => {
    const request = new Request("http://localhost:3000/api/tickets", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: "{",
    });
    await expect(readMutation(request)).rejects.toMatchObject({ status: 422 });
    const response = await apiResponse(async () => {
      throw new AppError(403, "FORBIDDEN", "Access denied.");
    });
    expect(response.status).toBe(403);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
