import { describe, expect, it } from "vitest";
import {
  newTicketSchema,
  commentSchema,
  ticketQuerySchema,
  loginSchema,
} from "@/validators/tickets";
import { userCreateSchema } from "@/validators/users";
describe("untrusted ticket inputs", () => {
  it("rejects passwords bcrypt would truncate, including multibyte text", () => {
    const user = {
      name: "Test User",
      email: "test@techdesk.example",
      role: "EMPLOYEE",
    };
    expect(
      userCreateSchema.safeParse({ ...user, password: "a".repeat(73) }).success,
    ).toBe(false);
    expect(
      userCreateSchema.safeParse({ ...user, password: "🔒".repeat(19) })
        .success,
    ).toBe(false);
    expect(
      userCreateSchema.safeParse({ ...user, password: "a".repeat(72) }).success,
    ).toBe(true);
    expect(
      loginSchema.parse({
        email: " User@techdesk.example ",
        password: "valid-password",
      }).email,
    ).toBe("user@techdesk.example");
  });
  it("rejects forged creator, priority, and internal comment fields", () => {
    const ticket = {
      title: "Connection issue",
      description: "Cannot connect to the network.",
      category: "NETWORK",
    };
    for (const field of ["createdById", "priority", "status", "role"])
      expect(
        newTicketSchema.safeParse({ ...ticket, [field]: "forged" }).success,
      ).toBe(false);
    expect(
      commentSchema.safeParse({ message: "Hello", isInternal: true }).success,
    ).toBe(false);
  });
  it("bounds pagination and trims text", () => {
    expect(ticketQuerySchema.safeParse({ pageSize: 101 }).success).toBe(false);
    expect(ticketQuerySchema.safeParse({ page: -1 }).success).toBe(false);
    expect(commentSchema.parse({ message: "  Details  " }).message).toBe(
      "Details",
    );
    expect(commentSchema.safeParse({ message: "   " }).success).toBe(false);
  });
});
