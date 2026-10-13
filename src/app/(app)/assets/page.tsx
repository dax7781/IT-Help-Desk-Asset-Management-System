import Link from "next/link";
import { requirePageUser } from "@/lib/current-user";
import { listAssets } from "@/services/assets";
import { isStaff } from "@/lib/permissions";
import { assetTypes, assetStatuses } from "@/lib/constants";
import { label } from "@/lib/constants";
import { pageQuery } from "@/lib/page-query";
import Pagination from "@/components/pagination";
export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requirePageUser(),
    query = pageQuery(await searchParams, ["search", "status", "type", "page"]),
    data = await listAssets(actor, query);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Equipment inventory</p>
          <h1>
            {isStaff(actor) ? "Assets" : "My equipment"}{" "}
            <span className="heading-count">{data.total}</span>
          </h1>
          <p className="muted">
            {isStaff(actor)
              ? "Track ownership, lifecycle, and linked support requests."
              : "Equipment assigned to you and its support requests."}
          </p>
        </div>
        {isStaff(actor) && (
          <Link className="button primary" href="/assets/new">
            Register equipment
          </Link>
        )}
      </div>
      <section className="panel ticket-list">
        <form method="GET" className="filters">
          <div className="search-input">
            <input
              aria-label="Search equipment"
              name="search"
              maxLength={150}
              defaultValue={query.search}
              placeholder="Search tag, manufacturer, or model…"
              autoComplete="off"
            />
          </div>
          <select
            aria-label="Equipment status"
            name="status"
            defaultValue={query.status || ""}
          >
            <option value="">All statuses</option>
            {assetStatuses.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
          <select
            aria-label="Equipment type"
            name="type"
            defaultValue={query.type || ""}
          >
            <option value="">All types</option>
            {assetTypes.map((t) => (
              <option key={t} value={t}>
                {label(t)}
              </option>
            ))}
          </select>
          <button className="button secondary">Filter</button>
          {Object.keys(query).length > 0 && (
            <Link href="/assets" className="text-link">
              Clear
            </Link>
          )}
        </form>
        {data.items.length ? (
          <div className="table-scroll">
            <table className="ticket-table" role="table">
              <thead>
                <tr>
                  <th scope="col">Equipment</th>
                  <th scope="col">Type</th>
                  <th scope="col">Status</th>
                  <th scope="col">Location</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((a) => (
                  <tr key={a.id}>
                    <td data-label="Equipment">
                      <Link className="ticket-title" href={`/assets/${a.id}`}>
                        {a.manufacturer} {a.model}
                      </Link>
                      <span className="ticket-number">{a.assetTag}</span>
                    </td>
                    <td data-label="Type">{label(a.type)}</td>
                    <td data-label="Status">
                      <span className="pill neutral">{label(a.status)}</span>
                    </td>
                    <td data-label="Location">{a.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <h2>No equipment found</h2>
            <p className="muted">
              {Object.keys(query).length
                ? "Try clearing or changing the filters."
                : isStaff(actor)
                  ? "Register your first piece of equipment."
                  : "Your assigned equipment will appear here."}
            </p>
          </div>
        )}
        <Pagination base="/assets" query={query} {...data} />
      </section>
    </>
  );
}
