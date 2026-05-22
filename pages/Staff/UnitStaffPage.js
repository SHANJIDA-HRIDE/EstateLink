import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';

export class UnitStaffPage extends BasePage {
  constructor(page) {
    super(page);
    // Buttons
    this.addStaffBtn = page.getByRole('button', { name: /^Add Unit Staff$/i });
    
    // Success verification
    this.successMessage = page.getByText(/successfully/i);
  }

  async navigateToStaffTab(unitDetailsUrl) {
    await this.page.goto(`${unitDetailsUrl}?tab=4`);
    await expect(this.page).toHaveURL(/\/unit-details\/\d+\?tab=4$/);
  }

  async clickAddStaff() {
    await this.addStaffBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async verifyStaffAdded(unitDetailsUrl, staffData) {
    await expect(async () => {
      await this.navigateToStaffTab(unitDetailsUrl);
      await expect(this.page.getByText(staffData.name).filter({ visible: true }).first()).toBeVisible({
        timeout: 5000,
      });
      await expect(this.page.getByText(staffData.email).filter({ visible: true }).first()).toBeVisible({
        timeout: 5000,
      });
    }).toPass({
      intervals: [1000, 2000, 5000],
      timeout: 45000,
    });
  }

  async verifyStaffNameAdded(unitDetailsUrl, staffName) {
    await expect(async () => {
      await this.navigateToStaffTab(unitDetailsUrl);
      await expect(this.page.getByText(staffName).filter({ visible: true }).first()).toBeVisible({
        timeout: 5000,
      });
    }).toPass({
      intervals: [1000, 2000, 5000],
      timeout: 45000,
    });
  }
}
