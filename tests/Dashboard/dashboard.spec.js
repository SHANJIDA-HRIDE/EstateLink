import { test, expect } from '../../fixtures/customTest';
import { ENV } from '../../env/env.config';

test('verify session holds on dashboard', async ({ page }) => {
  // Navigate to dashboard using the ENV base URL
  await page.goto(`${ENV.BASE_URL}/`);
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Since we already logged in during the global setup, we should be at the dashboard.
  // The login page redirects away from /login, so we assert we're not on the login page.
  await expect(page).toHaveTitle(/EstateLink/);
  expect(page.url()).not.toContain('/login');
});
