import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

export class UnitDetailsPage extends BasePage {
  constructor(page) {
    super(page);
    // Tabs
    this.unitInformationTab = page.getByRole('tab', { name: /Unit Information/i });
    this.unitOwnersTab = page.getByRole('tab', { name: /Unit Owners/i });
    this.residentsTab = page.getByRole('tab', { name: /Residents/i });
    this.unitStaffTab = page.getByRole('tab', { name: /Unit Staff/i });
    this.unitContactsTab = page.getByRole('tab', { name: /Unit Contacts/i });
    
    // Edit button
    this.editBtn = page.getByRole('button', { name: /Edit/i }).first();
    
    // History button
    this.historyBtn = page.getByRole('button', { name: /History/i });
    
    // Overview info
    this.ownersCount = page.locator('text=Owners').locator('..').locator('p').last();
    this.residentsCount = page.locator('text=Residents').locator('..').locator('p').last();
  }

  async navigateToUnit(unitId) {
    await this.navigate(`${ENV.BASE_URL}/unit-details/${unitId}`);
  }

  async clickEditButton() {
    await this.editBtn.click();
  }

  async goToUnitInformationTab() {
    await this.unitInformationTab.click();
  }

  async goToUnitOwnersTab() {
    await this.unitOwnersTab.click();
  }

  async goToResidentsTab() {
    await this.residentsTab.click();
  }

  async goToUnitStaffTab() {
    await this.unitStaffTab.click();
  }

  async goToUnitContactsTab() {
    await this.unitContactsTab.click();
  }

  async verifyUnitDetailsLoaded(unitNumber) {
    await this.page.locator(`heading:has-text('${unitNumber}')`).waitFor({ state: 'visible', timeout: 10000 });
  }
}
