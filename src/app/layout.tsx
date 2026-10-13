import type { Metadata } from "next";
import "./globals.css";
import { connection } from "next/server";
export const metadata: Metadata = {
  title: { default: "TechDesk", template: "%s · TechDesk" },
  description:
    "IT support, organized. Submit and track your technical support requests.",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Every HTML document needs its own script nonce, including error pages.
  await connection();
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
