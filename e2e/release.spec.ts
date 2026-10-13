import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
const output = path.resolve("docs/design/screenshots");

async function login(page: Page, role: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(`${role}@techdesk.example`);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Sign in to TechDesk" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
async function mobile(page: Page, screenshot?: string) {
  await expect(page.locator(".loading-state")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      )
      .toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  // Capture the page at rest; keyboard-focus behavior is tested separately.
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
  if (screenshot)
    await page.screenshot({
      path: path.join(output, screenshot),
      fullPage: true,
    });
}

test("production role workflow, confidential notes, mobile layout and keyboard focus", async ({
  browser,
}) => {
  if (
    !process.env.RELEASE_BROWSER_TEST ||
    !process.env.DEMO_PASSWORD ||
    !process.env.SMOKE_URL
  )
    throw new Error(
      "Run npm run test:browser: it provides an isolated production database and credentials.",
    );
  await mkdir(output, { recursive: true });
  const issues: string[] = [];
  const contexts: BrowserContext[] = [];
  async function rolePage(role: string) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      baseURL: process.env.SMOKE_URL,
    });
    contexts.push(context);
    const page = await context.newPage();
    page.setDefaultTimeout(15_000);
    page.on("pageerror", (error) =>
      issues.push(error.name + ": " + error.message),
    );
    page.on("console", (message) => {
      if (message.type() === "error") issues.push(message.text());
    });
    await login(page, role);
    return page;
  }
  try {
    const employee = await rolePage("employee");
    await mobile(employee);
    await employee
      .getByRole("link", { name: "My equipment", exact: true })
      .click();
    await expect(employee.getByText("TD-LAP-001")).toBeVisible();
    await employee.goto("/assets/55555555-5555-4555-8555-555555555555");
    await employee.getByRole("link", { name: "Report an issue" }).click();
    const requester = employee.getByRole("region", {
      name: "Requester information",
    });
    await expect(
      requester.getByText("Alex Morgan", { exact: true }),
    ).toBeVisible();
    await expect(
      requester.getByText("employee@techdesk.example", { exact: true }),
    ).toBeVisible();
    await expect(requester.locator("code")).toHaveText(
      "11111111-1111-4111-8111-111111111111",
    );
    await expect(requester.locator("input")).toHaveCount(0);
    await expect(
      employee
        .getByRole("complementary", { name: "Request guidance" })
        .getByText("TD-LAP-001", { exact: true }),
    ).toBeVisible();
    await employee.setViewportSize({ width: 1440, height: 1000 });
    await employee.screenshot({
      path: path.join(output, "release-new-ticket-desktop.png"),
      fullPage: true,
    });
    await mobile(employee, "release-new-ticket-mobile.png");
    await employee.getByLabel("Affected equipment").selectOption("");
    await expect(
      employee
        .locator(".intake-equipment")
        .getByText("TD-LAP-001", { exact: true }),
    ).toHaveCount(0);
    await employee
      .getByLabel("Issue title")
      .fill("Production browser verification: display issue");
    await employee
      .getByLabel("Description")
      .fill(
        "Fictional browser verification: the assigned laptop display flickers.",
      );
    await employee
      .getByLabel("Affected equipment")
      .selectOption("55555555-5555-4555-8555-555555555555");
    await employee
      .getByRole("button", { name: "Submit ticket", exact: true })
      .click();
    await expect(employee).toHaveURL(/\/tickets\/[a-f0-9-]+\?created=1$/);
    const ticketUrl = employee.url().split("?")[0];
    await expect(
      employee.getByRole("heading", {
        name: "Production browser verification: display issue",
      }),
    ).toBeVisible();

    const technician = await rolePage("technician");
    await technician.goto("/tickets/new");
    await expect(
      technician
        .getByRole("region", { name: "Requester information" })
        .getByText("Sam Rivera", { exact: true }),
    ).toBeVisible();
    await technician.goto(ticketUrl);
    await technician.getByRole("button", { name: "Claim ticket" }).click();
    await expect(
      technician.getByRole("button", { name: "Start work" }),
    ).toBeVisible();
    await technician.getByRole("button", { name: "Start work" }).click();
    await technician.getByLabel("Internal note").check();
    await technician
      .getByLabel("Add an internal note", { exact: true })
      .fill("Private production browser diagnostic: replacement cable tested.");
    await technician
      .getByRole("button", { name: "Post internal note" })
      .click();
    await expect(
      technician.getByText(
        "Private production browser diagnostic: replacement cable tested.",
        { exact: true },
      ),
    ).toBeVisible();
    await technician
      .getByLabel("Resolution summary")
      .fill(
        "Replaced the fictional display cable and verified normal operation.",
      );
    await technician.getByRole("button", { name: "Resolve ticket" }).click();
    await expect(
      technician.getByRole("button", { name: "Close ticket" }),
    ).toBeVisible();
    await technician.getByRole("button", { name: "Close ticket" }).click();
    await expect(
      technician.getByRole("button", { name: "Reopen ticket" }),
    ).toBeVisible();
    await employee.reload();
    await expect(
      employee.getByText(
        "Private production browser diagnostic: replacement cable tested.",
      ),
    ).toHaveCount(0);
    await employee
      .getByLabel("Reason for reopening")
      .fill("The fictional display issue returned after the repair.");
    await employee.getByRole("button", { name: "Reopen ticket" }).click();
    await expect(
      employee.getByRole("heading", { name: "Reopen request" }),
    ).toHaveCount(0);
    await mobile(employee, "release-workflow-mobile.png");
    await expect(
      employee.locator('.ticket-stage [aria-current="step"]'),
    ).toContainText("Assigned");
    await employee
      .getByLabel("Search all accessible tickets")
      .fill("Production browser verification");
    await employee
      .getByRole("button", { name: "Run workspace search" })
      .click();
    await expect(employee).toHaveURL(/\/tickets\?search=Production/);
    await expect(
      employee.getByRole("link", {
        name: "Production browser verification: display issue",
      }),
    ).toBeVisible();
    await mobile(employee, "release-tickets-mobile.png");
    await employee
      .getByRole("navigation", { name: "Ticket views" })
      .getByRole("link", { name: "Work in progress", exact: true })
      .click();
    await expect(employee).toHaveURL(/status=IN_PROGRESS/);
    await expect(
      employee.getByRole("link", { name: "Work in progress", exact: true }),
    ).toHaveAttribute("aria-current", "page");

    const admin = await rolePage("admin");
    await expect(
      admin.getByRole("heading", { name: "Requests by category" }),
    ).toBeVisible();
    await admin.screenshot({
      path: path.join(output, "release-dashboard-desktop.png"),
      fullPage: true,
    });
    await mobile(admin, "release-dashboard-mobile.png");
    // A workload deep link must retain its staff selection when other filters apply.
    const staffLink = admin
      .locator('.compact-table a[href^="/tickets?assignee="]')
      .filter({ hasText: "Sam" })
      .first();
    const staffHref = await staffLink.getAttribute("href");
    expect(staffHref).toBeTruthy();
    await staffLink.click();
    await expect(admin).toHaveURL(new RegExp("/tickets\\?assignee="));
    const assignee = new URL(
      staffHref!,
      process.env.SMOKE_URL,
    ).searchParams.get("assignee");
    await expect(admin.getByLabel("Assignment filter")).toHaveValue(assignee!);
    await admin.getByRole("button", { name: "Filter", exact: true }).click();
    expect(new URL(admin.url()).searchParams.get("assignee")).toBe(assignee);
    await admin.setViewportSize({ width: 1440, height: 1000 });
    await admin.screenshot({
      path: path.join(output, "release-tickets-desktop.png"),
      fullPage: true,
    });
    await admin.goto(ticketUrl);
    await expect(
      admin.getByRole("heading", {
        name: "Production browser verification: display issue",
      }),
    ).toBeVisible();
    await admin.screenshot({
      path: path.join(output, "release-record-desktop.png"),
      fullPage: true,
    });
    await admin.goto("/assets");
    await mobile(admin, "release-equipment-mobile.png");
    await admin.getByRole("link", { name: "Users", exact: true }).click();
    await expect(admin.getByRole("heading", { name: /^Users/ })).toBeVisible();
    await mobile(admin, "release-users-mobile.png");
    await admin.getByLabel("Full name", { exact: true }).focus();
    await admin.keyboard.press("Tab");
    await expect(admin.getByLabel("Email", { exact: true })).toBeFocused();
    await admin.goto("/dashboard");
    await admin.keyboard.press("Tab");
    await expect(
      admin.getByRole("link", { name: "Skip to content" }),
    ).toBeFocused();
    await admin.keyboard.press("Enter");
    await expect(admin.locator("main")).toBeFocused();
    await employee.getByRole("button", { name: "Sign out" }).click();
    await expect(employee).toHaveURL(/\/login$/);
    expect(issues).toEqual([]);
  } finally {
    for (const context of contexts) await context.close().catch(() => {});
  }
});
