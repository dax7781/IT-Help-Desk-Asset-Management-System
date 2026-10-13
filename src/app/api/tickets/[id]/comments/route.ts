import { apiResponse, readMutation } from "@/lib/api";
import { requireMutationUser } from "@/lib/current-user";
import { addComment } from "@/services/tickets";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return apiResponse(async () => {
    const actor = await requireMutationUser(request);
    const input = await readMutation(request);
    const internal = !!(
      input &&
      typeof input === "object" &&
      "isInternal" in input &&
      input.isInternal === true
    );
    return addComment(actor, (await context.params).id, input, internal);
  }, 201);
}
