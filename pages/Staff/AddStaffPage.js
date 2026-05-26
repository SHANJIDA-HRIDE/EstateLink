import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';

export class AddStaffPage extends BasePage {
  constructor(page) {
    super(page);
    // Form inputs for general info
    this.staffNameInput = page.locator('input[name="full_name"]');
    this.staffEmailInput = page.locator('input[name="general_email"]');
    this.staffContactInput = page.locator('input[name="general_contact"]');
    
    // Buttons
    this.nextBtn = page.getByRole('button', { name: /^Next$/i });
    this.submitBtn = page.getByRole('button', { name: /^Submit$/i });
    this.okBtn = page.getByRole('button', { name: /^OK$/i });
    
    // Success message
    this.successMessage = page.getByText(/New Unit Staff has been successfully added/i);
    this.creatingStaffBtn = page.getByRole('button', { name: /Creating Staff/i });
  }

  async fillGeneralInfo(staffData) {
    await this.staffNameInput.fill(staffData.name);
    await this.staffEmailInput.fill(staffData.email);
    await this.staffContactInput.fill(staffData.contact);
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

  /** Opens the "Add Existing Member" modal on the staff wizard. */
  async openExistingMemberModal() {
    await this.page.getByRole('button', { name: /Add Existing Member/i }).click();
    await this.page.locator('[role="dialog"] input[name="search"]').waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Searches the Members List inside the existing-member modal. */
  async searchExistingMember(term) {
    await this.page.locator('[role="dialog"] input[name="search"]').fill(term);
  }

  /**
   * Reads names (first cell) of non-skeleton data rows in the modal. Sub-rows for
   * extra roles have empty cells — filter to rows with an email.
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
   * Selects the first non-skeleton member row via its row "Add" button. Drawer
   * closes and the wizard's General Information form is pre-filled.
   */
  async selectFirstExistingMember() {
    const row = this.page.locator('[role="dialog"] table tbody tr:not(:has(.animate-pulse))').first();
    await row.waitFor({ state: 'visible', timeout: 25000 });
    const name = (await row.locator('td').first().innerText()).trim();
    await row.getByRole('button', { name: /^Add$/i }).click();
    await this.page.locator('[role="dialog"]').first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await expect(this.staffNameInput).toHaveValue(name);
    await this.page.waitForTimeout(800);
    return name;
  }

  /**
   * Full flow: open modal, search, pick first row. Picking pre-fills step 1 and
   * the wizard may land on step 1 (Next) or jump to step 2/3 (Submit) — click Next
   * up to 2 times until Submit is visible.
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

  /** Selects the Part-time status radio on step 2 (default is Live-in). */
  async setStatusPartTime() {
    await this.page.getByText('Part-time', { exact: true }).click();
  }

  /** Adds a new staff with the Part-time status (default flow uses Live-in). */
  async addNewStaffAsPartTime(staffData) {
    await this.fillGeneralInfo(staffData);
    await this.clickNext();
    await this.setStatusPartTime();
    await this.clickNext();
    await expect(this.submitBtn).toBeVisible({ timeout: 10000 });
    await this.clickSubmit();
    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
    await this.clickOK();
  }

  async addNewStaff(staffData) {
    await this.fillGeneralInfo(staffData);

    // Advance through the wizard; the final step is reached once Submit is shown.
    await this.clickNext();
    await this.clickNext();
    await expect(this.submitBtn).toBeVisible({ timeout: 10000 });
    await this.clickSubmit();

    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
    await this.clickOK();
  }
}
