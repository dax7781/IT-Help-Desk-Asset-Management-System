import { requirePageUser } from "@/lib/current-user";
import { dashboardStats } from "@/services/reporting";
import Dashboard from "@/components/dashboard";
export default async function DashboardPage() {
  const user = await requirePageUser();
  return <Dashboard user={user} data={await dashboardStats(user)} />;
}
