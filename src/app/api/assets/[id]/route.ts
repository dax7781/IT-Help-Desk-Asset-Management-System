import { apiResponse, readMutation } from "@/lib/api";
import { requireUser, requireMutationUser } from "@/lib/current-user";
import { assetDetail, updateAsset } from "@/services/assets";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return apiResponse(async () =>
    assetDetail(await requireUser(), (await context.params).id),
  );
}
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return apiResponse(async () =>
    updateAsset(
      await requireMutationUser(request),
      (await context.params).id,
      await readMutation(request),
    ),
  );
}
