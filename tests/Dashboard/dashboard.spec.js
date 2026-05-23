import { test, expect } from '../../fixtures/customTest';

test('session persists on dashboard after global setup login', async ({ page }) => {
  await page.goto('/');

  // Auth was performed in global setup; the dashboard must load without bouncing to /login.
  await expect(page).toHaveTitle(/EstateLink/);
  await expect(page).not.toHaveURL(/\/login/);
});
