import { config } from "dotenv";
import mongoose from "mongoose";
import { connectDb } from "../src/lib/db";
import { ensureIndexes } from "../src/models";
config({ path: ".env.local", quiet: true });
config({ quiet: true });
connectDb()
  .then(ensureIndexes)
  .then(() => console.log("Declared indexes created."))
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
