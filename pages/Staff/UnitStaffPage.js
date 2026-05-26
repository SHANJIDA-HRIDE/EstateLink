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

  /** Reads staff rows from the Staff tab table as [{name, contact, email, occupation}]. */
  async staffRows() {
    return this.page.evaluate(() => {
      const out = [];
      for (const tr of document.querySelectorAll('table tbody tr')) {
        const cells = [...tr.querySelectorAll('td')].map((c) => c.innerText.trim());
        const filled = cells.filter((x) => x);
        if (filled.length < 4) continue; // skip "No Unit Staff Found"
        const [name, contact, email, occupation] = filled;
        out.push({ name, contact, email, occupation });
      }
      return out;
    });
  }

  /** Removes a staff by ticking its row checkbox and clicking the top Remove button. */
  async removeStaff(name) {
    const row = this.page.locator('table tbody tr', { hasText: name }).first();
    await row.locator('input[type="checkbox"]').first().click();
    await this.page.getByRole('button', { name: /^Remove$/i }).click();
    const confirm = this.page.getByRole('button', { name: /^Confirm$/i });
    if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirm.click();
    }
    await this.page.waitForTimeout(1500);
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
