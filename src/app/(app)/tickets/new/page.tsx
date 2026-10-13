import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePageUser as requireUser } from "@/lib/current-user";
import { selectableAssets } from "@/services/tickets";
import TicketForm from "@/components/ticket-form";
export default async function NewTicket({
  searchParams,
}: {
  searchParams: Promise<{ assetId?: string }>;
}) {
  const user = await requireUser();
  const assets = await selectableAssets(user);
  const selected = (await searchParams).assetId;
  return (
    <>
      <Link href="/tickets" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Back to tickets
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Service desk / Create request</p>
          <h1>New support ticket</h1>
          <p className="muted">
            Confirm your requester details and describe what needs attention.
          </p>
        </div>
      </div>
      <TicketForm
        requester={user}
        assets={assets}
        selectedAsset={
          assets.some((a) => a.id === selected) ? selected : undefined
        }
      />
    </>
  );
}
