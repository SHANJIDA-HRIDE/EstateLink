import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';

export class UnitOwnersPage extends BasePage {
  constructor(page) {
    super(page);
    this.addOwnerBtn = page.getByRole('button', { name: /^Add Owner$/i });
    this.changeOwnershipBtn = page.getByRole('button', { name: /Change Ownership/i });
  }

  async navigateToOwnersTab(unitDetailsUrl) {
    await this.page.goto(`${unitDetailsUrl}?tab=2`);
    await expect(this.page).toHaveURL(/\/unit-details\/\d+\?tab=2$/);
  }

  async clickAddOwner() {
    await this.addOwnerBtn.click();
    await expect(this.page).toHaveURL(/\/unit\/\d+\/add-owner$/);
  }

  async clickChangeOwnership() {
    await this.changeOwnershipBtn.click();
    await expect(this.page).toHaveURL(/\/unit\/\d+\/change-owner$/);
  }

  /** Reads owner rows from the Owners tab table as [{name, percent}]. */
  async ownerRows() {
    return this.page.evaluate(() => {
      const out = [];
      for (const tr of document.querySelectorAll('table tbody tr')) {
        const td = [...tr.querySelectorAll('td')];
        if (td.length < 4) continue;
        const pctCell = td.find((c) => /\d+(\.\d+)?\s*%/.test(c.innerText));
        const m = pctCell && pctCell.innerText.match(/(\d+(\.\d+)?)\s*%/);
        out.push({ name: td[0].innerText.trim(), percent: m ? parseFloat(m[1]) : null });
      }
      return out;
    });
  }

  async verifyOwnerAdded(unitDetailsUrl, memberData) {
    await expect(async () => {
      await this.navigateToOwnersTab(unitDetailsUrl);
      await expect(this.page.getByText(memberData.name).filter({ visible: true }).first()).toBeVisible({
        timeout: 5000,
      });
      await expect(this.page.getByText(memberData.email).filter({ visible: true }).first()).toBeVisible({
        timeout: 5000,
      });
    }).toPass({
      intervals: [1000, 2000, 5000],
      timeout: 45000,
    });
  }

  async verifyOwnerNameAdded(unitDetailsUrl, ownerName) {
    await expect(async () => {
      await this.navigateToOwnersTab(unitDetailsUrl);
      await expect(this.page.getByText(ownerName).filter({ visible: true }).first()).toBeVisible({
        timeout: 5000,
      });
    }).toPass({
      intervals: [1000, 2000, 5000],
      timeout: 45000,
    });
  }

  async verifyOwnersAdded(unitDetailsUrl, membersData) {
    await expect(async () => {
      await this.navigateToOwnersTab(unitDetailsUrl);

      for (const memberData of membersData) {
        await expect(this.page.getByText(memberData.name).filter({ visible: true }).first()).toBeVisible({
          timeout: 5000,
        });
        await expect(this.page.getByText(memberData.email).filter({ visible: true }).first()).toBeVisible({
          timeout: 5000,
        });
      }
    }).toPass({
      intervals: [1000, 2000, 5000],
      timeout: 45000,
    });
  }
}
