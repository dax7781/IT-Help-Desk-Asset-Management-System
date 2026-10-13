import { config } from "dotenv";
import mongoose from "mongoose";
import { connectDb } from "../src/lib/db";
import { resetDemo } from "./demo-operations";
config({ path: ".env.local", quiet: true });
async function main() {
  if (!process.env.DEMO_PASSWORD || !process.env.CONFIRM_DEMO_RESET)
    throw new Error(
      "Set DEMO_PASSWORD and CONFIRM_DEMO_RESET to the exact disposable database name. Stop the app first.",
    );
  await connectDb();
  await resetDemo(process.env.DEMO_PASSWORD, process.env.CONFIRM_DEMO_RESET);
  console.log("Fictional demo restored atomically; existing sessions revoked.");
}
main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Reset failed");
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
