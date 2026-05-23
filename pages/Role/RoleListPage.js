import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

export class RoleListPage extends BasePage {
  constructor(page) {
    super(page);
    this.addRoleBtn = page.getByRole('button', { name: /^Add Role$/i });
  }

  async navigateTo() {
    await this.navigate(`${ENV.BASE_URL}/role-list`);
    await this.verifyRoleListLoaded();
  }

  async clickAddRole() {
    await this.addRoleBtn.click();
  }

  async verifyRoleListLoaded() {
    await this.addRoleBtn.waitFor({ state: 'visible', timeout: 10000 });
  }
}
