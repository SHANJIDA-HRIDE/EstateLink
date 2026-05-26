import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';

export class AddResidentPage extends BasePage {
  constructor(page) {
    super(page);
    // Status radio buttons
    this.occupiedRadio = page.getByLabel(/Occupied/i);
    this.unoccupiedRadio = page.getByLabel(/Unoccupied/i);
    
    // Form inputs for general info
    this.residentNameInput = page.locator('input[name="full_name"]');
    this.residentEmailInput = page.locator('input[name="general_email"]');
    this.residentContactInput = page.locator('input[name="general_contact"]');
    
    // Buttons
    this.nextBtn = page.getByRole('button', { name: /^Next$/i });
    this.submitBtn = page.getByRole('button', { name: /^Submit$/i });
    this.okBtn = page.getByRole('button', { name: /^OK$/i });
    
    // Success message
    this.successMessage = page.getByText(/successfully/i);
    this.creatingResidentsBtn = page.getByRole('button', { name: /Creating Residents/i });
  }

  async setStatusOccupied() {
    await this.occupiedRadio.click();
  }

  async setStatusUnoccupied() {
    await this.unoccupiedRadio.click();
  }

  /** Clicks the "Vacant" status radio on the Residents tab. */
  async setStatusVacant() {
    await this.page.getByLabel(/^Vacant$/i).click();
  }

  async fillGeneralInfo(residentData) {
    await this.residentNameInput.fill(residentData.name);
    await this.residentEmailInput.fill(residentData.email);
    await this.residentContactInput.fill(residentData.contact);
  }

  async clickNext() {
    await this.nextBtn.click();
  }

  async clickSubmit() {
    await this.submitBtn.click();
  }

  async clickOK() {
    await this.okBtn.click();
  }

  /** Checks the "Resident is also a tenant" checkbox on step 2 (resident is paying rent). */
  async setAsTenant() {
    await this.page.getByText('Resident is also a tenant', { exact: true }).click();
  }

  /**
   * Adds a new resident WITH the tenant checkbox set on step 2.
   * Type column reflects "Resident (Tenant)" (vs plain "Resident" when unchecked).
   */
  async addNewResidentAsTenant(residentData) {
    await this.fillGeneralInfo(residentData);
    await this.clickNext();
    await this.setAsTenant();
    await this.clickNext();
    await expect(this.submitBtn).toBeVisible({ timeout: 10000 });
    await this.clickSubmit();
    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
    await this.clickOK();
  }

  /** Opens the "Add Existing Member" modal on the resident wizard. */
  async openExistingMemberModal() {
    await this.page.getByRole('button', { name: /Add Existing Member/i }).click();
    await this.page.locator('[role="dialog"] input[name="search"]').waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Searches the Members List inside the existing-member modal. */
  async searchExistingMember(term) {
    await this.page.locator('[role="dialog"] input[name="search"]').fill(term);
  }

  /**
   * Reads the name (first cell) of each non-skeleton data row in the modal. The
   * table has sub-rows for additional roles (e.g. "Property Staff" with empty
   * cells) — filter to rows that carry an email so only real member rows count.
   */
  async modalRowNames() {
    return this.page.evaluate(() =>
      [...document.querySelectorAll('[role="dialog"] table tbody tr:not(:has(.animate-pulse))')]
        .map((tr) => [...tr.querySelectorAll('td')].map((c) => c.innerText.trim()))
        .filter((cells) => cells.some((c) => /@/.test(c)))
        .map((cells) => cells[0] || '')
        .filter((n) => n),
    );
  }

  /**
   * Selects the first non-skeleton member row in the modal via its row "Add" button.
   * Drawer closes and the wizard's General Information form is pre-filled.
   * @returns {Promise<string>} the selected member's name
   */
  async selectFirstExistingMember() {
    const row = this.page.locator('[role="dialog"] table tbody tr:not(:has(.animate-pulse))').first();
    await row.waitFor({ state: 'visible', timeout: 25000 });
    const name = (await row.locator('td').first().innerText()).trim();
    await row.getByRole('button', { name: /^Add$/i }).click();
    // Wait for the modal to fully close before the form re-renders.
    await this.page.locator('[role="dialog"]').first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await expect(this.residentNameInput).toHaveValue(name);
    await this.page.waitForTimeout(800);
    return name;
  }

  /**
   * Full flow: open modal, search, pick first row. After picking, the wizard may
   * land on step 1 (Next) or jump to step 2 (Submit) depending on prefill state —
   * click Next up to 2 times until Submit is visible, then submit.
   */
  async addExistingMember(searchTerm) {
    await this.openExistingMemberModal();
    await this.searchExistingMember(searchTerm);
    const name = await this.selectFirstExistingMember();
    for (let i = 0; i < 2; i++) {
      if (await this.submitBtn.isVisible()) break;
      if (await this.nextBtn.isVisible()) {
        await this.clickNext();
        await this.page.waitForTimeout(800);
      }
    }
    await expect(this.submitBtn).toBeVisible({ timeout: 15000 });
    await this.clickSubmit();
    await expect(this.successMessage).toBeVisible({ timeout: 15000 });
    await this.clickOK();
    return name;
  }

  async addNewResident(residentData) {
    await this.fillGeneralInfo(residentData);

    // Advance through the wizard; the final step is reached once Submit is shown.
    await this.clickNext();
    await this.clickNext();
    await expect(this.submitBtn).toBeVisible({ timeout: 10000 });
    await this.clickSubmit();

    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
    await this.clickOK();
  }
}
