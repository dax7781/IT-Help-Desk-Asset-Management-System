import { apiResponse } from "@/lib/api";
import { requireUser } from "@/lib/current-user";
import { ticketDetail } from "@/services/tickets";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return apiResponse(
    async () =>
      (await ticketDetail(await requireUser(), (await context.params).id))
        .history,
  );
}
