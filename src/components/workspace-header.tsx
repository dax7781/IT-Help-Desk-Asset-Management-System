"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
export default function WorkspaceHeader() {
  const path = usePathname();
  const area = path.startsWith("/tickets")
    ? "Tickets"
    : path.startsWith("/assets")
      ? "Equipment"
      : path.startsWith("/admin")
        ? "Administration"
        : "Overview";
  const base = path.startsWith("/tickets")
    ? "/tickets"
    : path.startsWith("/assets")
      ? "/assets"
      : "/admin/users";
  const record = /^\/(tickets|assets)\/[^/]+/.test(path);
  const detail = path.endsWith("/new")
    ? path.startsWith("/tickets")
      ? "New ticket"
      : "Register equipment"
    : path.endsWith("/edit")
      ? "Edit equipment"
      : "Record";
  return (
    <header className="topbar">
      <nav aria-label="Breadcrumb" className="workspace-breadcrumb">
        <Link href="/dashboard">Service workspace</Link>
        <ChevronRight size={14} aria-hidden="true" />
        {record ? (
          <>
            <Link href={base}>{area}</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span aria-current="page">{detail}</span>
          </>
        ) : (
          <span aria-current="page">{area}</span>
        )}
      </nav>
      <form
        action="/tickets"
        method="GET"
        role="search"
        className="workspace-search"
      >
        <Search size={16} aria-hidden="true" />
        <input
          aria-label="Search all accessible tickets"
          name="search"
          type="search"
          maxLength={150}
          placeholder="Find a ticket by title or number…"
          autoComplete="off"
        />
        <button type="submit" aria-label="Run workspace search">
          Search
        </button>
      </form>
    </header>
  );
}
