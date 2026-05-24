import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';

/**
 * Unit Contacts tab (unit-details?tab=5): Primary/Secondary contact cards.
 * Flow: Edit (Primary) -> Add Contact -> pick a user from the modal -> Save.
 */
export class UnitContactsPage extends BasePage {
  constructor(page) {
    super(page);
    this.editBtn = page.getByRole('button', { name: /^Edit$/i });
    this.addContactBtn = page.getByRole('button', { name: /Add Contact/i });
    this.contactSearch = page.getByPlaceholder('Search List...');
    this.saveBtn = page.getByRole('button', { name: /^Save$/i });
    this.okBtn = page.getByRole('button', { name: /^OK$/i });
    this.successMessage = page.getByText(/success/i);
  }

  /** Navigates to the Unit Contacts tab for the given unit-details URL. */
  async navigateToContactsTab(unitDetailsUrl) {
    const base = unitDetailsUrl.split('?')[0];
    await this.page.goto(`${base}?tab=5`, { waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveURL(/\/unit-details\/\d+\?tab=5$/);
  }

  /** Clicks Edit on the Primary Contact card (first Edit button). */
  async editPrimaryContact() {
    await this.editBtn.first().click();
    await this.addContactBtn.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async clickAddContact() {
    await this.addContactBtn.first().click();
    await this.contactSearch.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Adds the first available user listed in the Add Contact modal (the per-row "Add").
   * @param {string} [searchTerm] optional name to narrow the modal list first
   */
  async addFirstContact(searchTerm) {
    if (searchTerm) {
      await this.contactSearch.fill(searchTerm);
      await this.page.waitForTimeout(1000);
    }
    // Per-row "Add" button (exact, so it doesn't match "Add Contact").
    await this.page.getByRole('button', { name: /^Add$/ }).first().click();
  }

  /** Saves the contact edit. */
  async save() {
    await this.saveBtn.first().click();
  }

  async saveAndConfirm() {
    await this.save();
    await expect(this.successMessage).toBeVisible({ timeout: 15000 });
    if (await this.okBtn.count()) {
      await this.okBtn.first().click();
    }
  }

  /** Full flow: edit primary contact, add the first available user, save. */
  async addPrimaryContact(searchTerm) {
    await this.editPrimaryContact();
    await this.clickAddContact();
    await this.addFirstContact(searchTerm);
    await this.saveAndConfirm();
  }
}
