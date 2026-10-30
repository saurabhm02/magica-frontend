import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { test as setup, expect } from "@playwright/test";

const STORAGE_STATE = "playwright/.clerk/user.json";

setup("authenticate as the e2e test user", async ({ page }) => {
  const email = process.env.E2E_CLERK_USER_EMAIL;
  if (!email) throw new Error("Set E2E_CLERK_USER_EMAIL in client/.env to run e2e tests.");

  await clerkSetup();
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: email });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your AI worker" })).toBeVisible();

  await page.context().storageState({ path: STORAGE_STATE });
});
