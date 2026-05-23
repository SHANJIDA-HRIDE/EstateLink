import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

export class AddTowerPage extends BasePage {
  constructor(page) {
    super(page);
    // Form inputs
    this.towerNameInput = page.locator('input[placeholder="Enter Tower Name"]');
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
    await this.navigate(`${ENV.BASE_URL}/addTower`);
  }

  async fillTowerName(name) {
    await this.towerNameInput.fill(name);
  }

  async fillDescription(description) {
    await this.descriptionInput.fill(description);
  }

  async fillNumberOfFloors(floors) {
    await this.numberOfFloorsInput.fill(floors.toString());
  }

  async fillUnitsInEachFloor(units) {
    await this.unitsInEachFloorInput.fill(units.toString());
  }

  async selectUnitNaming(type = 'numerical') {
    if (type.toLowerCase() === 'alphabetical') {
      await this.alphabeticalRadio.click();
    } else {
      await this.numericalRadio.click();
    }
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
    await expect(this.successMessage).toBeVisible({ timeout: 15000 });
    await this.okButton.click();
    await expect(this.successMessage).toBeHidden();
  }

  async verifySaveBtnEnabled() {
    await expect(this.saveBtn).toBeEnabled();
  }
}
