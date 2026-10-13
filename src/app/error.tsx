"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <div className="panel">
        <p className="eyebrow">TechDesk</p>
        <h1>We couldn’t load this page.</h1>
        <p className="muted">
          Check that the local database is running, then try again.
        </p>
        <button className="button primary" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
