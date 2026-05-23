import { test } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

test.describe('Group Management', () => {
  test.describe.configure({ mode: 'serial' });

  test('Add new group with valid name', async ({ groupListPage, addGroupPage }) => {
    test.setTimeout(90000);

    const id = Helpers.uniqueId();
    const groupName = `Group Automation ${id}`;
    const groupDescription = `Automated test group ${id}`;

    await groupListPage.navigateTo();
    await groupListPage.clickAddGroup();

    // addNewGroup asserts the success dialog before returning.
    await addGroupPage.addNewGroup(groupName, groupDescription);
  });
});
