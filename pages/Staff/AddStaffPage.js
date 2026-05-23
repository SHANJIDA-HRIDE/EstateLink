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
