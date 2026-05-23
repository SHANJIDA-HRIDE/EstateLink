import { test } from '../../fixtures/customTest';

test.describe('Role Management', () => {
  test.describe.configure({ mode: 'serial' });

  test('Add new role with valid name', async ({
    roleListPage,
    addRolePage,
  }) => {
    test.setTimeout(90000);

    const uniqueId = Date.now();
    const roleName = `Role Automation ${uniqueId}`;
    const roleDescription = `Automated test role created at ${new Date().toISOString()}`;

    await roleListPage.navigateTo();
    await roleListPage.verifyRoleListLoaded();

    await roleListPage.clickAddRole();

    // addNewRole asserts the success message before returning.
    await addRolePage.addNewRole(roleName, roleDescription);
  });
});
