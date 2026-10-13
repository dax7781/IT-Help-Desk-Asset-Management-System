import { apiResponse, readMutation } from "@/lib/api";
import { requireUser, requireMutationUser } from "@/lib/current-user";
import { listUsers, createUser } from "@/services/users";
export async function GET(request: Request) {
  return apiResponse(async () =>
    listUsers(
      await requireUser(),
      Object.fromEntries(new URL(request.url).searchParams),
    ),
  );
}
export async function POST(request: Request) {
  return apiResponse(
    async () =>
      createUser(
        await requireMutationUser(request),
        await readMutation(request),
      ),
    201,
  );
}
