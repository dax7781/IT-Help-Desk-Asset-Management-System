import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";
import { apiResponse, assertMutationOrigin, readBoundedBody } from "@/lib/api";
export const GET = handlers.GET;
export async function POST(request: NextRequest) {
  try {
    assertMutationOrigin(request);
    const body = (await readBoundedBody(request)).toString("utf8");
    // Construct a fresh request: the original stream has already been consumed.
    return await handlers.POST(new NextRequest(request.url, {
      method: request.method, headers: request.headers, body,
    }));
  } catch (error) {
    return apiResponse(async () => {
      throw error;
    });
  }
}
