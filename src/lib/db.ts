import mongoose from "mongoose";
const cache = globalThis as typeof globalThis & {
  mongoPromise?: Promise<typeof mongoose>;
};
export async function connectDb() {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (mongoose.connection.readyState === 0) cache.mongoPromise = undefined;
  const uri = process.env.MONGODB_URI;
  if (!uri)
    throw new Error(
      "MongoDB is not configured. Run npm run dev or configure MONGODB_URI.",
    );
  if (!cache.mongoPromise)
    cache.mongoPromise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
        minPoolSize: 0,
        autoIndex: false,
      })
      .catch((error) => {
        cache.mongoPromise = undefined;
        throw error;
      });
  return cache.mongoPromise;
}
