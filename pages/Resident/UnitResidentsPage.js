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

  /**
   * Reads resident rows from the Residents tab table as [{name, contact, email, type}].
   * The table has a leading empty avatar cell, so we filter to the populated cells.
   */
  async residentRows() {
    return this.page.evaluate(() => {
      const out = [];
      for (const tr of document.querySelectorAll('table tbody tr')) {
        const cells = [...tr.querySelectorAll('td')].map((c) => c.innerText.trim());
        const filled = cells.filter((x) => x);
        if (filled.length < 4) continue; // skip "No Residents Found" rows
        const [name, contact, email, type] = filled;
        out.push({ name, contact, email, type });
      }
      return out;
    });
  }

  /** Removes a resident by ticking its row checkbox and clicking the top Remove button. */
  async removeResident(name) {
    const row = this.page.locator('table tbody tr', { hasText: name }).first();
    await row.locator('input[type="checkbox"]').first().click();
    await this.page.getByRole('button', { name: /^Remove$/i }).click();
    // Optional confirm modal — click Confirm if it appears.
    const confirm = this.page.getByRole('button', { name: /^Confirm$/i });
    if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirm.click();
    }
    await this.page.waitForTimeout(1500);
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
