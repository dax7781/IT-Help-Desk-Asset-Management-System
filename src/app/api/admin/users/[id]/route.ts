import { apiResponse, readMutation } from "@/lib/api";
import { requireMutationUser } from "@/lib/current-user";
import { updateUser } from "@/services/users";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return apiResponse(async () => {
    const actor = await requireMutationUser(request);
    const input = await readMutation(request);

    return updateUser(actor, (await context.params).id, input);
  });
}
