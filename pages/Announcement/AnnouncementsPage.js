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
