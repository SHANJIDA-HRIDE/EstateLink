import { test, expect } from '../../fixtures/customTest';

// Logged-in user (auth.setup account) — "My Post" lists notices they created.
const CURRENT_USER = 'Shanjida Hride';

const TABS = [
  { name: 'Ongoing', open: (b) => b.goToOngoingTab() },
  { name: 'Upcoming', open: (b) => b.goToUpcomingTab() },
  { name: 'Expired', open: (b) => b.goToExpiredTab() },
];

test.describe('Notice Board - Filters & Search', () => {
  // Read-only filter checks against a shared live account — run serially so
  // concurrent sessions don't cause list-latency flakiness.
  test.describe.configure({ mode: 'serial' });

  for (const tab of TABS) {
    test(`filters, search and My Post work on the ${tab.name} tab`, async ({ noticeBoardPage, page }) => {
      test.setTimeout(120000);

      await noticeBoardPage.navigateTo();
      await tab.open(noticeBoardPage);
      await page.waitForTimeout(1500); // let the tab's list settle
      const baseCount = await noticeBoardPage.cardCount();

      await test.step('search filters the list', async () => {
        await noticeBoardPage.searchNotices('zzz-no-such-notice-xyz');
        await expect.poll(() => noticeBoardPage.cardCount(), { timeout: 10000 }).toBe(0);
        await noticeBoardPage.searchNotices('');
        if (baseCount > 0) {
          await expect.poll(() => noticeBoardPage.cardCount(), { timeout: 10000 }).toBeGreaterThan(0);
        }
      });

      await test.step('priority filter applies (active count badge)', async () => {
        await noticeBoardPage.navigateTo();
        await tab.open(noticeBoardPage);
        await noticeBoardPage.filterByPriority('Urgent');
        // Active filter shows a count badge, e.g. "Select Priority 1".
        await expect(noticeBoardPage.priorityFilterBtn).toContainText('1');
      });

      if (baseCount > 0) {
        await test.step('label filter narrows the list to the chosen label', async () => {
          await noticeBoardPage.navigateTo();
          await tab.open(noticeBoardPage);
          const label = await noticeBoardPage.firstCardLabel();
          await noticeBoardPage.filterByLabel(label);
          // Poll until the list has actually filtered (every card carries the label).
          // everyCardHasLabel is false while 0 cards, so this also waits for results.
          await expect.poll(() => noticeBoardPage.everyCardHasLabel(label), { timeout: 15000 }).toBe(true);
        });

        await test.step('My Post shows only notices created by the current user', async () => {
          await noticeBoardPage.navigateTo();
          await tab.open(noticeBoardPage);
          await page.waitForTimeout(1000);

          // Turn on: checkbox checks and every visible card is "Creator <current user>".
          await noticeBoardPage.toggleMyPost();
          await expect.poll(() => noticeBoardPage.isMyPostChecked(), { timeout: 10000 }).toBe(true);
          await expect
            .poll(() => noticeBoardPage.everyCardHasCreator(CURRENT_USER), { timeout: 10000 })
            .toBe(true);
        });
      } else {
        test.info().annotations.push({
          type: 'note',
          description: `${tab.name} tab has no notices — label/My Post checks skipped.`,
        });
      }
    });
  }

  test('date range filter (From / To) narrows the list by date', async ({ noticeBoardPage }) => {
    test.setTimeout(120000);

    await noticeBoardPage.navigateTo();
    await noticeBoardPage.goToOngoingTab();
    await noticeBoardPage.page.waitForTimeout(1500);
    const base = await noticeBoardPage.cardCount();
    expect(base).toBeGreaterThan(0);

    await test.step('a far-past date range yields no notices', async () => {
      await noticeBoardPage.setDateRange(new Date(2020, 0, 1), new Date(2020, 0, 31));
      await expect.poll(() => noticeBoardPage.cardCount(), { timeout: 15000 }).toBe(0);
    });

    await test.step('clearing the range (reload) restores the list', async () => {
      await noticeBoardPage.navigateTo();
      await noticeBoardPage.goToOngoingTab();
      await expect.poll(() => noticeBoardPage.cardCount(), { timeout: 15000 }).toBeGreaterThan(0);
    });
  });
});
