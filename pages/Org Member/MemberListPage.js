import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

export class MemberListPage extends BasePage {
  constructor(page) {
    super(page);
    this.addMemberBtn = page.getByRole('button', { name: /Add Member/i });
    this.searchInput = page.locator('input[placeholder*="Search List"]');
  }

  async navigateTo() {
    await this.navigate(`${ENV.BASE_URL}/member-list`);
    await this.addMemberBtn.waitFor({ state: 'visible', timeout: 10000 });
  }

  async clickAddMember() {
    await this.addMemberBtn.click();
  }

  async searchMember(name) {
    await this.searchInput.fill(name);
  }

  getMemberLocator(name) {
    return this.page.getByText(name, { exact: false }).first();
  }

  /**
   * Web-first assertion: expect() re-resolves the locator on every poll, so it
   * tolerates the list re-rendering/detaching during async load.
   */
  async verifyMemberVisible(name) {
    await expect(this.getMemberLocator(name)).toBeVisible({ timeout: 15000 });
  }
}
