"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Ticket, Laptop, Users } from "lucide-react";
import type { Role } from "@/lib/constants";
export default function WorkspaceNav({ role }: { role: Role }) {
  const path = usePathname();
  const items = [
    { href: "/dashboard", name: "Overview", Icon: LayoutDashboard },
    { href: "/tickets", name: "Tickets", Icon: Ticket },
    {
      href: "/assets",
      name: role === "EMPLOYEE" ? "My equipment" : "Assets",
      Icon: Laptop,
    },
    ...(role === "ADMIN"
      ? [{ href: "/admin/users", name: "Users", Icon: Users }]
      : []),
  ];
  return (
    <nav aria-label="Main navigation">
      <p className="nav-label">Workspace</p>
      {items.map(({ href, name, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={path.startsWith(href) ? "page" : undefined}
        >
          <Icon size={18} aria-hidden="true" />
          {name}
        </Link>
      ))}
    </nav>
  );
}
