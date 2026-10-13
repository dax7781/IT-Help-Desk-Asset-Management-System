import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/current-user";
import { isStaff } from "@/lib/permissions";
import { assetDetail } from "@/services/assets";
import { selectableUsers } from "@/services/users";
import { AppError } from "@/lib/errors";
import AssetForm from "@/components/asset-form";
export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requirePageUser();
  if (!isStaff(actor)) notFound();
  let asset;
  try {
    asset = await assetDetail(actor, (await params).id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const people = await selectableUsers(actor);
  return (
    <>
      <Link className="back-link" href={`/assets/${asset.id}`}>
        ← Back to equipment
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{asset.assetTag}</p>
          <h1>Edit equipment</h1>
        </div>
      </div>
      <AssetForm initial={asset} people={people} />
    </>
  );
}
