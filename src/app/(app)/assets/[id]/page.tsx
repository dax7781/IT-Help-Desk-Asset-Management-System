import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/current-user";
import { isStaff } from "@/lib/permissions";
import { assetDetail } from "@/services/assets";
import { AppError } from "@/lib/errors";
import { label } from "@/lib/constants";
import StatusBadge from "@/components/status-badge";
export default async function AssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requirePageUser();
  let asset;
  try {
    asset = await assetDetail(actor, (await params).id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  return (
    <>
      <Link className="back-link" href="/assets">
        ← Back to equipment
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{asset.assetTag}</p>
          <h1>
            {asset.manufacturer} {asset.model}
          </h1>
          <p className="muted">
            {label(asset.type)} · {label(asset.status)}
          </p>
        </div>
        {isStaff(actor) ? (
          <Link className="button primary" href={`/assets/${asset.id}/edit`}>
            Edit equipment
          </Link>
        ) : (
          asset.status !== "RETIRED" && (
            <Link
              className="button primary"
              href={`/tickets/new?assetId=${asset.id}`}
            >
              Report an issue
            </Link>
          )
        )}
      </div>
      <div className="start-grid">
        <section className="panel detail-panel">
          <h2>Equipment details</h2>
          <dl className="metadata">
            <div>
              <dt>Location</dt>
              <dd>{asset.location}</dd>
            </div>
            {"version" in asset && (
              <>
                <div>
                  <dt>Assigned to</dt>
                  <dd>{asset.assignedTo || "Unassigned"}</dd>
                </div>
                <div>
                  <dt>Serial number</dt>
                  <dd>{asset.serialNumber || "Not recorded"}</dd>
                </div>
                <div>
                  <dt>Purchased</dt>
                  <dd>{asset.purchaseDate || "Not recorded"}</dd>
                </div>
                <div>
                  <dt>Warranty end</dt>
                  <dd>{asset.warrantyUntil || "Not recorded"}</dd>
                </div>
              </>
            )}
          </dl>
          {"notes" in asset && asset.notes && (
            <>
              <h3>Staff notes</h3>
              <p className="preserve-text">{asset.notes}</p>
            </>
          )}
        </section>
        <section className="panel detail-panel">
          <h2>
            {isStaff(actor)
              ? "Repair and support history"
              : "Your support requests"}
          </h2>
          <p className="muted small">
            Latest 50 linked tickets.{" "}
            {isStaff(actor) ? "All requesters." : "Only requests you created."}
          </p>
          {asset.tickets.length ? (
            <ul className="record-list">
              {asset.tickets.map((t) => (
                <li key={t.id}>
                  <Link href={`/tickets/${t.id}`}>
                    <strong>{t.title}</strong>
                    <small>{t.number}</small>
                  </Link>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No linked support requests yet.</p>
          )}
        </section>
      </div>
      {isStaff(actor) && (
        <section className="panel detail-panel">
          <h2>Equipment activity</h2>
          {asset.history.length ? (
            <ol className="timeline">
              {asset.history.map((h) => (
                <li key={h.id}>
                  <strong>{label(h.eventType)}</strong>
                  <span>{h.summary}</span>
                  <time dateTime={h.createdAt}>
                    {new Date(h.createdAt).toLocaleString("en-US", {
                      timeZone: "America/New_York",
                    })}{" "}
                    ET
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">
              This demo equipment was registered before inventory history was
              enabled.
            </p>
          )}
        </section>
      )}
    </>
  );
}
