import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

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
    // Fill general info
    await this.fillGeneralInfo(staffData);
    
    // Click next buttons
    await this.clickNext();
    await this.page.waitForTimeout(500);
    
    await this.clickNext();
    await this.page.waitForTimeout(500);
    
    // Submit the form
    await this.clickSubmit();
    
    // Wait for success and click OK
    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
    await this.clickOK();
  }
}
