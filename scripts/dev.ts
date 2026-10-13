import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { config, parse } from "dotenv";
import { assertManagedMongoUri } from "./local-config";
async function main() {
  const production = process.argv.includes("--production");
  let content = "";
  try {
    content = await readFile(".env.local", "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    /* First local run. */
  }
  // Refuse external/different databases before changing any local configuration.
  assertManagedMongoUri(process.env.MONGODB_URI ?? parse(content).MONGODB_URI);
  await mkdir(".local/mongodb", { recursive: true });
  if (!/^AUTH_SECRET=/m.test(content))
    content += "\nAUTH_SECRET=" + randomBytes(32).toString("hex");
  if (!/^DEMO_PASSWORD=/m.test(content))
    content += "\nDEMO_PASSWORD=" + randomBytes(18).toString("base64url");
  if (!/^AUTH_URL=/m.test(content))
    content += "\nAUTH_URL=http://localhost:3000";
  await writeFile(".env.local", content.trim() + "\n");
  config({ path: ".env.local", quiet: true });
  process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(".local/binaries");
  console.log(
    "Starting a persistent local MongoDB replica set. The first run downloads MongoDB.",
  );
  const replica = await MongoMemoryReplSet.create({
    instanceOpts: [
      {
        dbPath: path.resolve(".local/mongodb"),
        port: 27027,
        launchTimeout: 60_000,
      },
    ],
    replSet: {
      count: 1,
      name: "techdesk-dev",
      storageEngine: "wiredTiger",
      ip: "127.0.0.1",
    },
  });
  if (!/^MONGODB_URI=/m.test(content)) {
    content += "\nMONGODB_URI=" + replica.getUri("techdesk");
    await writeFile(".env.local", content.trim() + "\n");
  }
  const env = {
    ...process.env,
    MONGODB_URI: replica.getUri("techdesk"),
    SHOW_DEMO_ACCOUNTS: "true",
    NODE_ENV: production ? ("production" as const) : ("development" as const),
  };
  let child: ChildProcess | undefined = undefined;
  let stopping = false;
  async function stop() {
    if (stopping) return;
    stopping = true;
    child?.kill();
    seed?.kill();
    await replica.stop({ doCleanup: false });
  }
  process.on("SIGINT", () => {
    void stop().then(() => process.exit());
  });
  process.on("SIGTERM", () => {
    void stop().then(() => process.exit());
  });
  const seed = spawn(process.execPath, ["--import", "tsx", "scripts/seed.ts"], {
    stdio: "inherit",
    env,
  });
  const result = await new Promise<number | null>((resolve, reject) => {
    seed!.on("exit", resolve);
    seed!.on("error", reject);
  }).catch(async (error) => {
    await stop();
    throw error;
  });
  if (result !== 0) {
    await stop();
    throw new Error("Demo seed failed.");
  }
  console.log(
    "Local demo accounts are listed on the login page. Their shared local password is DEMO_PASSWORD in .env.local.",
  );
  child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      production ? "start" : "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3000",
    ],
    { stdio: "inherit", env },
  );
  child.on("error", () => {
    void stop().then(() => {
      process.exitCode = 1;
    });
  });
  child.on("exit", (code) => {
    void stop().then(() => {
      process.exitCode = code || 0;
    });
  });
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
