import { test, expect } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

test.describe('Role Management', () => {
  // Shares one live account; run serially to avoid concurrent-session flakiness.
  test.describe.configure({ mode: 'serial' });

  // RA-01: create a role with name + description + some permissions, verify in the list.
  test('RA-01 create role with selected permissions and verify it in the list', async ({
    addRolePage,
    roleListPage,
  }) => {
    test.setTimeout(120000);
    // Role name is truncated to 25 chars on save — keep it short for exact-match search.
    const roleName = `RA01-${Helpers.uniqueId()}`;
    const permissions = ['View Member List', 'Create Member', 'View Role List'];

    await addRolePage.navigateTo();
    await addRolePage.createRole(roleName, 'RA-01 automation role', permissions);

    // Verify it's listed: name, Active status, and the granted permissions.
    await roleListPage.navigateTo();
    await roleListPage.search(roleName);
    await roleListPage.waitForResults();
    await expect
      .poll(async () => {
        const [row] = await roleListPage.rowCells();
        if (!row) return false;
        return (
          row[0] === roleName &&
          row[3] === 'Active' &&
          permissions.every((p) => row[2].includes(p))
        );
      }, { timeout: 15000 })
      .toBe(true);
  });

  // RA-02: create a role with ALL permissions (via each category's Select All).
  test('RA-02 create role with all permissions and verify it in the list', async ({
    addRolePage,
    roleListPage,
  }) => {
    test.setTimeout(120000);
    const roleName = `RA02-${Helpers.uniqueId()}`;

    await addRolePage.navigateTo();
    await addRolePage.createRoleWithAllPermissions(roleName, 'RA-02 all permissions role');

    await roleListPage.navigateTo();
    await roleListPage.search(roleName);
    await roleListPage.waitForResults();
    await expect
      .poll(async () => {
        const [row] = await roleListPage.rowCells();
        if (!row) return false;
        return row[0] === roleName && row[3] === 'Active' && row[2].length > 0;
      }, { timeout: 15000 })
      .toBe(true);
  });

  // RA-03: a category's "Select All" toggles only that category's permissions.
  test('RA-03 category Select All scopes to its own group', async ({ addRolePage }) => {
    test.setTimeout(120000);
    await addRolePage.navigateTo();

    // Nothing selected initially.
    await expect.poll(() => addRolePage.checkedPermissionCount(), { timeout: 10000 }).toBe(0);

    // Select All on category 0 -> only its perms checked.
    await addRolePage.toggleCategorySelectAll(0);
    let c1 = 0;
    await expect.poll(async () => (c1 = await addRolePage.checkedPermissionCount()), { timeout: 10000 }).toBeGreaterThan(0);

    // Select All on category 1 -> adds its perms (total grows).
    await addRolePage.toggleCategorySelectAll(1);
    let c2 = 0;
    await expect.poll(async () => (c2 = await addRolePage.checkedPermissionCount()), { timeout: 10000 }).toBeGreaterThan(c1);

    // Unchecking category 0 removes exactly its perms, leaving category 1 intact.
    await addRolePage.toggleCategorySelectAll(0);
    await expect.poll(() => addRolePage.checkedPermissionCount(), { timeout: 10000 }).toBe(c2 - c1);
  });

  // RA-04: a role cannot be created without a name.
  test('RA-04 empty role name is rejected', async ({ addRolePage, page }) => {
    test.setTimeout(120000);
    await addRolePage.navigateTo();

    // Create is disabled on the empty form.
    await expect(addRolePage.createBtn).toBeDisabled();

    // Selecting a permission enables Create, but submitting with no name is blocked.
    await addRolePage.selectPermissions(['View Member List']);
    await addRolePage.createBtn.click();
    await expect(addRolePage.requiredNameError).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/addRole$/); // not created, still on the form
  });

  // RA-05: a role name that already exists is rejected by the server.
  test('RA-05 duplicate role name is rejected', async ({ addRolePage, page }) => {
    test.setTimeout(120000);
    await addRolePage.navigateTo();

    // "Superadmin" is a predefined role that always exists.
    await addRolePage.roleNameInput.fill('Superadmin');
    await addRolePage.roleDescriptionInput.fill('RA-05 duplicate attempt');
    await addRolePage.selectPermissions(['View Member List']);
    await addRolePage.createBtn.click();

    await expect(addRolePage.duplicateNameError).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/addRole$/); // not created
  });

  // RE-01: edit a role's name + description, verify the changes on its profile.
  test('RE-01 edit role name and description persists on the profile', async ({
    addRolePage,
    roleListPage,
    roleProfilePage,
    page,
  }) => {
    test.setTimeout(150000);
    const roleName = `RE01-${Helpers.uniqueId()}`;

    // Create, then open its profile to capture the id.
    await addRolePage.navigateTo();
    await addRolePage.createRole(roleName, 'original description', ['View Member List']);
    await roleListPage.navigateTo();
    await roleListPage.openRoleProfile(roleName);
    const id = page.url().match(/roleProfile\/(\d+)/)[1];

    // Edit name + description (reach the edit form via the profile's Edit link).
    const newName = `RE01b-${Helpers.uniqueId()}`;
    const newDesc = 'updated description';
    await roleProfilePage.clickEdit();
    await addRolePage.updateNameDescription(newName, newDesc);

    // Verify on the profile.
    await roleProfilePage.navigateTo(id);
    await roleProfilePage.verifyField('Role Name', newName);
    await roleProfilePage.verifyField('Role Description', newDesc);
  });

  // RE-02: adding a permission to a role is reflected on its profile.
  test('RE-02 add a permission and verify it on the profile', async ({
    addRolePage,
    roleListPage,
    roleProfilePage,
    page,
  }) => {
    test.setTimeout(150000);
    const roleName = `RE02-${Helpers.uniqueId()}`;

    await addRolePage.navigateTo();
    await addRolePage.createRole(roleName, 'RE-02 role', ['View Member List']);
    await roleListPage.navigateTo();
    await roleListPage.openRoleProfile(roleName);
    const id = page.url().match(/roleProfile\/(\d+)/)[1];

    // Precondition: "Create Member" not yet granted (profile lists only granted perms).
    await expect.poll(() => roleProfilePage.hasPermission('Create Member'), { timeout: 10000 }).toBe(false);

    // Add it via the edit form.
    await roleProfilePage.clickEdit();
    await addRolePage.togglePermissionsAndUpdate(['Create Member']);

    // Verify both permissions now granted on the profile.
    await roleProfilePage.navigateTo(id);
    await expect.poll(() => roleProfilePage.hasPermission('Create Member'), { timeout: 15000 }).toBe(true);
    await expect.poll(() => roleProfilePage.hasPermission('View Member List'), { timeout: 15000 }).toBe(true);
  });

  // RE-03: removing a permission from a role is reflected on its profile.
  test('RE-03 remove a permission and verify it on the profile', async ({
    addRolePage,
    roleListPage,
    roleProfilePage,
    page,
  }) => {
    test.setTimeout(150000);
    const roleName = `RE03-${Helpers.uniqueId()}`;

    await addRolePage.navigateTo();
    await addRolePage.createRole(roleName, 'RE-03 role', ['View Member List', 'Create Member']);
    await roleListPage.navigateTo();
    await roleListPage.openRoleProfile(roleName);
    const id = page.url().match(/roleProfile\/(\d+)/)[1];

    // Precondition: both permissions granted.
    await expect.poll(() => roleProfilePage.hasPermission('Create Member'), { timeout: 10000 }).toBe(true);

    // Remove "Create Member" via the edit form (toggling its checked box off).
    await roleProfilePage.clickEdit();
    await addRolePage.togglePermissionsAndUpdate(['Create Member']);

    // Verify it's gone but the other permission remains.
    await roleProfilePage.navigateTo(id);
    await expect.poll(() => roleProfilePage.hasPermission('Create Member'), { timeout: 15000 }).toBe(false);
    await expect.poll(() => roleProfilePage.hasPermission('View Member List'), { timeout: 15000 }).toBe(true);
  });

  // RE-05: toggle role status Active<->Inactive from the edit page, verify in the list.
  test('RE-05 toggle role status from edit page and verify in the list', async ({
    addRolePage,
    roleListPage,
    roleProfilePage,
  }) => {
    test.setTimeout(180000);
    const roleName = `RE05-${Helpers.uniqueId()}`;

    await addRolePage.navigateTo();
    await addRolePage.createRole(roleName, 'RE-05 role', ['View Member List']);

    // New role is Active.
    await roleListPage.navigateTo();
    await expect.poll(() => roleListPage.statusOf(roleName), { timeout: 15000 }).toBe('Active');

    // Edit -> toggle to Inactive -> verify in list.
    await roleListPage.openRoleProfile(roleName);
    await roleProfilePage.clickEdit();
    await addRolePage.toggleStatus();
    await roleListPage.navigateTo();
    await expect.poll(() => roleListPage.statusOf(roleName), { timeout: 15000 }).toBe('Inactive');

    // Edit -> toggle back to Active -> verify in list.
    await roleListPage.openRoleProfile(roleName);
    await roleProfilePage.clickEdit();
    await addRolePage.toggleStatus();
    await roleListPage.navigateTo();
    await expect.poll(() => roleListPage.statusOf(roleName), { timeout: 15000 }).toBe('Active');
  });

  // RE-06: renaming a role to an existing role name is rejected.
  test('RE-06 rename to an existing role name is rejected', async ({
    addRolePage,
    roleListPage,
    roleProfilePage,
    page,
  }) => {
    test.setTimeout(150000);
    const roleName = `RE06-${Helpers.uniqueId()}`;

    await addRolePage.navigateTo();
    await addRolePage.createRole(roleName, 'RE-06 role', ['View Member List']);
    await roleListPage.navigateTo();
    await roleListPage.openRoleProfile(roleName);

    // Edit -> rename to the predefined "Superadmin" -> rejected.
    await roleProfilePage.clickEdit();
    await addRolePage.attemptRename('Superadmin');
    await expect(addRolePage.duplicateNameError.first()).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/addRole\/\d+/); // stayed on the edit form
  });

  // RX-01: create a role, assign it to a new member, verify under Role Assigned Member.
  test('RX-01 assigned role member appears under Role Assigned Member', async ({
    addRolePage,
    roleListPage,
    roleProfilePage,
    memberListPage,
    addMemberPage,
    page,
  }) => {
    test.setTimeout(200000);
    const roleName = `RX01-${Helpers.uniqueId()}`;
    const member = Helpers.generateMemberData();

    // Create the role.
    await addRolePage.navigateTo();
    await addRolePage.createRole(roleName, 'RX-01 role', ['View Member List']);

    // Create a member and assign that specific role.
    await memberListPage.navigateTo();
    await memberListPage.clickAddMember();
    await addMemberPage.fillGeneralInfo(member.name, member.email, member.contact);
    await addMemberPage.clickNext();
    await addMemberPage.waitForRoleListLoaded();
    await addMemberPage.selectMemberType('Management');
    await addMemberPage.selectRoleByName(roleName);
    await addMemberPage.clickNext();
    await addMemberPage.clickSubmit();
    await addMemberPage.handleSuccessDialog();

    // The member is listed under the role's "Role Assigned Member" tab.
    await roleListPage.navigateTo();
    await roleListPage.openRoleProfile(roleName);
    await roleProfilePage.openTab('Role Assigned Member');
    await expect(page.getByText(member.name, { exact: false }).first()).toBeVisible({ timeout: 15000 });
  });
});
