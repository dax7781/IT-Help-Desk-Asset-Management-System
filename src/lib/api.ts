import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";
export async function apiResponse(work: () => Promise<unknown>, status = 200) {
  try {
    return NextResponse.json(await work(), {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ZodError)
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION",
            message: "Check the highlighted fields.",
            fieldErrors: error.flatten().fieldErrors,
          },
        },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    if (error instanceof AppError)
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            fieldErrors: error.fieldErrors,
          },
        },
        {
          status: error.status,
          headers: {
            "Cache-Control": "no-store",
            ...(error.retryAfter
              ? { "Retry-After": String(error.retryAfter) }
              : {}),
          },
        },
      );
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    )
      return NextResponse.json(
        {
          error: {
            code: "CONFLICT",
            message:
              "This identifier is already in use. Choose a unique email, asset tag, or serial number.",
          },
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    console.error(
      "Request failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      {
        error: {
          code: "UNAVAILABLE",
          message: "The service is unavailable. Please try again.",
        },
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
export function assertMutationOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    throw new AppError(
      403,
      "INVALID_ORIGIN",
      "This request could not be verified.",
    );
}
export async function readMutation(request: Request) {
  assertMutationOrigin(request);
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    throw new AppError(422, "INVALID_BODY", "Send a JSON request.");
  const text = (await readBoundedBody(request)).toString("utf8");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AppError(422, "INVALID_BODY", "Send valid JSON.");
  }
}
export async function readBoundedBody(request: Request) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > 32768)
    throw new AppError(413, "TOO_LARGE", "The request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new AppError(422, "INVALID_BODY", "Send a JSON request.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 32768) {
      await reader.cancel();
      throw new AppError(413, "TOO_LARGE", "The request is too large.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
