import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/current-user";
import { isStaff } from "@/lib/permissions";
import AssetForm from "@/components/asset-form";
export default async function NewAssetPage() {
  if (!isStaff(await requirePageUser())) notFound();
  return (
    <>
      <Link className="back-link" href="/assets">
        ← Back to equipment
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>New equipment</h1>
        </div>
      </div>
      <AssetForm />
    </>
  );
}
