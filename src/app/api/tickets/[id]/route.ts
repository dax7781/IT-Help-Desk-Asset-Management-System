import { apiResponse, readMutation } from "@/lib/api";
import { requireUser, requireMutationUser } from "@/lib/current-user";
import { ticketDetail, updateTicket } from "@/services/tickets";
import { AppError } from "@/lib/errors";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return apiResponse(async () =>
    ticketDetail(await requireUser(), (await context.params).id),
  );
}
export async function PATCH(
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
      input.action !== "PRIORITY"
    )
      throw new AppError(
        422,
        "VALIDATION",
        "Use the priority action for this endpoint.",
      );
    return updateTicket(actor, (await context.params).id, input);
  });
}
