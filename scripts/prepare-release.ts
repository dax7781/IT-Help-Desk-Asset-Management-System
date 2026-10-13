import { config } from "dotenv";
import mongoose from "mongoose";
import { connectDb } from "../src/lib/db";
import { ensureIndexes, User } from "../src/models";
import { checkReleaseEnvironment, initializeDemo } from "./demo-operations";
config({ path: ".env.local", quiet: true });
async function main() {
  checkReleaseEnvironment(process.env);
  await connectDb();
  await ensureIndexes();
  await User.updateMany(
    { sessionVersion: { $exists: false } },
    { $set: { sessionVersion: 0 } },
  );
  if (process.argv.includes("--seed-demo")) {
    if (!process.env.DEMO_PASSWORD)
      throw new Error(
        "Configure DEMO_PASSWORD to initialize a fictional demo.",
      );
    await initializeDemo(process.env.DEMO_PASSWORD);
  }
  console.log(
    "Release database preparation passed. Declared indexes and session-version defaults are ready.",
  );
}
main()
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Preparation failed",
    );
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
