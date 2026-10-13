import { describe, it, expect } from "vitest";
import { assertManagedMongoUri } from "../../scripts/local-config";
describe("managed local database boundary", () => {
  it.each([
    undefined,
    "mongodb://localhost:27027/techdesk",
    "mongodb://127.0.0.1:27027/techdesk?replicaSet=techdesk-dev",
  ])("accepts its own database (%s)", (uri) => {
    expect(() => assertManagedMongoUri(uri)).not.toThrow();
  });
  it.each([
    "mongodb://localhost:27027/real_data",
    "mongodb://localhost:27027/techdesk-other",
    "mongodb://localhost:27017/techdesk",
    "mongodb://localhost:27027/techdesk?replicaSet=other",
    "mongodb://user:pass@localhost:27027/techdesk",
    "mongodb+srv://example.invalid/techdesk",
    "not-a-uri",
  ])("refuses a different configuration (%s)", (uri) => {
    expect(() => assertManagedMongoUri(uri)).toThrow(
      "different MongoDB connection",
    );
  });
});
