import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/current-user";
import { listUsers } from "@/services/users";
import { roles, label } from "@/lib/constants";
import { pageQuery } from "@/lib/page-query";
import { UserCreateForm, UserEditor } from "@/components/user-management";
import Pagination from "@/components/pagination";
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requirePageUser();
  if (actor.role !== "ADMIN") notFound();
  const query = pageQuery(await searchParams, [
      "search",
      "role",
      "active",
      "page",
    ]),
    data = await listUsers(actor, query);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>
            Users <span className="heading-count">{data.total}</span>
          </h1>
          <p className="muted">
            Manage roles and account access. Historical records are retained.
          </p>
        </div>
      </div>
      <UserCreateForm />
      <section className="panel ticket-list section-heading">
        <form method="GET" className="filters">
          <div className="search-input">
            <input
              name="search"
              aria-label="Search users"
              maxLength={150}
              defaultValue={query.search}
              placeholder="Search name or email…"
              autoComplete="off"
            />
          </div>
          <select
            name="role"
            aria-label="Role filter"
            defaultValue={query.role || ""}
          >
            <option value="">All roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {label(r)}
              </option>
            ))}
          </select>
          <select
            name="active"
            aria-label="Account status filter"
            defaultValue={query.active || ""}
          >
            <option value="">All accounts</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button className="button secondary">Filter</button>
          {Object.keys(query).length > 0 && (
            <Link className="text-link" href="/admin/users">
              Clear
            </Link>
          )}
        </form>
        <div className="user-list">
          {data.items.length ? (
            data.items.map((u) => <UserEditor key={u.id} user={u} />)
          ) : (
            <div className="empty-state">
              <h2>No matching users</h2>
              <p className="muted">Try changing your filters.</p>
            </div>
          )}
        </div>
        <Pagination base="/admin/users" query={query} {...data} />
      </section>
    </>
  );
}
