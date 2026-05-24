import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

/**
 * Service Fee List / Payments (/service-fee-list).
 * Cards are titled "{Tower} - {unit}" with a per-card "Record Payment".
 * Flow: filter to the tower -> Record Payment -> Select (current month) -> Save Payment
 *   -> Confirm Payment Allocation (amount) -> Confirm & Save Payment -> OK
 *   -> "Payment Received" notification.
 */
export class ServiceFeeListPage extends BasePage {
  constructor(page) {
    super(page);
    this.searchInput = page.getByPlaceholder('Search Residents, Units...');
    this.towerFilterBtn = page.getByRole('button', { name: /Select Towers/i });
    this.clearBtn = page.getByRole('button', { name: /^Clear$/ });
    this.doneBtn = page.getByRole('button', { name: /^Done$/ });
    this.recordPaymentBtn = page.getByRole('button', { name: /Record Payment/i });
    this.selectMonthBtn = page.getByRole('button', { name: /^Select$/ });
    this.savePaymentBtn = page.getByRole('button', { name: /^Save Payment$/i });
    this.amountInput = page.locator('input[name="manualAmount"]'); // "Total Amount (BDT)"
    this.confirmSaveBtn = page.getByRole('button', { name: /Confirm & Save Payment/i });
    this.okBtn = page.getByRole('button', { name: /^OK$/ });
    this.notificationBell = page.getByRole('button', { name: 'Notifications' });
  }

