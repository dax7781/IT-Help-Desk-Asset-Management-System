import { auth } from "./auth";
import { connectDb } from "./db";
import { User } from "@/models";
import { AppError } from "./errors";
import type { Actor } from "./permissions";
import { redirect } from "next/navigation";
import { assertMutationOrigin } from "./api";
import { limitMutations } from "./rate-limit";
export async function currentUser(): Promise<Actor | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  await connectDb();
  const user = await User.findById(session.user.id)
    .select("_id name email role isActive sessionVersion")
    .lean();
  if (
    !user?.isActive ||
    (user.sessionVersion ?? 0) !== session.user.sessionVersion
  )
    return null;
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}
export async function requireUser(): Promise<Actor> {
  const user = await currentUser();
  if (!user)
    throw new AppError(401, "UNAUTHENTICATED", "Please sign in to continue.");
  return user;
}
export async function requirePageUser(): Promise<Actor> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
export async function requireMutationUser(request: Request): Promise<Actor> {
  const user = await requireUser();
  assertMutationOrigin(request);
  await limitMutations(user.id);
  return user;
}
