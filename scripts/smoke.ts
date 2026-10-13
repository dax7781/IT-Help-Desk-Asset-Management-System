import { config } from "dotenv";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { demoIds } from "./seed-data";
import { encode } from "next-auth/jwt";
config({ path: ".env.local", quiet: true });
const base = process.env.SMOKE_URL || "http://localhost:3000";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error(
    "Smoke writes are restricted to a loopback demo environment.",
  );
class Client {
  cookies = new Map<string, string>();
  async request(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    headers.set(
      "Cookie",
      [...this.cookies].map(([k, v]) => k + "=" + v).join("; "),
    );
    const response = await fetch(base + path, {
      ...options,
      headers,
      redirect: "manual",
    });
    for (const raw of response.headers.getSetCookie()) {
      const pair = raw.split(";")[0];
      const split = pair.indexOf("=");
      this.cookies.set(pair.slice(0, split), pair.slice(split + 1));
    }
    return response;
  }
  async login(email: string, password = process.env.DEMO_PASSWORD!) {
    const csrf = await (await this.request("/api/auth/csrf")).json();
    const response = await this.request("/api/auth/callback/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Auth-Return-Redirect": "1",
        Origin: base,
      },
      body: new URLSearchParams({
        email,
        password,
        csrfToken: csrf.csrfToken,
        callbackUrl: base + "/dashboard",
      }),
    });
    const result = await response.json();
    assert.ok(!result.url.includes("error="), "Demo login failed");
  }
  async post(path: string, body: unknown, origin = base) {
    return this.request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify(body),
    });
  }
  async patch(path: string, body: unknown) {
    return this.request(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify(body),
    });
  }
}
async function main() {
  if (!process.env.DEMO_PASSWORD)
    throw new Error("Run npm run dev first to create local demo credentials.");
  const anonymous = new Client();
  assert.equal((await anonymous.request("/api/tickets")).status, 401);
  const loginPage = await anonymous.request("/login");
  assert.equal(loginPage.status, 200);
  assert.equal(loginPage.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(loginPage.headers.get("X-Frame-Options"), "DENY");
  const policy = loginPage.headers.get("Content-Security-Policy")!;
  const nonce = /'nonce-([^']+)'/.exec(policy)?.[1];
  assert.ok(nonce, "HTML must have a nonce policy");
  if (process.env.NODE_ENV === "production") assert.ok(!policy.includes("unsafe-eval"));
  const html = await loginPage.text();
  const scripts = [...html.matchAll(/<script\b[^>]*>/g)];
  assert.ok(scripts.length > 0);
  assert.ok(scripts.every((match) => match[0].includes(`nonce="${nonce}"`)), "Every document script must match its CSP nonce");
  const anotherPolicy = (await anonymous.request("/login")).headers.get("Content-Security-Policy");
  assert.notEqual(anotherPolicy, policy, "Nonce must change between requests");
  assert.equal((await anonymous.post("/api/auth/callback/credentials", {}, "https://untrusted.example")).status, 403);
  assert.equal((await anonymous.post("/api/auth/callback/credentials", { padding: "x".repeat(33000) })).status, 413);
  const expired = new Client();
  expired.cookies.set("authjs.session-token", await encode({ token: { sub: demoIds.employee, sessionVersion: 0 }, secret: process.env.AUTH_SECRET!, salt: "authjs.session-token", maxAge: -60 }));
  assert.equal((await expired.request("/api/tickets")).status, 401);
  const tampered = new Client();
  tampered.cookies.set("authjs.session-token", "invalid-session-token");
  assert.equal((await tampered.request("/api/tickets")).status, 401);
  const employee = new Client();
  await employee.login("employee@techdesk.example");
  const tickets = await (await employee.request("/api/tickets")).json();
  assert.ok(
    tickets.items.every((t: { id: string }) => t.id !== demoIds.otherTicket),
  );
  assert.equal(
    (await employee.request("/api/tickets/" + demoIds.otherTicket)).status,
    404,
  );
  const detail = await (
    await employee.request("/api/tickets/" + demoIds.ticket)
  ).json();
  assert.ok(
    detail.comments.every((c: { isInternal: boolean }) => !c.isInternal),
  );
  assert.ok(
    detail.history.every(
      (h: { eventType: string }) => h.eventType !== "INTERNAL_COMMENT",
    ),
  );
  assert.equal(
    (
      await employee.post(
        "/api/tickets",
        {
          title: "API check",
          description: "Fictional smoke test description.",
          category: "OTHER",
        },
        "https://untrusted.example",
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await employee.post("/api/tickets", {
        title: "API check",
        description: "Fictional smoke test description.",
        category: "OTHER",
        createdById: demoIds.admin,
      })
    ).status,
    422,
  );
  const createdResponse = await employee.post("/api/tickets", {
    title: "API smoke verification ticket",
    description: "Fictional API verification of phases three through six.",
    category: "OTHER",
    assetId: demoIds.laptop,
  });
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json();
  assert.equal(created.status, "OPEN");
  assert.equal(created.priority, "MEDIUM");
  assert.equal(
    (
      await employee.post("/api/tickets/" + created.id + "/comments", {
        message: "Public API verification comment.",
      })
    ).status,
    201,
  );
  const updated = await (
    await employee.request("/api/tickets/" + created.id)
  ).json();
  assert.equal(updated.comments.length, 1);
  assert.equal(updated.history.length, 2);
  const clients: Client[] = [];
  for (const email of [
    "technician@techdesk.example",
    "admin@techdesk.example",
  ]) {
    const staff = new Client();
    clients.push(staff);
    await staff.login(email);
    assert.equal(
      (await staff.request("/api/tickets/" + demoIds.otherTicket)).status,
      200,
    );
    const staffDetail = await (
      await staff.request("/api/tickets/" + demoIds.ticket)
    ).json();
    assert.ok(
      staffDetail.comments.some((c: { isInternal: boolean }) => c.isInternal),
    );
  }
  const [technician, admin] = clients;
  const path = `/api/tickets/${created.id}`;
  const state = async () => (await employee.request(path)).json();
  const transition = async (client: Client, action: string, fields = {}) =>
    client.post(path + "/transitions", {
      action,
      version: (await state()).version,
      ...fields,
    });
  assert.equal(
    (
      await employee.post(path + "/assignment", {
        action: "CLAIM",
        version: updated.version,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await technician.post(path + "/assignment", {
        action: "CLAIM",
        version: updated.version,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await technician.post(path + "/assignment", {
        action: "CLAIM",
        version: updated.version,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await technician.post(path + "/comments", {
        message: "Private HTTP diagnostic note",
        isInternal: true,
      })
    ).status,
    201,
  );
  const safe = await state();
  assert.equal(safe.comments.length, 1);
  assert.equal(safe.history.length, 3);
  assert.ok(!JSON.stringify(safe).includes("Private HTTP"));
  assert.equal(
    (
      await employee.post(path + "/comments", {
        message: "Forged private note",
        isInternal: true,
      })
    ).status,
    403,
  );
  assert.equal(
    (await transition(technician, "RESOLVE", { reason: "Cannot skip start." }))
      .status,
    422,
  );
  assert.equal((await transition(technician, "START")).status, 200);
  assert.equal(
    (
      await transition(technician, "RESOLVE", {
        reason: "Corrected fictional wireless settings.",
      })
    ).status,
    200,
  );
  assert.equal((await transition(technician, "CLOSE")).status, 200);
  assert.equal(
    (
      await transition(employee, "REOPEN", {
        reason: "Fictional recurrence for verification.",
      })
    ).status,
    200,
  );
  assert.equal((await transition(technician, "START")).status, 200);
  assert.equal(
    (
      await transition(technician, "RESOLVE", {
        reason: "Second verification resolution.",
      })
    ).status,
    200,
  );
  const equipment = {
    assetTag: "TD-SMOKE-" + randomUUID().slice(0, 8).toUpperCase(),
    type: "MONITOR",
    manufacturer: "Dell",
    model: "Fictional verification display",
    location: "Demo office",
    notes: "Staff-only HTTP inventory note",
    serialNumber: "SMOKE-" + randomUUID(),
    purchaseDate: null,
    warrantyUntil: null,
  };
  assert.equal((await employee.post("/api/assets", equipment)).status, 403);
  const assetResponse = await admin.post("/api/assets", equipment);
  assert.equal(assetResponse.status, 201);
  const asset = await assetResponse.json();
  assert.equal((await admin.post("/api/assets", equipment)).status, 409);
  assert.equal(
    (
      await technician.post(`/api/assets/${asset.id}/assignment`, {
        version: 0,
        assignedUserId: demoIds.employee,
      })
    ).status,
    200,
  );
  const owned = await (
    await employee.request(`/api/assets/${asset.id}`)
  ).json();
  assert.equal(owned.assetTag, equipment.assetTag);
  assert.ok(!("notes" in owned));
  assert.ok(!("serialNumber" in owned));
  assert.equal(
    (
      await admin.patch(`/api/assets/${asset.id}`, {
        ...equipment,
        version: 1,
        status: "RETIRED",
        assignedUserId: null,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await technician.post(`/api/assets/${asset.id}/assignment`, {
        version: 2,
        assignedUserId: demoIds.employee,
      })
    ).status,
    422,
  );
  assert.equal((await employee.request(`/api/assets/${asset.id}`)).status, 404);
  assert.equal((await technician.request("/api/admin/users")).status, 403);
  const password = "Smoke-" + randomUUID();
  const newUserResponse = await admin.post("/api/admin/users", {
    name: "HTTP Verification User",
    email: `smoke-${randomUUID()}@techdesk.example`,
    role: "EMPLOYEE",
    password,
  });
  assert.equal(newUserResponse.status, 201);
  const user = await newUserResponse.json();
  assert.ok(!("passwordHash" in user));
  const newClient = new Client();
  await newClient.login(user.email, password);
  assert.equal((await newClient.request("/api/tickets")).status, 200);
  assert.equal(
    (
      await admin.patch(`/api/admin/users/${user.id}`, {
        version: 0,
        role: "EMPLOYEE",
        isActive: false,
      })
    ).status,
    200,
  );
  assert.equal((await newClient.request("/api/tickets")).status, 401);
  assert.equal((await admin.patch(`/api/admin/users/${user.id}`, { version: 1, role: "EMPLOYEE", isActive: true })).status, 200);
  assert.equal((await newClient.request("/api/tickets")).status, 401, "Reactivation must not restore a revoked session");
  await newClient.login(user.email, password);
  assert.equal((await newClient.request("/api/tickets")).status, 200);
  assert.equal((await admin.patch(`/api/admin/users/${user.id}`, { version: 2, role: "TECHNICIAN", isActive: true })).status, 200);
  assert.equal((await newClient.request("/api/tickets")).status, 401, "Role change requires a fresh session");
  await newClient.login(user.email, password);
  assert.equal((await newClient.request("/api/admin/users")).status, 403);
  assert.equal((await admin.patch(`/api/admin/users/${user.id}`, { version: 3, role: "TECHNICIAN", isActive: false })).status, 200);
  const activeAdmins = await (
    await admin.request("/api/admin/users?role=ADMIN&active=true")
  ).json();
  if (activeAdmins.total === 1 && activeAdmins.items[0].id === demoIds.admin) {
    assert.equal(
      (
        await admin.patch(`/api/admin/users/${demoIds.admin}`, {
          version: activeAdmins.items[0].version,
          role: "EMPLOYEE",
          isActive: true,
        })
      ).status,
      422,
    );
  }
  const metrics = await (await admin.request("/api/dashboard/stats")).json();
  assert.equal(metrics.scope, "Organization");
  assert.equal(metrics.categories.length, 5);
  assert.ok(metrics.resolvedInWindow >= 1);
  const ownMetrics = await (
    await employee.request("/api/dashboard/stats")
  ).json();
  assert.deepEqual(ownMetrics.categories, []);
  assert.deepEqual(ownMetrics.workload, []);
  const techMetrics = await (
    await technician.request("/api/dashboard/stats")
  ).json();
  assert.deepEqual(techMetrics.categories, []);
  assert.equal(techMetrics.workload[0].id, demoIds.technician);
  console.log(
    "HTTP smoke passed: three roles, nonce/security headers, expired/tampered sessions, origin/body limits, ownership, full ticket lifecycle, private notes, assets, user access/session revocation, last-admin protection, and scoped analytics.",
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
