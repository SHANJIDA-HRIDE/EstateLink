import { test, expect } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

test.describe('Organization Member - Edit General Information', () => {
  // Shares one live account; run serially to avoid concurrent-session flakiness.
  test.describe.configure({ mode: 'serial' });

  test('Edit a member\'s General Information and verify changes on the profile', async ({
    memberListPage,
    addMemberPage,
    editMemberGeneralPage,
    memberProfilePage,
    page,
  }) => {
    test.setTimeout(150000);

    // Create a minimal member (optional General Info left empty, to be filled on edit).
    const member = Helpers.generateMemberData();
    await memberListPage.navigateTo();
    await memberListPage.clickAddMember();
    await addMemberPage.fillGeneralInfo(member.name, member.email, member.contact);
    await addMemberPage.clickNext();
    await addMemberPage.selectRoleAndType();
    await addMemberPage.clickNext();
    await addMemberPage.clickSubmit();
    await addMemberPage.handleSuccessDialog();

    // Open the new member's profile and capture its id.
    await memberListPage.openMemberProfile(member.name);
    const id = page.url().match(/member-profile\/(\d+)/)[1];

    // Edit: overwrite required + fill every optional General Information field.
    const edited = Helpers.generateFullMemberData();
    await editMemberGeneralPage.navigateTo(id);
    await editMemberGeneralPage.fillAll(edited);
    await editMemberGeneralPage.update();

    // Verify the changes on the Profile Information view.
    await memberProfilePage.navigateTo(id);
    await memberProfilePage.openTab('Profile Information');
    await memberProfilePage.verifyField('Full Name', edited.name);
    await memberProfilePage.verifyField('E-Mail', edited.email);
    await memberProfilePage.verifyField('Contact Number', edited.contact);
    await memberProfilePage.verifyField('Permanent Address', edited.permanentAddress);
    await memberProfilePage.verifyField('Present Address', edited.presentAddress);
    await memberProfilePage.verifyField('Occupation', edited.occupation);
    await memberProfilePage.verifyField('NID Number', edited.nidNumber);
    await memberProfilePage.verifyField('Gender', edited.gender);
    await memberProfilePage.verifyField('Marital Status', edited.maritalStatus);
    await memberProfilePage.verifyField('Religion', edited.religion);
    await memberProfilePage.verifyFieldContains('Date Of Birth', String(edited.dob.getFullYear()));
  });
});
