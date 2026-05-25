import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

export class UnitDetailsPage extends BasePage {
  constructor(page) {
    super(page);
    // Tabs
    this.unitInformationTab = page.getByRole('tab', { name: /Unit Information/i });
    this.unitOwnersTab = page.getByRole('tab', { name: /Unit Owners/i });
    this.residentsTab = page.getByRole('tab', { name: /Residents/i });
    this.unitStaffTab = page.getByRole('tab', { name: /Unit Staff/i });
    this.unitContactsTab = page.getByRole('tab', { name: /Unit Contacts/i });
    
    // Edit button
    this.editBtn = page.getByRole('button', { name: /Edit/i }).first();
    
    // History button
    this.historyBtn = page.getByRole('button', { name: /History/i });
  }

  async navigateToUnit(unitId) {
    await this.navigate(`${ENV.BASE_URL}/unit-details/${unitId}`);
  }

  async clickEditButton() {
    await this.editBtn.click();
  }

  async goToUnitInformationTab() {
    await this.unitInformationTab.click();
  }

  async goToUnitOwnersTab() {
    await this.unitOwnersTab.click();
  }

  async goToResidentsTab() {
    await this.residentsTab.click();
  }

  async goToUnitStaffTab() {
    await this.unitStaffTab.click();
  }

  async goToUnitContactsTab() {
    await this.unitContactsTab.click();
  }

  async verifyUnitDetailsLoaded(unitNumber) {
    await expect(
      this.page.getByRole('heading', { name: new RegExp(unitNumber) }),
    ).toBeVisible({ timeout: 10000 });
  }

  /** Reads the value rendered after a General Information label (<p>label</p> + next sibling). */
  async fieldValue(label) {
    return this.page.evaluate((lbl) => {
      for (const p of document.querySelectorAll('p')) {
        if (p.textContent.trim() === lbl) {
          const v = p.nextElementSibling;
          if (v) return v.textContent.trim();
        }
      }
      return null;
    }, label);
  }

  async verifyField(label, expected) {
    await expect.poll(() => this.fieldValue(label), { timeout: 15000 }).toBe(expected);
  }

  async verifyFieldContains(label, substring) {
    await expect.poll(async () => (await this.fieldValue(label)) || '', { timeout: 15000 }).toContain(substring);
  }

  /** Asserts an uploaded unit document image is shown (served from media/unit_docs). */
  async verifyDocumentPresent() {
    await expect(this.page.locator('img[src*="unit_docs"]').first()).toBeVisible({ timeout: 15000 });
  }
}
