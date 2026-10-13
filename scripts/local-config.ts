/** The managed runner owns exactly this database, never another local or cloud URI. */
export function assertManagedMongoUri(uri: string | undefined) {
  if (!uri) return;
  let valid = false;
  try {
    const url = new URL(uri);
    valid =
      url.protocol === "mongodb:" &&
      ["127.0.0.1", "localhost"].includes(url.hostname) &&
      url.port === "27027" &&
      url.pathname === "/techdesk" &&
      !url.username &&
      !url.password &&
      !url.hash &&
      (!url.searchParams.has("replicaSet") ||
        url.searchParams.get("replicaSet") === "techdesk-dev");
  } catch {
    /* Invalid and multi-host URIs belong to the external runner. */
  }
  if (!valid)
    throw new Error(
      "A different MongoDB connection is configured. Use npm run dev:external or npm start; the managed runner only uses techdesk on localhost:27027.",
    );
}
