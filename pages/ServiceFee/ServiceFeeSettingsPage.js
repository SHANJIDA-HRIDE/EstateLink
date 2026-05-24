import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

/**
 * Service Fee Settings (/service-fee-settings).
 * "Create New Service Fee" opens a right-side drawer wizard:
 *   Tower -> Unit(s) -> Amount -> Due Day -> (optional) Late Penalty -> Next -> Review -> Save.
 */
export class ServiceFeeSettingsPage extends BasePage {
  constructor(page) {
    super(page);
    this.createBtn = page.getByRole('button', { name: /Create New Service Fee/i });
    this.drawer = page.locator('div.fixed.inset-0.z-50');

    this.towerTrigger = this.drawer.getByText('Select a tower...');
    this.unitTrigger = this.drawer.getByText('Select units...');
    this.doneBtn = this.drawer.getByRole('button', { name: /^Done$/ });
    this.amountInput = this.drawer.getByPlaceholder('Enter fee amount');
    this.serviceFeeDateInput = this.drawer.getByPlaceholder('Select Service Fee Date');
    this.dueDayTrigger = this.drawer.getByText('Select day');
    this.latePenaltyToggle = this.drawer.getByText(/Enable Late Payment Penalties/i);
    this.addPenaltyBtn = this.drawer.getByRole('button', { name: /Add Penalty/i });
    this.penaltyPercentInput = this.drawer.getByPlaceholder('e.g., 5');
    this.daysOverdueInput = this.drawer.getByPlaceholder('e.g., 30');
    this.nextBtn = this.drawer.getByRole('button', { name: /^Next$/ });

    this.saveBtn = page.getByRole('button', { name: /^Save$/ });
    this.successMessage = page.getByText(/Service Fee Settings has been successfully Created/i);
    this.okBtn = page.getByRole('button', { name: /^OK$/ });
  }

  async navigateTo() {
    await this.navigate(`${ENV.BASE_URL}/service-fee-settings`);
    await this.createBtn.waitFor({ state: 'visible', timeout: 30000 });
  }

  async openCreateForm() {
    await this.createBtn.first().click();
    await this.towerTrigger.waitFor({ state: 'visible', timeout: 15000 });
  }

  /** @param {string} towerName full name or unique substring (e.g. the tower id) */
  async selectTower(towerName) {
    await this.towerTrigger.click();
    await this.drawer.getByText(towerName, { exact: false }).first().click();
  }

  /** @param {string} unitNumber e.g. "204" — checks the unit whose option label starts with it */
  async selectUnit(unitNumber) {
    await this.unitTrigger.click();
    const label = this.drawer.locator('label').filter({ hasText: new RegExp(`^${unitNumber}\\b`) }).first();
    await label.waitFor({ state: 'visible', timeout: 10000 });
    // Units already assigned to another service fee are disabled — fail fast so the
    // test can retry with a different (eligible) unit instead of timing out.
    const cls = (await label.getAttribute('class')) || '';
    if (/cursor-not-allowed|opacity-60/.test(cls)) {
      throw new Error(`Unit ${unitNumber} is not eligible (already assigned to another service fee).`);
    }
    await label.click();
    await this.doneBtn.first().click(); // collapse the multi-select
  }

  async fillAmount(amount) {
    await this.amountInput.fill(String(amount));
  }

  /**
   * Sets the Service Fee Date (react-datepicker). Used to back-date the fee to a
   * previous month so bills can be generated for earlier months.
   * @param {Date} date
   */
  async pickServiceFeeDate(date) {
    await this.serviceFeeDateInput.click();
    const dp = this.page.locator('.react-datepicker').first();
    await dp.waitFor({ state: 'visible', timeout: 10000 });
    const monthName = date.toLocaleString('en-US', { month: 'long' });
    await dp.locator('select').nth(0).selectOption({ label: monthName });
    await dp.locator('select').nth(1).selectOption({ label: String(date.getFullYear()) });
    const dayLabel = new RegExp(`${monthName} ${date.getDate()}(st|nd|rd|th)?,?\\s+${date.getFullYear()}`);
    await dp.getByLabel(dayLabel).first().click({ force: true });
    await dp.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  /** @param {number|string} day 1-31 (the "Day N" option) */
  async selectDueDay(day) {
    await this.dueDayTrigger.click();
    // Options render in a portal as "Day 1".."Day 31".
    await this.page.getByText(`Day ${day}`, { exact: true }).first().click();
  }

  /** Enables late penalties and adds one penalty rule. */
  async addLatePenalty(percent, daysOverdue) {
    await this.latePenaltyToggle.click();
    await this.addPenaltyBtn.click();
    await this.penaltyPercentInput.fill(String(percent));
    await this.daysOverdueInput.fill(String(daysOverdue));
  }

  async clickNext() {
    await this.nextBtn.click();
    // Review modal appears.
    await this.page.getByText(/Review Service Fee Settings/i).waitFor({ state: 'visible', timeout: 10000 });
  }

  async saveAndConfirm() {
    await this.saveBtn.first().click();
    await expect(this.successMessage).toBeVisible({ timeout: 30000 });
    await this.okBtn.first().click();
  }

  /**
   * Full create flow.
   * @param {{towerName:string, unitNumber:string, amount:number|string, dueDay:number|string,
   *          penaltyPercent?:number|string, daysOverdue?:number|string}} data
   */
  async createServiceFee({ towerName, unitNumber, amount, dueDay, penaltyPercent = 10, daysOverdue = 10, serviceFeeDate }) {
    await this.openCreateForm();
    await this.selectTower(towerName);
    await this.selectUnit(unitNumber);
    await this.fillAmount(amount);
    if (serviceFeeDate) await this.pickServiceFeeDate(serviceFeeDate);
    await this.selectDueDay(dueDay);
    await this.addLatePenalty(penaltyPercent, daysOverdue);
    await this.clickNext();
    await this.saveAndConfirm();
  }
}
