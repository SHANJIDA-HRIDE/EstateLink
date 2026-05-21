import { BasePage } from './BasePage';

export class EditUnitGeneralPage extends BasePage {
  constructor(page) {
    super(page);
    // Form inputs
    this.areaInput = page.locator('input[placeholder*="Area"], input[placeholder*="area"]').first();
    this.numberOfBathroomsInput = page.locator('input[placeholder*="Bathrooms"], input[placeholder*="bathrooms"]');
    this.numberOfRoomsInput = page.locator('input[placeholder*="Rooms"], input[placeholder*="rooms"]');
    this.numberOfBalconiesInput = page.locator('input[placeholder*="Balconies"], input[placeholder*="balconies"]');
    
    // Buttons
    this.saveBtn = page.getByRole('button', { name: /Save/i }).first();
    this.cancelBtn = page.getByRole('button', { name: /Cancel/i }).first();
    
    // Success message
    this.successMessage = page.getByText(/updated successfully|saved successfully/i);
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

  async cancelEdit() {
    await this.cancelBtn.click();
  }

  async verifySuccessMessage() {
    await this.successMessage.waitFor({ state: 'visible', timeout: 10000 });
  }
}
