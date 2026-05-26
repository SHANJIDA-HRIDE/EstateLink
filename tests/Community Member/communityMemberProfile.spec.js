import { test, expect } from '../../fixtures/customTest';

/**
 * Mapping from list Type column -> Community Member tab card heading.
 * Owner -> Ownership Details, Resident & Resident (Tenant) -> Resident Details,
 * Staff -> Unit Staff Details.
 */
const CARD_HEADING_FOR_TYPE = {
  Owner: /Ownership Details/i,
  Resident: /Resident Details/i,
  'Resident (Tenant)': /Resident Details/i,
  Staff: /Unit Staff/i,
};

test.describe('Community Member List - Profile click-through', () => {
  test.describe.configure({ mode: 'serial' });

  // CM-23: click row -> /member-profile/{id}; the three tabs are visible.
  test('CM-23 Click row opens profile with expected tabs', async ({
    communityMemberListPage,
    page,
  }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();

    const first = (await communityMemberListPage.rowCells())[0];
    expect(first?.name?.length).toBeGreaterThan(0);

    await communityMemberListPage.openProfileByName(first.name);

    for (const tab of ['Profile Information', 'Organization Member', 'Community Member']) {
      await expect(page.getByText(tab, { exact: true }).first()).toBeVisible({ timeout: 10000 });
    }
  });

  // CM-24: Profile Information tab -> Full Name, Email, Contact match the list row.
  test('CM-24 Profile Information matches list row', async ({
    communityMemberListPage,
    memberProfilePage,
  }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();

    const first = (await communityMemberListPage.rowCells())[0];
    await communityMemberListPage.openProfileByName(first.name);

    await memberProfilePage.openTab('Profile Information');
    await memberProfilePage.verifyField('Full Name', first.name);
    await memberProfilePage.verifyField('E-Mail', first.email);
    await memberProfilePage.verifyField('Contact Number', first.contact);
  });

  // CM-25: Community Member tab -> at least one card matches the list Type.
  test('CM-25 Community Member tab shows card matching list Type', async ({
    communityMemberListPage,
    memberProfilePage,
    page,
  }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();

    const first = (await communityMemberListPage.rowCells())[0];
    await communityMemberListPage.openProfileByName(first.name);
    await memberProfilePage.openTab('Community Member');

    const expected = CARD_HEADING_FOR_TYPE[first.type];
    expect(expected, `no card mapping for type "${first.type}"`).toBeTruthy();
    await expect(page.getByText(expected).first()).toBeVisible({ timeout: 10000 });
  });

  // CM-26: members with multiple roles show multiple cards on Community Member tab.
  // Seed: the first row (Md Tausif Hossain) historically has both Ownership and
  // Resident roles. If that ever changes, this test scans visible rows and picks
  // the first member who is an Owner AND also appears as Resident elsewhere.
  test('CM-26 Multi-role member shows multiple cards', async ({
    communityMemberListPage,
    memberProfilePage,
    page,
  }) => {
    test.setTimeout(90000);
    await communityMemberListPage.navigateTo();

    const rows = await communityMemberListPage.rowCells();
    // Group rows by email -> a member with >1 role appears twice with different Types.
    const byEmail = new Map();
    for (const r of rows) {
      const existing = byEmail.get(r.email) || new Set();
      existing.add(r.type);
      byEmail.set(r.email, existing);
    }
    const multi = rows.find((r) => (byEmail.get(r.email) || new Set()).size > 1);
    test.skip(!multi, 'no multi-role member visible on first page');

    await communityMemberListPage.openProfileByName(multi.name);
    await memberProfilePage.openTab('Community Member');

    // At least two of the known role cards are visible.
    const cardHeadings = ['Ownership Details', 'Resident Details', 'Unit Staff'];
    const visible = await Promise.all(
      cardHeadings.map((h) =>
        page
          .getByText(h, { exact: false })
          .first()
          .isVisible({ timeout: 5000 })
          .catch(() => false),
      ),
    );
    expect(visible.filter(Boolean).length).toBeGreaterThanOrEqual(2);
  });

  // CM-27: card heading "Unit {N}" matches the list row's Unit cell.
  test('CM-27 Community Member card unit matches list row', async ({
    communityMemberListPage,
    memberProfilePage,
    page,
  }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();

    // Pick an Owner row -> Ownership Details card has the unit heading.
    const owner = await communityMemberListPage.firstRowOfType('Owner');
    expect(owner).not.toBeNull();

    await communityMemberListPage.openProfileByName(owner.name);
    await memberProfilePage.openTab('Community Member');

    // Card heading reads "Unit {unitNumber}".
    await expect(page.getByText(`Unit ${owner.unit}`, { exact: false }).first()).toBeVisible({
      timeout: 10000,
    });
  });

  // CM-28: profile picture renders. The avatar img has alt="User profile photo"
  // when uploaded; placeholder uses a default src.
  test('CM-28 Profile picture (or placeholder) renders', async ({
    communityMemberListPage,
    page,
  }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();

    const first = (await communityMemberListPage.rowCells())[0];
    await communityMemberListPage.openProfileByName(first.name);

    // Either a real uploaded profile photo OR an avatar placeholder is rendered.
    const profileImg = page.locator('img[alt="User profile photo"]').first();
    await expect(profileImg).toBeVisible({ timeout: 10000 });
    const natural = await profileImg.evaluate((img) => img.naturalWidth);
    expect(natural).toBeGreaterThan(0);
  });

  // CM-37: filter+search persistence across navigation. Observed behavior:
  // the search box value IS preserved across browser back, but the Member Type
  // dropdown selection is NOT preserved (resets to All).
  test('CM-37 Back nav preserves search, resets Member Type filter', async ({
    communityMemberListPage,
    page,
  }) => {
    test.setTimeout(90000);
    await communityMemberListPage.navigateTo();
    await communityMemberListPage.filterByMemberType('Owner');
    await communityMemberListPage.search('Hossain');

    // Filtered view shows only Owners.
    await expect
      .poll(() => communityMemberListPage.everyRowHasType('Owner'), { timeout: 15000 })
      .toBe(true);

    const first = (await communityMemberListPage.rowCells())[0];
    await communityMemberListPage.openProfileByName(first.name);

    await page.goBack();
    await expect(page).toHaveURL(/community-member-list/, { timeout: 10000 });

    // Search value persists.
    await expect(communityMemberListPage.searchInput).toHaveValue('Hossain', { timeout: 10000 });

    // Member Type filter is reset: rows now include at least one non-Owner type
    // (Hossain matches Owner + Resident (Tenant) members).
    await expect
      .poll(async () => {
        const rows = await communityMemberListPage.rowCells();
        const types = new Set(rows.map((r) => r.type));
        return rows.length > 0 && [...types].some((t) => t !== 'Owner');
      }, { timeout: 15000 })
      .toBe(true);
  });

  // CM-29: browser back returns to the community-member list with rows visible.
  // The list does not persist search/filter to URL, so "previous filters" is a
  // session-state thing only — we verify navigation + rendered rows.
  test('CM-29 Browser back returns to community-member list', async ({
    communityMemberListPage,
    page,
  }) => {
    test.setTimeout(60000);
    await communityMemberListPage.navigateTo();

    const first = (await communityMemberListPage.rowCells())[0];
    await communityMemberListPage.openProfileByName(first.name);

    await page.goBack();
    await expect(page).toHaveURL(/community-member-list/, { timeout: 10000 });
    await communityMemberListPage.waitForRows(15000);
  });
});
