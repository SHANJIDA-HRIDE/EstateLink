import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

/**
 * Billing Management (/billing-management) — Generate Bills wizard:
 *   Generate Bills -> Select Billing Month -> Continue
 *   -> Select Tower & Units (+ optional Additional Bill Categories) -> Continue
 *   -> Review Billing Summary (Total Billing Amount) -> Generate N Bills -> OK
 *   -> "Monthly Bills Generated" notification.
 */
export class BillingManagementPage extends BasePage {
  constructor(page) {
    super(page);
    this.generateBillsBtn = page.getByRole('button', { name: /^Generate Bills$/i });
    this.continueBtn = page.getByRole('button', { name: /^Continue$/ });
    this.towerTrigger = page.getByRole('button', { name: /Select a tower/i });
    this.generateNBtn = page.getByRole('button', { name: /Generate \d+ Bill/i });
    this.okBtn = page.getByRole('button', { name: /^OK$/ });
    this.notificationBell = page.getByRole('button', { name: 'Notifications' });
  }

  async navigateTo() {
    await this.navigate(`${ENV.BASE_URL}/billing-management`);
    await this.generateBillsBtn.first().waitFor({ state: 'visible', timeout: 30000 });
  }

  async startGenerate() {
    await this.generateBillsBtn.first().click();
    await this.page.getByText(/Select Billing Month/i).waitFor({ state: 'visible', timeout: 10000 });
  }

  /** @param {string} monthYear e.g. "May 2026" */
  async selectMonth(monthYear) {
    await this.page.getByRole('button', { name: monthYear }).first().click();
    await this.continueBtn.first().click();
    await this.page.getByText(/Select Tower & Units/i).waitFor({ state: 'visible', timeout: 10000 });
  }

  async selectTower(towerName) {
    await this.towerTrigger.first().click();
    // Options are <button>s in a scrollable list; scroll the match into view, then click.
    const opt = this.page.getByRole('button').filter({ hasText: towerName }).first();
    await opt.scrollIntoViewIfNeeded();
    await opt.click();
    await this.page.waitForTimeout(1200); // units render
  }

  /** Selects a unit (rendered as a button) for billing. */
  async selectUnit(unitNumber) {
    await this.page.getByRole('button', { name: unitNumber, exact: true }).first().click();
  }

  /** Optionally select an additional bill category by name (no-op if not present). */
  async selectAdditionalCategory(categoryName) {
    const cat = this.page.locator('label').filter({ hasText: categoryName });
    if (await cat.count()) await cat.first().click();
  }

  async continueToReview() {
    await this.continueBtn.first().click();
    await this.page.getByText(/Review Billing Summary/i).waitFor({ state: 'visible', timeout: 10000 });
  }

  /** Raw "TOTAL BILLING AMOUNT N units × ৳X ৳Y" text. */
  async totalSummaryText() {
    return this.page.evaluate(() => {
      const c = (s) => (s || '').replace(/\s+/g, ' ').trim();
      const el = [...document.querySelectorAll('*')].find(
        (e) => /TOTAL BILLING AMOUNT/i.test(e.innerText || '') && c(e.innerText).length < 70,
      );
      return el ? c(el.innerText) : '';
    });
  }

  /** Verifies the displayed total equals units × per-unit fee. */
  async verifyTotalConsistent() {
    const text = await this.totalSummaryText();
    const m = text.match(/(\d+)\s*units?\s*×\s*৳([\d.,]+)\s*৳([\d.,]+)/i);
    expect(m, `could not parse total: "${text}"`).toBeTruthy();
    const units = Number(m[1]);
    const perUnit = Number(m[2].replace(/,/g, ''));
    const total = Number(m[3].replace(/,/g, ''));
    expect(total).toBeGreaterThan(0);
    expect(total).toBe(units * perUnit);
    return { units, perUnit, total };
  }

  async generate() {
    await this.generateNBtn.first().click();
    await expect(this.okBtn).toBeVisible({ timeout: 30000 });
    await this.okBtn.first().click();
  }

  /** Opens the bell and asserts the "Monthly Bills Generated" notification for the tower. */
  async verifyBillsGeneratedNotification(towerName) {
    await this.notificationBell.click();
    await expect(
      this.page.getByText(/Service fee bills for .* have been generated/i).first(),
    ).toBeVisible({ timeout: 15000 });
    await expect(this.page.getByText(towerName, { exact: false }).first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Full flow.
   * @param {{monthYear:string, towerName:string, unitNumber:string, category?:string}} data
   */
  async generateBills({ monthYear, towerName, unitNumber, category }) {
    await this.startGenerate();
    await this.selectMonth(monthYear);
    await this.selectTower(towerName);
    await this.selectUnit(unitNumber);
    if (category) await this.selectAdditionalCategory(category);
    await this.continueToReview();
    await this.verifyTotalConsistent();
    await this.generate();
    await this.verifyBillsGeneratedNotification(towerName);
  }
}
