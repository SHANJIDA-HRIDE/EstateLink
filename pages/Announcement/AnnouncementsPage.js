import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

export class AnnouncementsPage extends BasePage {
  constructor(page) {
    super(page);
    this.createBtn = page.getByRole('button', { name: /Create Announcement/i });
    this.ongoingTab = page.getByRole('tab', { name: /Ongoing/i });
    this.upcomingTab = page.getByRole('tab', { name: /Upcoming/i });
    this.expiredTab = page.getByRole('tab', { name: /Expired/i });
    this.searchInput = page.getByPlaceholder('Search...');

    // Filters
    this.priorityFilterBtn = page.getByRole('button', { name: /Select Priority/i });
    this.labelFilterBtn = page.getByRole('button', { name: /Select Label/i });
    this.doneBtn = page.getByRole('button', { name: /^Done$/ });

    // Each announcement renders as a card with a stable data attribute.
    this.cards = page.locator('[data-card-id]');
  }

  cardCount() {
    return this.cards.count();
  }

  /** Waits for the card list to render at least one card (or times out if the tab is empty). */
  async waitForCards(timeout = 15000) {
    await this.cards.first().waitFor({ state: 'visible', timeout });
  }

  async searchAnnouncements(term) {
    await this.searchInput.fill(term);
  }

  /** Title (h4) of the first visible card. */
  async firstCardTitle() {
    return (await this.cards.first().locator('h4').first().innerText()).trim();
  }

  /** First label chip text from each of the first N cards (distinct). */
  async firstCardsLabels(n) {
    return this.page.evaluate((count) => {
      const labels = [];
      const cards = [...document.querySelectorAll('[data-card-id]')].slice(0, count);
      for (const c of cards) {
        // label chips live in a "flex flex-wrap gap-1" row as <span>s
        const row = [...c.querySelectorAll('div')].find((d) => {
          const cl = d.getAttribute('class') || '';
          return cl.includes('flex-wrap') && cl.includes('gap-1') && d.querySelector('span');
        });
        const span = row?.querySelector('span');
        if (span && span.innerText.trim()) labels.push(span.innerText.trim());
      }
      return [...new Set(labels)];
    }, n);
  }

  async filterByPriority(level) {
    await this.priorityFilterBtn.click();
    await this.page.getByText(new RegExp(`^${level}$`)).first().click();
    if (await this.doneBtn.count()) await this.doneBtn.first().click();
  }

  /** Selects one or more labels in the Select Label filter (options are checkbox <label>s). */
  async filterByLabels(labels) {
    await this.labelFilterBtn.click();
    for (const label of labels) {
      await this.page.locator('label').filter({ hasText: label }).first().click();
    }
    if (await this.doneBtn.count()) await this.doneBtn.first().click();
  }

  async everyCardHasLabel(labelText) {
    return this.page.evaluate((text) => {
      const cards = [...document.querySelectorAll('[data-card-id]')];
      return cards.length > 0 && cards.every((c) => c.innerText.includes(text));
    }, labelText);
  }

  async everyCardHasAnyLabel(labels) {
    return this.page.evaluate((arr) => {
      const cards = [...document.querySelectorAll('[data-card-id]')];
      return cards.length > 0 && cards.every((c) => arr.some((l) => c.innerText.includes(l)));
    }, labels);
  }

  /** True if every card carries an Urgent (red) priority flag. */
  async everyCardHasUrgentFlag() {
    return this.page.evaluate(() => {
      const cards = [...document.querySelectorAll('[data-card-id]')];
      return cards.length > 0 && cards.every((c) =>
        [...c.querySelectorAll('svg')].some((s) => getComputedStyle(s).color === 'rgb(239, 68, 68)'),
      );
    });
  }

  /** Start date ("DD-MM-YYYY") of the first visible card. */
  async firstCardStartDate() {
    return this.page.evaluate(() => {
      const c = document.querySelector('[data-card-id]');
      const m = c && c.innerText.match(/Start:\s*(\d{2}-\d{2}-\d{4})/);
      return m ? m[1] : null;
    });
  }

  async everyCardStartsOn(dateStr) {
    return this.page.evaluate((d) => {
      const cards = [...document.querySelectorAll('[data-card-id]')];
      return cards.length > 0 && cards.every((c) => c.innerText.includes(`Start: ${d}`));
    }, dateStr);
  }

  /**
   * Picks a date in a From/To filter input (react-datepicker; clicks by aria-label
   * so it can't land on the wrong month if the year-select re-render lags).
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
    const dayLabel = new RegExp(`${monthName} ${date.getDate()}(st|nd|rd|th)?,?\\s+${date.getFullYear()}`);
    await dp.getByLabel(dayLabel).first().click({ force: true });
    await dp.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  async setDateRange(from, to) {
    await this.pickFilterDate('From', from);
    await this.pickFilterDate('To', to);
  }

  async navigateTo() {
    await this.navigate(`${ENV.BASE_URL}/announcements`);
    await this.createBtn.waitFor({ state: 'visible', timeout: 30000 });
  }

  async clickCreateAnnouncement() {
    await this.createBtn.click();
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
   * Confirms an announcement with the given title is listed under the given tab.
   * Re-navigates + re-searches on each poll to absorb async list refresh.
   * @param {import('@playwright/test').Locator} tabLocator
   */
  async #verifyAnnouncementInTab(tabLocator, title) {
    await expect(async () => {
      await this.navigateTo();
      await tabLocator.click();
      await this.searchInput.fill(title);
      await expect(
        this.page.getByText(title, { exact: false }).first(),
      ).toBeVisible({ timeout: 5000 });
    }).toPass({ intervals: [1000, 2000, 4000], timeout: 45000 });
  }

  async verifyAnnouncementInOngoing(title) {
    await this.#verifyAnnouncementInTab(this.ongoingTab, title);
  }

  async verifyAnnouncementInUpcoming(title) {
    await this.#verifyAnnouncementInTab(this.upcomingTab, title);
  }

  async verifyAnnouncementInExpired(title) {
    await this.#verifyAnnouncementInTab(this.expiredTab, title);
  }
}
