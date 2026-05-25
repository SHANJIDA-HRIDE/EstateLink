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

  test('Edit a member\'s login credential email, member type and role', async ({
    memberListPage,
    addMemberPage,
    editOrgMemberPage,
    memberProfilePage,
    page,
  }) => {
    test.setTimeout(150000);

    // Create a member (type Management + first role, via the standard flow).
    const member = Helpers.generateMemberData();
    await memberListPage.navigateTo();
    await memberListPage.clickAddMember();
    await addMemberPage.fillGeneralInfo(member.name, member.email, member.contact);
    await addMemberPage.clickNext();
    await addMemberPage.selectRoleAndType();
    await addMemberPage.clickNext();
    await addMemberPage.clickSubmit();
    await addMemberPage.handleSuccessDialog();

    await memberListPage.openMemberProfile(member.name); // list-nav so the edit link keeps router state
    const id = page.url().match(/member-profile\/(\d+)/)[1];

    // Edit Member Type + Role FIRST, from the list-navigated profile. (Editing the
    // login email first, or reaching the profile by direct URL, leaves the Type/Role
    // edit page blank — app quirk.) Created member's type is Management.
    const roleName = `Edit Role ${Helpers.uniqueId()}`;
    await memberProfilePage.openTab('Organization Member');
    await editOrgMemberPage.openTypeRoleEdit();
    // Create a brand-new role (all permissions) and select it (appears at list end
    // after the ~12s refetch). Setting the type after this avoids the refetch reset.
    await editOrgMemberPage.createNewRole(roleName, `Automation edit role for ${member.name}`);
    await editOrgMemberPage.selectRoleByName(roleName);
    await editOrgMemberPage.setMemberType('Property Staff'); // toggle to the unselected radio
    await editOrgMemberPage.saveTypeRole();

    // Then edit the Login Credential email.
    const newEmail = `edited.login.${Helpers.uniqueId()}@example.com`;
    await editOrgMemberPage.navigateLoginCredential(id);
    await editOrgMemberPage.editEmail(newEmail);

    // Verify the changes on the Organization Member tab.
    await memberProfilePage.navigateTo(id);
    await memberProfilePage.openTab('Organization Member');
    await memberProfilePage.verifyField('E-mail/Phone number', newEmail);
    await memberProfilePage.verifyField('Type', 'Property Staff');
    await memberProfilePage.verifyFieldContains('Role', roleName);
  });
});
