import path from "node:path";
import { test, expect } from "@playwright/test";

test("uploads an image, asks to crop it to a square, and sees the cropped result", async ({ page }) => {
  await page.goto("/");

  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(path.join(import.meta.dirname, "fixtures/test-image.png"));

  const chip = page.getByRole("button", { name: "Open test-image.png" });
  await expect(chip).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove test-image.png" })).toBeVisible({ timeout: 30_000 });

  await page.getByPlaceholder("Assign a task or ask anything...").fill("Crop this image to a centered square. Pick the crop yourself, don't ask me anything.");
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page).toHaveURL(/\/chat\/[^/]+$/, { timeout: 15_000 });
  // A real Magica run can take a few minutes.
  await expect(page.getByRole("button", { name: "Copy message" })).toBeVisible({ timeout: 180_000 });

  await expect(page.locator("img").last()).toBeVisible({ timeout: 30_000 });
});
