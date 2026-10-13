import { config } from "dotenv";
import mongoose from "mongoose";
import { connectDb } from "../src/lib/db";
import { seedData } from "./seed-data";
config({ path: ".env.local", quiet: true });
config({ quiet: true });
async function main() {
  if (!process.env.MONGODB_URI || !process.env.DEMO_PASSWORD)
    throw new Error("Set MONGODB_URI and DEMO_PASSWORD before seeding.");
  await connectDb();
  if (!/^techdesk(?:_test)?$/.test(mongoose.connection.name))
    throw new Error(
      "Seed is restricted to the techdesk or techdesk_test database.",
    );
  await seedData(process.env.DEMO_PASSWORD);
  console.log(
    "Fictional demo records created where missing. Existing records were preserved.",
  );
}
main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
