import { test } from '../../fixtures/customTest';

test.describe('Group Management', () => {
  test.describe.configure({ mode: 'serial' });

  test('Add new group with valid name', async ({
    groupListPage,
    addGroupPage,
  }) => {
    test.setTimeout(90000);

    const uniqueId = Date.now();
    const groupName = `Group Automation ${uniqueId}`;
    const groupDescription = `Automated test group created at ${new Date().toISOString()}`;

    await groupListPage.navigateTo();
    await groupListPage.verifyGroupListLoaded();

    await groupListPage.clickAddGroup();

    await addGroupPage.addNewGroup(groupName, groupDescription);

    console.log(`Successfully added group: ${groupName}`);
  });
});
