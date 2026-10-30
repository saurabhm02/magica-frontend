import { test, expect } from "@playwright/test";

test("creates a chat, sends a message, and sees the reply stream in", async ({ page }) => {
  await page.goto("/");

  const prompt = `Reply with one short sentence. (e2e ${Date.now()})`;
  await page.getByPlaceholder("Assign a task or ask anything...").fill(prompt);
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page).toHaveURL(/\/chat\/[^/]+$/, { timeout: 15_000 });
  await expect(page.getByText(prompt)).toBeVisible();

  // The assistant bubble only renders a "Copy message" action once the turn reaches status "complete".
  await expect(page.getByRole("button", { name: "Copy message" })).toBeVisible({ timeout: 60_000 });
});
