import { test, expect } from '../../fixtures/customTest';

test.describe('Org Member List - Filters & Search', () => {
  // Read-only checks against a shared live account — serial avoids
  // concurrent-session latency flakiness.
  test.describe.configure({ mode: 'serial' });

  test('search, Member Type & Role filters work', async ({ memberListPage }) => {
    test.setTimeout(180000);
    const list = memberListPage;

    await test.step('list loads with at least one member', async () => {
      await list.navigateTo();
      await list.waitForRows();
    });

    await test.step('search finds a member by name', async () => {
      await list.navigateTo();
      await list.waitForRows();
      const [first] = await list.rowCells();
      expect(first, 'expected at least one row to read a name from').toBeTruthy();
      await list.searchMember(first.name);
      // Search is server-side (~seconds); poll until a matching row shows.
      await expect.poll(() => list.rowsMatchingName(first.name), { timeout: 20000 }).toBeGreaterThan(0);
    });

    await test.step('Member Type = Management — every row is Management', async () => {
      await list.navigateTo();
      await list.filterByMemberType('Management');
      await expect.poll(() => list.everyRowHasType('Management'), { timeout: 20000 }).toBe(true);
    });

    await test.step('Member Type = Property Staff — every row is Property Staff', async () => {
      await list.navigateTo();
      await list.filterByMemberType('Property Staff');
      // Org may have no Property Staff; assert filtered rows are all that type (or none).
      await expect
        .poll(async () => (await list.rowCount()) === 0 || list.everyRowHasType('Property Staff'), { timeout: 20000 })
        .toBe(true);
    });

    await test.step('Role = Superadmin — every row carries that role', async () => {
      await list.navigateTo();
      await list.filterByRole('Superadmin');
      await expect.poll(() => list.everyRowRoleContains('Superadmin'), { timeout: 20000 }).toBe(true);
    });

    await test.step('combined: Member Type + Role + search applied together', async () => {
      // One page load — filters/search stack (navigating would reset them).
      await list.navigateTo();
      await list.waitForRows();
      await list.filterByMemberType('Management');
      await list.filterByRole('Superadmin');
      await expect.poll(() => list.everyRowHasType('Management'), { timeout: 20000 }).toBe(true);

      // Pick a member from the filtered set, then search it — must still match all three.
      const [first] = await list.rowCells();
      expect(first, 'expected a row after Type+Role filter to search by').toBeTruthy();
      const term = first.name;
      await list.searchMember(term);
      await expect
        .poll(async () => {
          const rows = await list.rowCells();
          return (
            rows.length > 0 &&
            rows.every(
              (r) =>
                r.type === 'Management' &&
                r.role.includes('Superadmin') &&
                r.name.toLowerCase().includes(term.toLowerCase()),
            )
          );
        }, { timeout: 20000 })
        .toBe(true);
    });

    await test.step('search for a non-existent name returns no members', async () => {
      await list.navigateTo();
      await list.waitForRows();
      await list.searchMember('Zxqv Nonexistent Member 99999');
      await expect.poll(() => list.rowCount(), { timeout: 20000 }).toBe(0);
    });
  });
});
