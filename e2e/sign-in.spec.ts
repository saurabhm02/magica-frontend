import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";

// Runs signed out, unlike the other specs which reuse the storage state from auth.setup.ts.
test.use({ storageState: { cookies: [], origins: [] } });

test("signs in with a Clerk test user and lands on the chat home", async ({ page }) => {
  const email = process.env.E2E_CLERK_USER_EMAIL;
  const password = process.env.E2E_CLERK_USER_PASSWORD;
  if (!email || !password) {
    throw new Error("Set E2E_CLERK_USER_EMAIL and E2E_CLERK_USER_PASSWORD in client/.env to run this test.");
  }

  await page.goto("/sign-in");
  await setupClerkTestingToken({ page });

  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // Clerk asks a new browser to confirm by email. Its test addresses (name+clerk_test@...) accept 424242.
  const codeInput = page.getByLabel("Enter verification code");
  if (await codeInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await codeInput.fill("424242");
  }

  await expect(page.getByRole("heading", { name: "Your AI worker" })).toBeVisible();
});
