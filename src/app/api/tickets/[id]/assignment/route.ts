import { apiResponse, readMutation } from "@/lib/api";
import { requireMutationUser } from "@/lib/current-user";
import { updateTicket } from "@/services/tickets";
import { AppError } from "@/lib/errors";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return apiResponse(async () => {
    const actor = await requireMutationUser(request);
    const input = await readMutation(request);
    if (
      !input ||
      typeof input !== "object" ||
      !("action" in input) ||
      !["CLAIM", "ASSIGN"].includes(String(input.action))
    )
      throw new AppError(
        422,
        "VALIDATION",
        "Select an action supported by this endpoint.",
      );
    return updateTicket(actor, (await context.params).id, input);
  });
}
