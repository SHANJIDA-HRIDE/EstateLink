import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';

export class EditUnitGeneralPage extends BasePage {
  constructor(page) {
    super(page);
    // Form inputs - using exact placeholder matches to avoid conflicts
    this.areaInput = page.locator('input[placeholder="Area"]');
    this.numberOfBathroomsInput = page.locator('input[placeholder="Number of Bathrooms"]');
    this.numberOfRoomsInput = page.locator('input[placeholder="Number of Rooms"]');
    this.numberOfBalconiesInput = page.locator('input[placeholder="Number of Balconies"]');
    
    // Buttons
    this.saveBtn = page.getByRole('button', { name: /Save/i }).first();
    this.cancelBtn = page.getByRole('button', { name: /Cancel/i }).first();
    this.okBtn = page.getByRole('button', { name: /^OK$/i });
    
    // Success message
    this.successMessage = page.getByText(/General Information has been successfully updated/i);
  }

  async fillArea(area) {
    await this.areaInput.fill(area.toString());
  }

  async fillNumberOfBathrooms(bathrooms) {
    await this.numberOfBathroomsInput.fill(bathrooms.toString());
  }

  async fillNumberOfRooms(rooms) {
    await this.numberOfRoomsInput.fill(rooms.toString());
  }

  async fillNumberOfBalconies(balconies) {
    await this.numberOfBalconiesInput.fill(balconies.toString());
  }

  /** Waits for the edit form to mount + settle (values load asynchronously). */
  async waitLoaded() {
    await this.areaInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.page.waitForTimeout(1500);
  }

  /** Uploads a unit document/attachment. */
  async uploadDocument(filePath) {
    await this.page.locator('input[type="file"]').first().setInputFiles(filePath);
  }

  async fillGeneralInfo(unitData) {
    if (unitData.area) {
      await this.fillArea(unitData.area);
    }
    if (unitData.bathrooms) {
      await this.fillNumberOfBathrooms(unitData.bathrooms);
    }
    if (unitData.rooms) {
      await this.fillNumberOfRooms(unitData.rooms);
    }
    if (unitData.balconies) {
      await this.fillNumberOfBalconies(unitData.balconies);
    }
  }

  async saveUnitInfo() {
    await this.saveBtn.click();
  }

  async clickOK() {
    await this.okBtn.click();
  }

  async cancelEdit() {
    await this.cancelBtn.click();
  }

  async verifySuccessMessage() {
    await expect(this.successMessage).toBeVisible({ timeout: 30000 });
  }
}
