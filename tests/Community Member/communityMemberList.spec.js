import { test, expect } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

test.describe('Community Member List - Search', () => {
  test.describe.configure({ mode: 'serial' });

  // CM-05: search by full name -> every row name contains the query (case-insensitive).
  test('CM-05 Search by full name narrows rows', async ({ communityMemberListPage }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();

    const seed = await communityMemberListPage.firstRowName();
    expect(seed.length).toBeGreaterThan(0);

    await communityMemberListPage.search(seed);
    await expect
      .poll(() => communityMemberListPage.everyRowNameOrEmailContains(seed), { timeout: 15000 })
      .toBe(true);
  });

  // CM-06: search by partial name (first token) still narrows; rows contain the substring.
  test('CM-06 Search by partial name narrows rows', async ({ communityMemberListPage }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();

    const seed = await communityMemberListPage.firstRowName();
    // Search ignores very short tokens (<3 chars). Pick the longest word to
    // form a meaningful substring query.
    const partial = seed
      .split(/\s+/)
      .filter((w) => w.length >= 4)
      .sort((a, b) => b.length - a.length)[0];
    expect(partial?.length).toBeGreaterThanOrEqual(4);

    await communityMemberListPage.search(partial);
    await expect
      .poll(() => communityMemberListPage.everyRowNameOrEmailContains(partial), { timeout: 15000 })
      .toBe(true);
  });

  // CM-07: search by email substring (@gmail.com domain) -> every visible row email contains it.
  test('CM-07 Search by email substring narrows rows', async ({ communityMemberListPage }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();

    const term = '@gmail.com';
    await communityMemberListPage.search(term);
    await expect
      .poll(async () => {
        const rows = await communityMemberListPage.rowCells();
        return rows.length > 0 && rows.every((r) => r.email.toLowerCase().includes(term));
      }, { timeout: 15000 })
      .toBe(true);
  });

  // CM-08: search input placeholder reads "Search name or email" — typing a contact
  // number returns no rows (search-by-contact is intentionally unsupported).
  test('CM-08 Search by contact number returns empty (unsupported)', async ({ communityMemberListPage }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();

    const contact = await communityMemberListPage.firstRowContact();
    expect(contact.length).toBeGreaterThan(0);

    await communityMemberListPage.search(contact);
    await communityMemberListPage.waitForNoRows(15000);
  });

  // CM-09: non-existent term -> empty state, no rows.
  test('CM-09 Non-existent term shows empty state', async ({ communityMemberListPage }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();

    const term = `xyz_nomatch_${Helpers.uniqueId()}`;
    await communityMemberListPage.search(term);
    await communityMemberListPage.waitForNoRows(15000);
  });

  // CM-10: clearing the search restores the full list.
  test('CM-10 Clear search restores full list', async ({ communityMemberListPage }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();

    const baseline = await communityMemberListPage.rowCount();
    expect(baseline).toBeGreaterThan(0);

    await communityMemberListPage.search(`xyz_nomatch_${Helpers.uniqueId()}`);
    await communityMemberListPage.waitForNoRows(15000);

    await communityMemberListPage.clearSearch();
    await expect
      .poll(() => communityMemberListPage.rowCount(), { timeout: 15000 })
      .toBeGreaterThan(0);
  });

  // CM-11: rapid typing settles to final query (debounce) -> rows match final, not intermediate.
  test('CM-11 Rapid typing settles to final query', async ({ communityMemberListPage, page }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();

    const seed = await communityMemberListPage.firstRowName();
    const partial = seed
      .split(/\s+/)
      .filter((w) => w.length >= 4)
      .sort((a, b) => b.length - a.length)[0];
    expect(partial?.length).toBeGreaterThanOrEqual(4);

    // Type a noise prefix, then quickly replace with the real query.
    await communityMemberListPage.search('zzznoise');
    await page.waitForTimeout(120);
    await communityMemberListPage.search(partial);

    await expect
      .poll(() => communityMemberListPage.everyRowNameOrEmailContains(partial), { timeout: 15000 })
      .toBe(true);
  });
});
