import { test, expect } from '@playwright/test';

test('dev server responds and page loads', async ({ page }) => {
  const response = await page.goto('/');
  expect(response).not.toBeNull();
  expect(response!.status()).toBeLessThan(400);
  await expect(page.locator('body')).toBeAttached();
});
