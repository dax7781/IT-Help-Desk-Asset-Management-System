import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { contentSecurityPolicy } from "@/lib/security-headers";

export function proxy(request: NextRequest) {
  const nonce = randomBytes(24).toString("base64");
  const https = request.nextUrl.protocol === "https:";
  const policy = contentSecurityPolicy(
    nonce,
    process.env.NODE_ENV === "development",
    https,
  );
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  if (https)
    response.headers.set("Strict-Transport-Security", "max-age=31536000");
  return response;
}
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|icon.svg|favicon.ico).*)"],
};
