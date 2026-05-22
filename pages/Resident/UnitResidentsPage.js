import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';

export class UnitResidentsPage extends BasePage {
  constructor(page) {
    super(page);
    // Buttons
    this.addResidentBtn = page.getByRole('button', { name: /^Add Resident$/i });
    
    // Success verification
    this.successMessage = page.getByText(/successfully/i);
  }

  async navigateToResidentsTab(unitDetailsUrl) {
    await this.page.goto(`${unitDetailsUrl}?tab=3`);
    await expect(this.page).toHaveURL(/\/unit-details\/\d+\?tab=3$/);
  }

  async clickAddResident() {
    await this.addResidentBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async verifyResidentAdded(unitDetailsUrl, residentData) {
    await expect(async () => {
      await this.navigateToResidentsTab(unitDetailsUrl);
      await expect(this.page.getByText(residentData.name).filter({ visible: true }).first()).toBeVisible({
        timeout: 5000,
      });
      await expect(this.page.getByText(residentData.email).filter({ visible: true }).first()).toBeVisible({
        timeout: 5000,
      });
    }).toPass({
      intervals: [1000, 2000, 5000],
      timeout: 45000,
    });
  }

  async verifyResidentNameAdded(unitDetailsUrl, residentName) {
    await expect(async () => {
      await this.navigateToResidentsTab(unitDetailsUrl);
      await expect(this.page.getByText(residentName).filter({ visible: true }).first()).toBeVisible({
        timeout: 5000,
      });
    }).toPass({
      intervals: [1000, 2000, 5000],
      timeout: 45000,
    });
  }
}
