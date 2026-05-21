import { BasePage } from './BasePage';
import { ENV } from '../env/env.config';

export class RoleListPage extends BasePage {
  constructor(page) {
    super(page);
    this.addRoleBtn = page.getByRole('button', { name: /^Add Role$/i });
  }

  async navigateTo() {
    await this.navigate(`${ENV.BASE_URL}/role-list`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1000);
    console.log('Role List page loaded');
  }

  async clickAddRole() {
    await this.addRoleBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async verifyRoleListLoaded() {
    await this.addRoleBtn.waitFor({ state: 'visible', timeout: 10000 });
  }
}
