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
  }

  async clickAddMember() {
    await this.addMemberBtn.click();
  }

  async searchMember(name) {
    await this.searchInput.fill(name);
    await this.waitForNetworkIdle();
  }

  getMemberLocator(name) {
    return this.page.getByText(name, { exact: false }).first();
  }

  async verifyMemberVisible(name) {
    const memberLocator = this.getMemberLocator(name);
    let lastError;
    
    // Retry up to 3 times in case of DOM re-renders causing detachment
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // Wait for element to exist in DOM
        await memberLocator.waitFor({ state: 'attached', timeout: 5000 });
        // Wait a bit for DOM to stabilize
        await this.page.waitForTimeout(300);
        // Scroll into view to ensure visibility
        await memberLocator.scrollIntoViewIfNeeded({ timeout: 5000 });
        // Verify it's now visible
        await memberLocator.waitFor({ state: 'visible', timeout: 5000 });
        return; // Success
      } catch (error) {
        lastError = error;
        if (attempt < 2) {
          // Wait before retry
          await this.page.waitForTimeout(500);
        }
      }
    }
    
    // If all retries failed, throw the error
    throw new Error(`Failed to verify member "${name}" is visible: ${lastError.message}`);
  }
}