  async navigateTo() {
    await this.navigate(`${ENV.BASE_URL}/service-fee-list`);
    await this.recordPaymentBtn.first().waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Sets the list's month filter (react-datepicker in month mode: Jan..Dec cells).
   * Assumes the target year is the current year.
   * @param {Date} date
   */
  async selectListMonth(date) {
    await this.page.getByRole('button', { name: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w* 20\d\d/ }).first().click();
    const dp = this.page.locator('.react-datepicker').first();
    await dp.waitFor({ state: 'visible', timeout: 10000 });
    const monthShort = date.toLocaleString('en-US', { month: 'short' });
    await dp.locator('.react-datepicker__month-text').filter({ hasText: new RegExp(`^${monthShort}`, 'i') }).first().click();
    await this.page.waitForTimeout(1200);
  }

  async goToPaymentHistory() {
    await this.page.getByRole('button', { name: /Payment History/i }).first().click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * In Payment History, asserts the tower's Payment Allocation card has a row whose
   * BILL MONTH equals monthYear (e.g. advance auto-applied to the current month's bill).
   * @param {string} towerName
   * @param {string} monthYear e.g. "May 2026"
   */
  async verifyPaymentHistoryBillMonth(towerName, monthYear) {
    await this.goToPaymentHistory();
    if (await this.searchInput.count()) {
      await this.searchInput.first().fill(towerName).catch(() => {});
      await this.page.waitForTimeout(1500);
    }
    await expect
      .poll(
        () =>
          this.page.evaluate(
            ([name, my]) =>
              [...document.querySelectorAll('*')].some(
                (el) => /Payment Allocation/i.test(el.innerText || '') && el.innerText.includes(name) && el.innerText.includes(my),
              ),
            [towerName, monthYear],
          ),
        { timeout: 15000 },
      )
      .toBe(true);
  }

  /** Restricts the list to a single tower so its card is the only one shown. */
  async filterByTower(towerName) {
    await this.towerFilterBtn.first().click();
    if (await this.clearBtn.count()) await this.clearBtn.first().click();
    await this.page.getByText(towerName, { exact: false }).first().click();
    if (await this.doneBtn.count()) await this.doneBtn.first().click();
    await this.page.waitForTimeout(1000);
  }

  /** Opens Record Payment for the card belonging to a specific tower (heading "{tower} - {unit}"). */
  async openRecordPaymentForTower(towerName) {
    await this.recordPaymentBtn.first().waitFor({ state: 'visible', timeout: 30000 });
    const opened = await this.page.evaluate((name) => {
      const c = (s) => (s || '').replace(/\s+/g, ' ').trim();
      const heading = [...document.querySelectorAll('h1,h2,h3,h4')].find(
        (el) => c(el.innerText).includes(name) && /-\s*\d+/.test(c(el.innerText)),
      );
      if (!heading) return false;
      let card = heading;
      for (let i = 0; i < 6 && card; i++) {
        if (card.querySelector && [...card.querySelectorAll('button')].some((b) => /Record Payment/i.test(b.innerText))) break;
        card = card.parentElement;
      }
      const btn = card && [...card.querySelectorAll('button')].find((b) => /Record Payment/i.test(b.innerText));
      if (btn) { btn.click(); return true; }
      return false;
    }, towerName);
    if (!opened) throw new Error(`No Record Payment card found for tower "${towerName}"`);
    await this.page.getByRole('heading', { name: /^Record Payment$/i }).waitFor({ state: 'visible', timeout: 10000 });
  }

  /** Selects the current month's bill (enables Save Payment). */
  async selectMonth() {
    const sel = this.selectMonthBtn.first();
    await sel.waitFor({ state: 'visible', timeout: 10000 });
    await sel.click();
    await this.page.waitForTimeout(600);
  }

  /** Selects every month card's bill (clicks all "Select" buttons; each becomes "Selected"). */
  async selectAllMonths() {
    await this.selectMonthBtn.first().waitFor({ state: 'visible', timeout: 10000 });
    for (let guard = 0; guard < 12; guard++) {
      if ((await this.selectMonthBtn.count()) === 0) break;
      await this.selectMonthBtn.first().click();
      await this.page.waitForTimeout(500);
    }
  }

  async savePayment() {
    const btn = this.savePaymentBtn.first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await this.page.getByText(/Confirm Payment Allocation/i).waitFor({ state: 'visible', timeout: 10000 });
  }

  /** Reads the payable amount (৳) shown in the confirm dialog and asserts it is > 0. */
  async verifyPaymentAmount() {
    const amounts = await this.page.evaluate(() => {
      const c = (s) => (s || '').replace(/\s+/g, ' ').trim();
      return [...document.querySelectorAll('*')]
        .map((el) => c(el.innerText))
        .map((t) => (t.match(/৳\s*([\d,]+(?:\.\d+)?)/) || [])[1])
        .filter(Boolean)
        .map((n) => Number(n.replace(/,/g, '')));
    });
    const max = Math.max(0, ...amounts);
    expect(max, 'expected a positive payment amount in the confirm dialog').toBeGreaterThan(0);
    return max;
  }

  async confirmAndSave() {
    await this.confirmSaveBtn.first().click();
    // Success dialog OK is the top-most (last) — first() can resolve to a covered one.
    await expect(this.okBtn.last()).toBeVisible({ timeout: 30000 });
    await this.okBtn.last().click();
  }

  /** Opens the bell and asserts the "Payment Received" notification for the tower. */
  async verifyPaymentNotification(towerName) {
    await this.notificationBell.click();
    await expect(this.page.getByText(/Payment Received/i).first()).toBeVisible({ timeout: 15000 });
    await expect(this.page.getByText(towerName, { exact: false }).first()).toBeVisible({ timeout: 10000 });
  }

  /** Opens the bell and asserts the "Advance Payment Received" notification for the tower. */
  async verifyAdvancePaymentNotification(towerName) {
    await this.notificationBell.click();
    await expect(this.page.getByText(/Advance Payment Received/i).first()).toBeVisible({ timeout: 15000 });
    await expect(this.page.getByText(towerName, { exact: false }).first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Full record-payment flow for a tower's (single) card.
   * @param {string} towerName
   */
  async recordPayment(towerName) {
    // Search narrows the (paginated) list to this tower's card.
    await this.searchInput.fill(towerName);
    await this.page.waitForTimeout(2000);
    await this.openRecordPaymentForTower(towerName);
    await this.selectMonth();
    await this.savePayment();
    await this.verifyPaymentAmount();
    await this.confirmAndSave();
    await this.verifyPaymentNotification(towerName);
  }

  /**
   * Partial payment: pays HALF of the auto-filled Total Amount (Total Due).
   * @param {string} towerName
   * @returns {Promise<number>} the partial amount paid
   */
  async recordPartialPayment(towerName) {
    await this.searchInput.fill(towerName);
    await this.page.waitForTimeout(2000);
    await this.openRecordPaymentForTower(towerName);
    await this.selectMonth();

    await this.amountInput.waitFor({ state: 'visible', timeout: 10000 });
    const fullDue = Number((await this.amountInput.inputValue()).replace(/,/g, ''));
    expect(fullDue, 'expected a positive Total Due').toBeGreaterThan(0);
    const half = Math.floor(fullDue / 2);
    await this.amountInput.fill(String(half));

    await this.savePayment();
    await this.verifyPaymentAmount();
    await this.confirmAndSave();
    await this.verifyPaymentNotification(towerName);
    return half;
  }

  /** Opens the bell and asserts the "Advance Payment Received" notification (with amount) for the tower. */
  async verifyAdvancePaymentNotification(towerName, amount = 1000) {
    const formatted = Number(amount).toLocaleString('en-US');
    await this.notificationBell.click();
    await expect(this.page.getByText(/Advance Payment Received/i).first()).toBeVisible({ timeout: 15000 });
    await expect(
      this.page.getByText(new RegExp(`${formatted}\\s*advance payment received`, 'i')).first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(this.page.getByText(towerName, { exact: false }).first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Advance payment: with the current month already paid, re-opens Record Payment for the
   * same unit and pays a flat amount (no month to select) — server records it as advance credit.
   * @param {string} towerName
   * @param {number} [amount=1000] advance amount in BDT
   */
  async recordAdvancePayment(towerName, amount = 1000) {
    // Close the notification panel left open by the prior payment so it doesn't cover the list.
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);

    await this.searchInput.fill(towerName);
    await this.page.waitForTimeout(2000);
    await this.openRecordPaymentForTower(towerName);

    // No outstanding month card — pay an advance by entering the amount directly.
    await this.amountInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.amountInput.fill(String(amount));

    await this.savePayment();
    await this.confirmAndSave();
    await this.verifyAdvancePaymentNotification(towerName, amount);
  }

  /**
   * Advance payment: re-opens Record Payment (after dues are cleared) and pays a fixed
   * advance amount via "Total Amount (BDT)" with no month selected.
   * @param {string} towerName
   * @param {number} amount
   */
  async recordAdvancePayment(towerName, amount) {
    await this.searchInput.fill(towerName);
    await this.page.waitForTimeout(2000);
    await this.openRecordPaymentForTower(towerName);

    // No outstanding month to select — enter the advance amount directly.
    await this.amountInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.amountInput.fill(String(amount));

    await this.savePayment();
    await this.verifyPaymentAmount();
    await this.confirmAndSave();
    await this.verifyAdvancePaymentNotification(towerName);
  }

  /**
   * Overpayment: selects a past month in the list filter, then pays MORE than the due
   * amount (no month card selected) — clears the bill and leaves the surplus as advance.
   * @param {string} towerName
   * @param {number} amount total to pay (due + advance surplus)
   * @param {Date} monthDate the month whose bill is outstanding
   */
  async recordOverpayment(towerName, amount, monthDate) {
    await this.selectListMonth(monthDate);
    await this.searchInput.fill(towerName);
    await this.page.waitForTimeout(2000);
    await this.openRecordPaymentForTower(towerName);
    await this.amountInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.amountInput.fill(String(amount));
    await this.savePayment();
    await this.verifyPaymentAmount();
    await this.confirmAndSave();
    await this.verifyPaymentNotification(towerName); // matches "Payment Received" / "Advance Payment Received"
  }

  /**
   * Pays ALL outstanding month bills in full (selects every month card).
   * @param {string} towerName
   */
  async recordPaymentAllMonths(towerName) {
    await this.searchInput.fill(towerName);
    await this.page.waitForTimeout(2000);
    await this.openRecordPaymentForTower(towerName);
    await this.selectAllMonths();
    await this.savePayment();
    await this.verifyPaymentAmount();
    await this.confirmAndSave();
    await this.verifyPaymentNotification(towerName);
  }
}
