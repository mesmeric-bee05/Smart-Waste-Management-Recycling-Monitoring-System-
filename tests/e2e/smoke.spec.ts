import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, emailVariable: string, passwordVariable: string) {
  const email = process.env[emailVariable];
  const password = process.env[passwordVariable];
  if (!email || !password) throw new Error(`${emailVariable} and ${passwordVariable} must be set for E2E.`);
  await page.goto("/login");
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Sign in securely" }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/, { timeout: 20_000 });
}

test("public landing routes staff and resident actions and labels its illustrative data", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Make every collection count." })).toBeVisible();
  await expect(page.getByText("SIMULATED", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Fictional example values only/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Staff sign in/i }).first()).toHaveAttribute("href", "/login");
  await expect(page.getByRole("link", { name: "Submit a collection request" })).toHaveAttribute(
    "href",
    "/report",
  );

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibility.violations.map(({ id, impact, help }) => ({ id, impact, help }))).toEqual([]);

  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("heading", { name: "Make every collection count." })).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  }

  await page.getByRole("link", { name: "Submit a collection request" }).click();
  await expect(page).toHaveURL(/\/report$/);
});

test("staff sign-in is invitation-only and the password visibility control works", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in to WasteOps" })).toBeVisible();
  await expect(page.getByText(/there is no public self-sign-up/i)).toBeVisible();

  const password = page.getByRole("textbox", { name: "Password" });
  const reveal = page.getByRole("button", { name: "Show password" });
  await expect(password).toHaveAttribute("type", "password");
  await reveal.click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(page.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(password).toHaveAttribute("type", "password");

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibility.violations.map(({ id, impact, help }) => ({ id, impact, help }))).toEqual([]);

  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("button", { name: "Sign in securely" })).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  }
});

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

test("administrator can enable optional telemetry 3D without motion under reduced-motion preference", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await signIn(page, "INITIAL_ADMIN_EMAIL", "INITIAL_ADMIN_PASSWORD");
  await page.goto("/telemetry");
  await expect(page.getByRole("heading", { name: "Simulated telemetry" })).toBeVisible();
  await expect(
    page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches),
  ).resolves.toBe(true);

  const fallback = page.getByRole("img", { name: /Illustrative simulated bin fill: \d+ percent/ });
  await expect(fallback).toBeVisible();
  const enable = page.getByRole("button", { name: "Enable 3D" });
  await enable.scrollIntoViewIfNeeded();
  await expect(enable).toHaveAttribute("aria-pressed", "false");
  await enable.click();

  const canvas = page.locator("canvas");
  await expect(page.getByRole("button", { name: "Disable 3D" })).toHaveAttribute("aria-pressed", "true");
  await expect(canvas).toBeVisible();
  const sceneIsDecorative = await canvas.evaluate((node) => node.closest('[aria-hidden="true"]') !== null);
  expect(sceneIsDecorative).toBe(true);
  await expect(
    page.getByText(/reduced-motion preference skips the turn and disables rotation/),
  ).toBeVisible();
  await expect(page.getByText("SIMULATED ONLY", { exact: true })).toBeVisible();

  const accessibility = await new AxeBuilder({ page })
    .include('section[aria-labelledby="visualization-title"]')
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibility.violations.map(({ id, impact, help }) => ({ id, impact, help }))).toEqual([]);

  await page.getByRole("button", { name: "Disable 3D" }).click();
  await expect(canvas).toHaveCount(0);
  await expect(fallback).toBeVisible();
});

test("public request page meets WCAG A/AA checks", async ({ page }) => {
  await page.goto("/report");
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibility.violations.map(({ id, impact, help }) => ({ id, impact, help }))).toEqual([]);
});
