import { apiResponse, readMutation } from "@/lib/api";
import { requireUser, requireMutationUser } from "@/lib/current-user";
import { listAssets, createAsset } from "@/services/assets";
export async function GET(request: Request) {
  return apiResponse(async () =>
    listAssets(
      await requireUser(),
      Object.fromEntries(new URL(request.url).searchParams),
    ),
  );
}
export async function POST(request: Request) {
  return apiResponse(
    async () =>
      createAsset(
        await requireMutationUser(request),
        await readMutation(request),
      ),
    201,
  );
}
