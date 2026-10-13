import Link from "next/link";
import { Headset, ArrowUpRight, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";
import { label } from "@/lib/constants";
import type { Actor } from "@/lib/permissions";
import WorkspaceNav from "@/components/workspace-nav";
import WorkspaceHeader from "@/components/workspace-header";
export default function AppShell({
  user,
  children,
}: {
  user: Actor;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <span className="brand-icon">
            <Headset size={22} aria-hidden="true" />
          </span>
          TechDesk<span className="brand-dot">.</span>
        </Link>
        <div className="workspace-label">
          <span className="workspace-mark">T</span>
          <div>
            Support workspace<small>{label(user.role)} access</small>
          </div>
        </div>
        <WorkspaceNav role={user.role} />
        <div className="sidebar-tip">
          <span className="pill light-pill">SERVICE DESK</span>
          <h3>Keep work moving</h3>
          <p>Report an issue and follow every update from your IT team.</p>
          <Link href="/tickets/new">
            Submit a ticket <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="sidebar-user">
          <span className="avatar">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <strong>{user.name}</strong>
            <small>{label(user.role)}</small>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              className="icon-button"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={17} aria-hidden="true" />
            </button>
          </form>
        </div>
      </aside>
      <div className="workspace-content">
        <WorkspaceHeader />
        <main id="main" className="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="app-footer">
          TechDesk · IT support, organized.
        </footer>
      </div>
    </div>
  );
}
