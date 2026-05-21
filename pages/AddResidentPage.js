import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

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

  async addNewResident(residentData) {
    // Fill general info
    await this.fillGeneralInfo(residentData);
    
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
