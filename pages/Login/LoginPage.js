import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

export class LoginPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page); // call BasePage constructor
    
    // Step 1: Email/Username input and Next button
    this.emailInput = page.locator('input#usernameOrEmail');
    this.nextButton = page.getByRole('button', { name: 'Next' });

    // Step 2: Password input and Login button
    this.passwordInput = page.locator('input[placeholder="Enter password"]');
    this.loginButton = page.getByRole('button', { name: 'Login', exact: true });
  }

  async navigateToLogin() {
    // Using inherited navigate method and ENV config
    await this.navigate(`${ENV.BASE_URL}/login`);
  }

  async login(email, password) {
    // Step 1: Enter email and click next
    await this.emailInput.fill(email);
    await this.nextButton.click();

    // Wait for the password input to be visible before filling it
    await this.passwordInput.waitFor({ state: 'visible' });
    
    // Step 2: Enter password and click login
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
