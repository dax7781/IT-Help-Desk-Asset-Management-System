import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { connectDb } from "../src/lib/db";
import { seedData } from "./seed-data";

async function main() {
  process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(".local/binaries");
  const replica = await MongoMemoryReplSet.create({
    instanceOpts: [{ launchTimeout: 60_000 }],
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  let app: ChildProcess | undefined;
  let stopping = false;
  async function cleanup() {
    if (stopping) return;
    stopping = true;
    if (app && app.exitCode === null) {
      app.kill();
      await new Promise<void>((resolve) => {
        app!.once("exit", () => resolve());
        setTimeout(resolve, 5000);
      });
    }
    await mongoose.disconnect();
    await replica.stop();
  }
  const signal = () => {
    void cleanup().then(() => process.exit(1));
  };
  process.once("SIGINT", signal);
  process.once("SIGTERM", signal);
  try {
    const env = {
      ...process.env,
      NODE_ENV: "production" as const,
      AUTH_URL: "http://localhost:3100",
      SMOKE_URL: "http://localhost:3100",
      AUTH_SECRET: randomBytes(32).toString("hex"),
      DEMO_PASSWORD: randomBytes(20).toString("base64url"),
      MONGODB_URI: replica.getUri("techdesk_test"),
      SHOW_DEMO_ACCOUNTS: "true",
    };
    process.env.MONGODB_URI = env.MONGODB_URI;
    await connectDb();
    await seedData(env.DEMO_PASSWORD);
    await mongoose.disconnect();
    app = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3100",
      ],
      { env, stdio: "inherit" },
    );
    let startupError: Error | undefined;
    app.on("error", (error) => {
      startupError = error;
    });
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (startupError || app.exitCode !== null)
        throw new Error("Production preview failed to start.");
      try {
        if (
          (
            await fetch(env.SMOKE_URL + "/login", {
              signal: AbortSignal.timeout(3000),
            })
          ).ok
        ) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!ready) throw new Error("Production preview did not become ready.");
    const smoke = spawn(
      process.execPath,
      ["--import", "tsx", "scripts/smoke.ts"],
      { env, stdio: "inherit" },
    );
    const status = await new Promise<number | null>((resolve, reject) => {
      smoke.once("exit", resolve);
      smoke.once("error", reject);
    });
    if (status !== 0) throw new Error("Production HTTP verification failed.");
    if (process.argv.includes("--browser")) {
      const browser = spawn(
        process.execPath,
        ["node_modules/playwright/cli.js", "test"],
        { env: { ...env, RELEASE_BROWSER_TEST: "true" }, stdio: "inherit" },
      );
      const browserStatus = await new Promise<number | null>(
        (resolve, reject) => {
          browser.once("exit", resolve);
          browser.once("error", reject);
        },
      );
      if (browserStatus !== 0)
        throw new Error("Production browser verification failed.");
    }
    console.log(
      "Production release verification passed against an isolated temporary database. Project .env.local and persistent data were preserved.",
    );
  } finally {
    process.removeListener("SIGINT", signal);
    process.removeListener("SIGTERM", signal);
    await cleanup();
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Release verification failed",
  );
  process.exitCode = 1;
});
