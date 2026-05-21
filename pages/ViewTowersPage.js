import { BasePage } from './BasePage';
import { ENV } from '../env/env.config';

export class ViewTowersPage extends BasePage {
  constructor(page) {
    super(page);
    this.addTowerBtn = page.getByRole('button', { name: /Add Tower/i });
    this.towerManagementLink = page.getByRole('link', { name: /Tower & Unit Management/i }).first();
  }

  async navigateTo() {
    await this.navigate(`${ENV.BASE_URL}/ViewTowers`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1000);
    console.log('ViewTowers page loaded');
  }

  async clickAddTower() {
    await this.addTowerBtn.click();
  }

  async verifyTowerListLoaded() {
    await this.addTowerBtn.waitFor({ state: 'visible', timeout: 10000 });
  }

  getTowerCard(towerName) {
    return this.page.locator(`text=${towerName}`).first();
  }

  async verifyTowerExists(towerName) {
    const tower = this.getTowerCard(towerName);
    await tower.waitFor({ state: 'visible', timeout: 10000 });
    return true;
  }

  getUnoccupiedUnits() {
    return this.page.locator('a[href^="/unit-details/"]', {
      has: this.page.getByTitle('no owner'),
    });
  }

  getAvailableUnits() {
    return this.page.locator('a[href*="/unit-details/"]', {
      has: this.page.getByTitle('available'),
    });
  }

  async clickFirstUnoccupiedUnit() {
    await this.openFirstUnoccupiedUnit();
  }

  async openFirstUnoccupiedUnit() {
    const firstUnit = this.getUnoccupiedUnits().first();

    await firstUnit.waitFor({ state: 'visible', timeout: 15000 });

    const unitHref = await firstUnit.getAttribute('href');
    const unitNumber = (await firstUnit.innerText()).trim();

    await firstUnit.click();
    await this.page.waitForURL(/\/unit-details\/\d+$/, { timeout: 15000 });

    return {
      unitHref,
      unitNumber,
      unitDetailsUrl: this.page.url(),
    };
  }

  async openFirstAvailableUnit() {
    const firstUnit = this.getAvailableUnits().first();

    await firstUnit.waitFor({ state: 'visible', timeout: 15000 });

    const unitHref = await firstUnit.getAttribute('href');
    const unitNumber = (await firstUnit.innerText()).trim();

    await firstUnit.click();
    await this.page.waitForURL(/\/unit-details\/\d+$/, { timeout: 15000 });

    return {
      unitHref,
      unitNumber,
      unitDetailsUrl: this.page.url(),
    };
  }

  async clickUnoccupiedUnitByNumber(unitNumber) {
    const unit = this.getUnoccupiedUnits().filter({ hasText: unitNumber }).first();
    await unit.click();
  }

  async getUnoccupiedUnitCount() {
    return await this.getUnoccupiedUnits().count();
  }

  async verifyUnoccupiedUnitsExist() {
    return (await this.getUnoccupiedUnitCount()) > 0;
  }
}
