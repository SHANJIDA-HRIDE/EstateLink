import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/Login/LoginPage';
import credentials from '../test-data/credentials.json';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  // 1. Navigate to the login page using the new method
  await loginPage.navigateToLogin();
  
  // 2. Perform login using credentials from test-data
  const adminCreds = credentials.users.admin;
  await loginPage.login(adminCreds.email, adminCreds.password);
  
  // 3. Wait for navigation to complete after login
  // We use the inherited waitForUrl from BasePage
  await loginPage.waitForUrl(url => !url.href.includes('/login'));
  await loginPage.waitForNetworkIdle();

  // 4. Save the storage state (cookies, local storage) to a file
  await page.context().storageState({ path: authFile });
});
