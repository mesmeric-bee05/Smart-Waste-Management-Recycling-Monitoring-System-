import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, emailVariable: string, passwordVariable: string) {
  const email = process.env[emailVariable];
  const password = process.env[passwordVariable];
  if (!email || !password) throw new Error(`${emailVariable} and ${passwordVariable} must be set for E2E.`);
  await page.goto("/login");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in securely" }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/, { timeout: 20_000 });
}

test("resident can submit a fictional public request and receives a safe reference", async ({ page }) => {
  await page.goto("/report");
  await page
    .getByLabel("What needs attention?")
    .fill("Playwright sample collection request. No resident data.");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("status")).toContainText("Request received");
  await expect(page.getByRole("status")).toContainText(/Reference: [A-Z0-9]{8}/);
});

test("administrator can sign in, see simulation provenance, export CSV, and use an accessible dashboard", async ({
  page,
}) => {
  await signIn(page, "INITIAL_ADMIN_EMAIL", "INITIAL_ADMIN_PASSWORD");
  await expect(
    page.getByRole("heading", { name: "Collection activity, without the guesswork." }),
  ).toBeVisible();
  await expect(page.getByText("SIMULATED", { exact: true }).first()).toBeVisible();

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibility.violations.map(({ id, impact, help }) => ({ id, impact, help }))).toEqual([]);

  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 60 * 86_400_000).toISOString().slice(0, 10);
  const query = new URLSearchParams({ format: "csv", from, to });
  const response = await page.request.get(`/api/reports/export?${query}`);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/csv");
  expect(response.headers()["cache-control"]).toBe("private, no-store");
  expect(await response.text()).toContain("REPORT_METADATA");
});

test("collector cannot enter administrator-only account management", async ({ page }) => {
  await signIn(page, "INITIAL_COLLECTOR_EMAIL", "INITIAL_COLLECTOR_PASSWORD");
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/dashboard\?notice=not-authorized$/);
});

test("public request page meets WCAG A/AA checks", async ({ page }) => {
  await page.goto("/report");
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibility.violations.map(({ id, impact, help }) => ({ id, impact, help }))).toEqual([]);
});
