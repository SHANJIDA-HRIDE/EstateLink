import { test, expect } from '../../fixtures/customTest';

// A predefined role that always exists and is Active.
const ACTIVE_ROLE = 'Superadmin';

test.describe('Role List - Filters & Search', () => {
  // Read-only checks against a shared live account — serial avoids flakiness.
  test.describe.configure({ mode: 'serial' });

  test('search finds a role by name', async ({ roleListPage }) => {
    test.setTimeout(120000);
    await roleListPage.navigateTo();
    await roleListPage.search(ACTIVE_ROLE);
    await roleListPage.waitForResults();
    await expect.poll(() => roleListPage.rowsMatchingName(ACTIVE_ROLE), { timeout: 15000 }).toBeGreaterThan(0);
  });

  test('search for a non-existent role returns no rows', async ({ roleListPage }) => {
    test.setTimeout(120000);
    await roleListPage.navigateTo();
    await roleListPage.search('Zxqv Nonexistent Role 99999');
    await expect.poll(() => roleListPage.rowCount(), { timeout: 20000 }).toBe(0);
  });

  test('status filter narrows results (Active vs Inactive)', async ({ roleListPage }) => {
    test.setTimeout(120000);
    await roleListPage.navigateTo();
    await roleListPage.search(ACTIVE_ROLE); // loads the Active "Superadmin" role
    await roleListPage.waitForResults();

    // Status = Active keeps the (Active) role.
    await roleListPage.applyStatus('Active');
    await expect.poll(() => roleListPage.everyRowHasStatus('Active'), { timeout: 15000 }).toBe(true);

    // Status = Inactive excludes it -> no rows.
    await roleListPage.applyStatus('Inactive');
    await expect.poll(() => roleListPage.rowCount(), { timeout: 15000 }).toBe(0);
  });

  test('combined search + status filter', async ({ roleListPage }) => {
    test.setTimeout(120000);
    await roleListPage.navigateTo();
    await roleListPage.search(ACTIVE_ROLE);
    await roleListPage.waitForResults();
    await roleListPage.applyStatus('Active');

    await expect
      .poll(async () => {
        const rows = await roleListPage.rowCells();
        return rows.length > 0 && rows.every((r) => r[0].toLowerCase().includes(ACTIVE_ROLE.toLowerCase()) && r[3] === 'Active');
      }, { timeout: 15000 })
      .toBe(true);
  });
});
