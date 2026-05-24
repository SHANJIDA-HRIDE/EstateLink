import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

export class NoticeBoardPage extends BasePage {
  constructor(page) {
    super(page);
    this.addNoticeBtn = page.getByRole('button', { name: /Add Notice/i });
    this.ongoingTab = page.getByRole('tab', { name: /Ongoing/i });
    this.upcomingTab = page.getByRole('tab', { name: /Upcoming/i });
    this.expiredTab = page.getByRole('tab', { name: /Expired/i });
    this.searchInput = page.getByPlaceholder('Search...');

    // Notification bell (top-right)
    this.notificationBell = page.getByRole('button', { name: 'Notifications' });

    // Filters
    this.priorityFilterBtn = page.getByRole('button', { name: /Select Priority/i });
    this.labelFilterBtn = page.getByRole('button', { name: /Select Label/i });
    this.myPostToggle = page.getByText('My Post', { exact: true }).first();
    this.doneBtn = page.getByRole('button', { name: /^Done$/ });

    // Each notice renders as a card with a stable data attribute.
    this.cards = page.locator('[data-card-id]');
  }

  cardCount() {
    return this.cards.count();
  }

  async searchNotices(term) {
    await this.searchInput.fill(term);
  }

  /** Selects a priority in the Select Priority filter dropdown. */
  async filterByPriority(level) {
    await this.priorityFilterBtn.click();
    await this.page.getByText(new RegExp(`^${level}$`)).first().click();
    if (await this.doneBtn.count()) {
      await this.doneBtn.first().click();
    }
  }

  /** Opens the Select Label filter and chooses a label (options are checkbox <label>s). */
  async filterByLabel(labelText) {
    await this.labelFilterBtn.click();
    await this.page.locator('label').filter({ hasText: labelText }).first().click();
    if (await this.doneBtn.count()) {
      await this.doneBtn.first().click();
    }
  }

  async toggleMyPost() {
    await this.myPostToggle.click();
  }

  /**
   * Picks a date in a From/To filter input (react-datepicker; auto-applies).
   * @param {'From'|'To'} placeholder
   * @param {Date} date
   */
  async pickFilterDate(placeholder, date) {
    await this.page.getByPlaceholder(placeholder).click();
    const dp = this.page.locator('.react-datepicker').first();
    await dp.waitFor({ state: 'visible', timeout: 10000 });

    const monthName = date.toLocaleString('en-US', { month: 'long' });
    await dp.locator('select').nth(0).selectOption({ label: monthName });
    await dp.locator('select').nth(1).selectOption({ label: String(date.getFullYear()) });

    // Click by the day cell's aria-label ("Choose ... January 1st, 2020"). This only
    // matches once the correct month/year has rendered — robust against select re-render lag.
    const dayLabel = new RegExp(`${monthName} ${date.getDate()}(st|nd|rd|th)?,?\\s+${date.getFullYear()}`);
    await dp.getByLabel(dayLabel).first().click({ force: true });

    // Wait for the picker to close so the selection is committed before continuing.
    await dp.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  async setDateRange(from, to) {
    await this.pickFilterDate('From', from);
    await this.pickFilterDate('To', to);
  }

  /** Label chip text of the first visible card. */
  async firstCardLabel() {
    return (await this.cards.first().locator('span.bg-label').first().innerText()).trim();
  }

  /** True if every visible card carries a label chip containing labelText. */
  async everyCardHasLabel(labelText) {
    return this.page.evaluate((text) => {
      const cards = [...document.querySelectorAll('[data-card-id]')];
      return cards.length > 0 && cards.every((c) => [...c.querySelectorAll('span.bg-label')].some((s) => s.innerText.includes(text)));
    }, labelText);
  }

  /** True if every visible card shows "Creator <name>" (i.e. created by that user). */
  async everyCardHasCreator(name) {
    return this.page.evaluate((n) => {
      const cards = [...document.querySelectorAll('[data-card-id]')];
      return cards.length > 0 && cards.every((c) => c.innerText.includes(`Creator ${n}`));
    }, name);
  }

  /** Whether the "My Post" filter checkbox is currently checked. */
  async isMyPostChecked() {
    return this.page.evaluate(() => {
      const span = [...document.querySelectorAll('span')].find((s) => s.innerText.trim() === 'My Post');
      let el = span;
      for (let i = 0; i < 5 && el && el.parentElement; i++) {
        el = el.parentElement;
        const cb = el.querySelector('input[type=checkbox]');
        if (cb) return cb.checked;
      }
      return false;
    });
  }

  async navigateTo() {
    await this.navigate(`${ENV.BASE_URL}/notice-board`);
    await this.addNoticeBtn.waitFor({ state: 'visible', timeout: 30000 });
  }

  async clickAddNotice() {
    await this.addNoticeBtn.click();
  }

  async goToOngoingTab() {
    await this.ongoingTab.click();
  }

  async goToUpcomingTab() {
    await this.upcomingTab.click();
  }

  async goToExpiredTab() {
    await this.expiredTab.click();
  }

  /**
   * Confirms a notice is listed under the given tab.
   * The list's Search box does NOT match label text, so we don't search — newest
   * notices render at the top, and the unique label chip is asserted directly.
   * Re-navigates on each poll to absorb async list refresh.
   * @param {import('@playwright/test').Locator} tabLocator
   * @param {string} labelText – the unique label chip identifying the notice
   */
  async #verifyNoticeInTab(tabLocator, labelText) {
    await expect(async () => {
      await this.navigateTo();
      await tabLocator.click();
      await expect(
        this.page.getByText(labelText, { exact: false }).first(),
      ).toBeVisible({ timeout: 5000 });
    }).toPass({ intervals: [1000, 2000, 4000], timeout: 45000 });
  }

  async verifyNoticeInOngoing(searchTerm) {
    await this.#verifyNoticeInTab(this.ongoingTab, searchTerm);
  }

  /**
   * Opens the notification bell and asserts a "New Notice has been posted by - <creator>"
   * entry is present (triggered when a notice is created).
   */
  async verifyNewNoticeNotification(creatorName) {
    await this.notificationBell.click();
    await expect(
      this.page.getByText(new RegExp(`New Notice has been posted by\\s*-?\\s*${creatorName}`, 'i')).first(),
    ).toBeVisible({ timeout: 15000 });
  }

  async verifyNoticeInUpcoming(searchTerm) {
    await this.#verifyNoticeInTab(this.upcomingTab, searchTerm);
  }

  async verifyNoticeInExpired(searchTerm) {
    await this.#verifyNoticeInTab(this.expiredTab, searchTerm);
  }
}
