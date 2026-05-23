import { test } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

test.describe('Organization Member Management', () => {
  test('Add new Org member and verify it appears in the list', async ({
    memberListPage,
    addMemberPage,
  }) => {
    const member = Helpers.generateMemberData();

    // Create
    await memberListPage.navigateTo();
    await memberListPage.clickAddMember();

    await addMemberPage.fillGeneralInfo(member.name, member.email, member.contact);
    await addMemberPage.clickNext();

    await addMemberPage.selectRoleAndType();
    await addMemberPage.clickNext();

    await addMemberPage.clickSubmit();
    await addMemberPage.handleSuccessDialog();

    // Verify the new member is persisted and listed
    await memberListPage.navigateTo();
    await memberListPage.searchMember(member.name);
    await memberListPage.verifyMemberVisible(member.name);
  });
});
