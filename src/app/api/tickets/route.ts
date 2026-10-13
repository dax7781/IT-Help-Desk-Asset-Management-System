import { apiResponse, readMutation } from "@/lib/api";
import { requireUser, requireMutationUser } from "@/lib/current-user";
import { createTicket, listTickets } from "@/services/tickets";
export async function GET(request: Request) {
  return apiResponse(async () =>
    listTickets(
      await requireUser(),
      Object.fromEntries(new URL(request.url).searchParams),
    ),
  );
}
export async function POST(request: Request) {
  return apiResponse(async () => {
    const user = await requireMutationUser(request);
    return createTicket(user, await readMutation(request));
  }, 201);
}
