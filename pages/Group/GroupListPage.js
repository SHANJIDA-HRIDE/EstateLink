import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

export class GroupListPage extends BasePage {
  constructor(page) {
    super(page);
    this.addGroupBtn = page.getByRole('button', { name: /^Add Group$/i });
  }

  async navigateTo() {
    await this.navigate(`${ENV.BASE_URL}/group-list`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1000);
    console.log('Group List page loaded');
  }

  async clickAddGroup() {
    await this.addGroupBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async verifyGroupListLoaded() {
    await this.addGroupBtn.waitFor({ state: 'visible', timeout: 10000 });
  }
}
