import { apiResponse, readMutation } from "@/lib/api";
import { requireMutationUser } from "@/lib/current-user";
import { updateAsset } from "@/services/assets";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return apiResponse(async () => {
    const actor = await requireMutationUser(request);
    const input = await readMutation(request);

    return updateAsset(actor, (await context.params).id, input, true);
  });
}
