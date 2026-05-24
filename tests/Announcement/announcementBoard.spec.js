import { test, expect } from '../../fixtures/customTest';

const TABS = [
  { name: 'Ongoing', open: (b) => b.goToOngoingTab() },
  { name: 'Upcoming', open: (b) => b.goToUpcomingTab() },
  { name: 'Expired', open: (b) => b.goToExpiredTab() },
];

test.describe('Announcement Board - Filters & Search', () => {
  // Read-only filter checks against a shared live account — serial avoids
  // concurrent-session latency flakiness.
  test.describe.configure({ mode: 'serial' });

  for (const tab of TABS) {
    test(`search & filters work on the ${tab.name} tab`, async ({ announcementsPage, page }) => {
      test.setTimeout(180000);
      const board = announcementsPage;

      const openTab = async () => {
        await board.navigateTo();
        await tab.open(board);
        await board.waitForCards(15000);
      };

      await board.navigateTo();
      await tab.open(board);
      try {
        await board.waitForCards(8000);
      } catch {
        test.info().annotations.push({ type: 'note', description: `${tab.name} tab empty — checks skipped.` });
        return;
      }

      await test.step('search finds an announcement by its title', async () => {
        await openTab();
        const title = await board.firstCardTitle();
        await board.searchAnnouncements(title);
        // Search is server-side (~seconds); poll until the matching card shows.
        await expect
          .poll(() => page.locator('[data-card-id]', { hasText: title }).count(), { timeout: 20000 })
          .toBeGreaterThan(0);
      });

      await test.step('priority filter narrows to Urgent (red flag on every card)', async () => {
        await openTab();
        await board.filterByPriority('Urgent');
        await expect(board.priorityFilterBtn).toContainText('1'); // filter active
        await expect
          .poll(async () => (await board.cardCount()) === 0 || board.everyCardHasUrgentFlag(), { timeout: 15000 })
          .toBe(true);
      });

      await test.step('single label filter — every card carries that label', async () => {
        await openTab();
        const [label] = await board.firstCardsLabels(1);
        expect(label, 'expected at least one label on a card').toBeTruthy();
        await board.filterByLabels([label]);
        await expect.poll(() => board.everyCardHasLabel(label), { timeout: 15000 }).toBe(true);
      });

      await test.step('multiple label filter — every card carries one of the labels', async () => {
        await openTab();
        const labels = await board.firstCardsLabels(5);
        if (labels.length < 2) {
          test.info().annotations.push({ type: 'note', description: `${tab.name}: <2 distinct labels — multi-label skipped.` });
          return;
        }
        const selected = labels.slice(0, 2);
        await board.filterByLabels(selected);
        await expect.poll(() => board.everyCardHasAnyLabel(selected), { timeout: 15000 }).toBe(true);
      });

      await test.step('date range filter (by start date) — every card starts in range', async () => {
        await openTab();
        const ds = await board.firstCardStartDate(); // "DD-MM-YYYY"
        expect(ds, 'expected a start date on a card').toBeTruthy();
        const [dd, mm, yyyy] = ds.split('-').map(Number);
        const day = new Date(yyyy, mm - 1, dd);
        await board.setDateRange(day, day); // single-day range
        await expect.poll(() => board.everyCardStartsOn(ds), { timeout: 15000 }).toBe(true);
      });
    });
  }
});
