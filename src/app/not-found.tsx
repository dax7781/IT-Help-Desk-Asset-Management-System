import Link from "next/link";
export default function NotFound() {
  return (
    <main className="error-page">
      <div className="panel">
        <p className="eyebrow">404 · TechDesk</p>
        <h1>Page not found</h1>
        <p className="muted">
          It may be unavailable or outside your permitted records.
        </p>
        <Link className="button primary" href="/tickets">
          Return to workspace
        </Link>
      </div>
    </main>
  );
}
