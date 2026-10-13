import { apiResponse } from "@/lib/api";
import { requireUser } from "@/lib/current-user";
import { dashboardStats } from "@/services/reporting";
export async function GET() {
  return apiResponse(async () => dashboardStats(await requireUser()));
}
