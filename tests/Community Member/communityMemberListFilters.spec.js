import { test, expect } from '../../fixtures/customTest';

test.describe('Community Member List - Filters', () => {
  test.describe.configure({ mode: 'serial' });

  // CM-12: Filter by Member Type = Owner -> every row Type column = "Owner".
  test('CM-12 Filter by Member Type Owner narrows rows to Owner', async ({
    communityMemberListPage,
  }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();
    await communityMemberListPage.filterByMemberType('Owner');
    await expect
      .poll(() => communityMemberListPage.everyRowHasType('Owner'), { timeout: 15000 })
      .toBe(true);
  });

  // CM-13: Filter by Member Type = Resident -> every row Type = "Resident" exactly.
  // (Resident and Resident (Tenant) are separate filter options; the column reflects
  // whichever exact option is selected.)
  test('CM-13 Filter by Member Type Resident narrows rows to Resident', async ({
    communityMemberListPage,
  }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();
    await communityMemberListPage.filterByMemberType('Resident');
    await expect
      .poll(() => communityMemberListPage.everyRowHasType('Resident'), { timeout: 15000 })
      .toBe(true);
  });

  // CM-14: Filter by Member Type = Staff -> every row Type = "Staff".
  // (Filter option and column both read "Staff", not "Unit Staff".)
  test('CM-14 Filter by Member Type Staff narrows rows to Staff', async ({
    communityMemberListPage,
  }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();
    await communityMemberListPage.filterByMemberType('Staff');
    await expect
      .poll(() => communityMemberListPage.everyRowHasType('Staff'), { timeout: 15000 })
      .toBe(true);
  });

  // CM-17: Reset/Clear filter -> selecting "All" restores full list (mixed Types).
  test('CM-17 Reset filter restores full list', async ({ communityMemberListPage }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();

    // Apply Owner -> only Owner rows.
    await communityMemberListPage.filterByMemberType('Owner');
    await expect
      .poll(() => communityMemberListPage.everyRowHasType('Owner'), { timeout: 15000 })
      .toBe(true);

    // Reset via "All".
    await communityMemberListPage.filterByMemberType('All');
    await expect
      .poll(async () => {
        const rows = await communityMemberListPage.rowCells();
        const types = new Set(rows.map((r) => r.type));
        return rows.length > 0 && types.size > 1;
      }, { timeout: 15000 })
      .toBe(true);
  });

  // CM-19: Search + Member Type filter both apply. Pick an Owner row, derive a
  // distinctive token from the name, then assert every row matches the token
  // AND Type = Owner.
  test('CM-19 Search + Type filter both apply', async ({ communityMemberListPage }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();

    // Filter to Owners first, then pick a search token from an Owner row.
    await communityMemberListPage.filterByMemberType('Owner');
    await expect
      .poll(() => communityMemberListPage.everyRowHasType('Owner'), { timeout: 15000 })
      .toBe(true);

    const seed = await communityMemberListPage.firstRowName();
    const token = seed
      .split(/\s+/)
      .filter((w) => w.length >= 4)
      .sort((a, b) => b.length - a.length)[0];
    expect(token?.length).toBeGreaterThanOrEqual(4);

    await communityMemberListPage.search(token);

    await expect
      .poll(async () => {
        const rows = await communityMemberListPage.rowCells();
        return (
          rows.length > 0 &&
          rows.every(
            (r) =>
              r.type === 'Owner' &&
              (r.name.toLowerCase().includes(token.toLowerCase()) ||
                r.email.toLowerCase().includes(token.toLowerCase())),
          )
        );
      }, { timeout: 15000 })
      .toBe(true);
  });

  // CM-22: Combined filters with no match -> empty list. Apply Type=Staff +
  // non-existent search token -> no rows.
  test('CM-22 Combined filters with no match show empty list', async ({
    communityMemberListPage,
  }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();
    await communityMemberListPage.filterByMemberType('Staff');
    await communityMemberListPage.search(`xyz_nomatch_${Date.now()}`);
    await communityMemberListPage.waitForNoRows(15000);
  });

  // CM-40: concurrent typing + dropdown change. Start typing the search term
  // and, before the keystrokes finish, open the Member Type dropdown and apply
  // Owner. Final state must reflect BOTH: every row is Owner AND matches the
  // search token (no torn/desynced UI).
  test('CM-40 Concurrent search typing + Member Type change settles consistently', async ({
    communityMemberListPage,
    page,
  }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();

    const term = 'Hossain';

    // Fire search fill and dropdown change in parallel: while the search-driven
    // refetch is in flight, apply the Member Type change. The UI must settle
    // to a state that honors BOTH inputs, not just the last one.
    await Promise.all([
      communityMemberListPage.search(term),
      (async () => {
        // Slight stagger so the dropdown click lands during the search refetch.
        await page.waitForTimeout(120);
        await communityMemberListPage.filterByMemberType('Owner');
      })(),
    ]);

    // Search value finalized to the full term.
    await expect(communityMemberListPage.searchInput).toHaveValue(term, { timeout: 5000 });

    // Rows reflect both filters: Type=Owner AND token in name/email.
    await expect
      .poll(async () => {
        const rows = await communityMemberListPage.rowCells();
        return (
          rows.length > 0 &&
          rows.every(
            (r) =>
              r.type === 'Owner' &&
              (r.name.toLowerCase().includes(term.toLowerCase()) ||
                r.email.toLowerCase().includes(term.toLowerCase())),
          )
        );
      }, { timeout: 15000 })
      .toBe(true);
  });

  // CM-20 / CM-21: skipped — this list has no Tower filter (only Member Type +
  // Status). Tower-based filtering is exercised on other modules.
  test.skip('CM-20 Type + Tower filter both apply (not applicable: no Tower filter)', () => {});
  test.skip('CM-21 Search + Type + Tower filter (not applicable: no Tower filter)', () => {});

  // CM-18: Member Type dropdown loads expected options (All + at least one role).
  // (Tower / Role filters are not present on this list; the only async-loaded
  // dropdown here is Member Type.)
  test('CM-18 Member Type dropdown loads expected options', async ({
    communityMemberListPage,
  }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();
    await communityMemberListPage.openMemberTypeMenu();

    const opts = await communityMemberListPage.memberTypeOptions();
    expect(opts).toEqual(
      expect.arrayContaining(['All', 'Owner', 'Resident', 'Resident (Tenant)', 'Staff']),
    );
  });
});
