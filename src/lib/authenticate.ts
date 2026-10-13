import { compare } from "bcryptjs";
import { connectDb } from "./db";
import { consumeLimit } from "./rate-limit";
import { AppError } from "./errors";
import { User } from "@/models";
import { loginSchema } from "@/validators/tickets";

export async function authorizeCredentials(credentials: unknown) {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) return null;
  await connectDb();
  const { email, password } = parsed.data;
  try {
    await consumeLimit(email, "login", 10, 600_000);
  } catch (error) {
    if (error instanceof AppError && error.status === 429) return null;
    throw error;
  }
  const user = await User.findOne({ email }).select("+passwordHash");
  const passwordHash =
    user?.passwordHash ||
    "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxGgN8YSIcOwBPCUYlcPzLGUn6K";
  const valid = await compare(password, passwordHash);
  if (!user || !user.isActive || !valid) return null;
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    sessionVersion: user.sessionVersion ?? 0,
  };
}
