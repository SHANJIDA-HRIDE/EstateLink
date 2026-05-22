import { BasePage } from '../Base/BasePage';

export class AddTowerPage extends BasePage {
  constructor(page) {
    super(page);
    // Form inputs
    this.towerNameInput = page.locator('input[placeholder="Enter Tower Name"]');
    this.towerNumberInput = page.locator('input[disabled]'); // Tower number is auto-assigned
    this.descriptionInput = page.locator('textarea').first();
    this.numberOfFloorsInput = page.locator('input[placeholder="Enter Number of Floors"]');
    this.unitsInEachFloorInput = page.locator('input[type="number"]').last();
    
    // Unit naming options
    this.numericalRadio = page.getByRole('radio', { name: /Numerical/i });
    this.alphabeticalRadio = page.getByRole('radio', { name: /Alphabetical/i });
    
    // Buttons
    this.saveBtn = page.getByRole('button', { name: /Save/i });
    
    // Success dialog
    this.successMessage = page.getByText('Tower created successfully');
    this.okButton = page.getByRole('button', { name: /OK/i });
  }

  async navigateTo() {
    await this.navigate(`${this.page.url().split('/')[0]}//${this.page.url().split('/')[2]}/addTower`);
  }

  async fillTowerName(name) {
    await this.towerNameInput.fill(name);
  }

  async fillDescription(description) {
    await this.descriptionInput.fill(description);
  }

  async fillNumberOfFloors(floors) {
    // Clear existing value and fill
    await this.numberOfFloorsInput.click();
    await this.numberOfFloorsInput.fill('');
    await this.numberOfFloorsInput.fill(floors.toString());
    // Wait for table to update
    await this.page.waitForTimeout(500);
  }

  async fillUnitsInEachFloor(units) {
    // Clear and fill units
    await this.unitsInEachFloorInput.click();
    await this.unitsInEachFloorInput.fill('');
    await this.unitsInEachFloorInput.fill(units.toString());
    // Wait for table to update
    await this.page.waitForTimeout(500);
  }

  async selectUnitNaming(type = 'numerical') {
    if (type.toLowerCase() === 'alphabetical') {
      await this.alphabeticalRadio.click();
    } else {
      await this.numericalRadio.click();
    }
    // Wait for selection to register
    await this.page.waitForTimeout(300);
  }

  async fillTowerInfo(towerData) {
    await this.fillTowerName(towerData.name);
    
    if (towerData.description) {
      await this.fillDescription(towerData.description);
    }
    
    await this.fillNumberOfFloors(towerData.floors);
    await this.fillUnitsInEachFloor(towerData.unitsPerFloor);
    
    if (towerData.unitNaming) {
      await this.selectUnitNaming(towerData.unitNaming);
    }
  }

  async saveTower() {
    await this.saveBtn.click();
  }

  async handleSuccessDialog() {
    // Wait for success message
    await this.successMessage.waitFor({ state: 'visible', timeout: 15000 });
    // Wait a bit for button to be clickable
    await this.page.waitForTimeout(500);
    // Click OK
    await this.okButton.click();
  }

  async verifySaveBtnEnabled() {
    await this.saveBtn.isEnabled();
  }
}
