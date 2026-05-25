import path from 'path';
import { test, expect } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

const filePath = (f) => path.resolve(process.cwd(), 'test-data', 'files', f);

test.describe('Organization Member Management', () => {
  // Tests share one live account; run serially to avoid concurrent-session flakiness.
  test.describe.configure({ mode: 'serial' });

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

    // Verify the "New Organization Member Added" notification triggered
    await addMemberPage.verifyNewMemberNotification(member.name);

    // Verify the new member is persisted and listed
    await memberListPage.navigateTo();
    await memberListPage.searchMember(member.name);
    await memberListPage.verifyMemberVisible(member.name);
  });

  // AM-03: every optional General-Information field + uploads persist to the profile.
  test('Add Org member with all optional fields and verify they persist on the profile', async ({
    memberListPage,
    addMemberPage,
    memberProfilePage,
  }) => {
    test.setTimeout(120000);
    const member = Helpers.generateFullMemberData();
    member.photo = filePath('ProfilePicture.png');
    member.nidFront = filePath('NID_(Front).png');
    member.nidBack = filePath('NID_(Back).png');

    // Create with required + all optional fields.
    await memberListPage.navigateTo();
    await memberListPage.clickAddMember();
    await addMemberPage.fillGeneralInfo(member.name, member.email, member.contact);
    await addMemberPage.fillOptionalInfo(member);
    await addMemberPage.clickNext();
    await addMemberPage.selectRoleAndType();
    await addMemberPage.clickNext();
    await addMemberPage.clickSubmit();
    await addMemberPage.handleSuccessDialog();

    // Open the profile and assert every optional value persisted.
    await memberListPage.navigateTo();
    await memberListPage.openMemberProfile(member.name);

    await memberProfilePage.verifyField('Full Name', member.name);
    await memberProfilePage.verifyField('E-Mail', member.email);
    await memberProfilePage.verifyField('Contact Number', member.contact);
    await memberProfilePage.verifyField('Permanent Address', member.permanentAddress);
    await memberProfilePage.verifyField('Present Address', member.presentAddress);
    await memberProfilePage.verifyField('Occupation', member.occupation);
    await memberProfilePage.verifyField('NID Number', member.nidNumber);
    await memberProfilePage.verifyField('Gender', member.gender);
    await memberProfilePage.verifyField('Marital Status', member.maritalStatus);
    await memberProfilePage.verifyField('Religion', member.religion);
    await memberProfilePage.verifyFieldContains('Date Of Birth', String(member.dob.getFullYear()));

    // Uploaded NID images resolve to member media (not the default placeholder).
    await memberProfilePage.verifyNidImagesUploaded();
  });

  // AM-06: full "Add Community Member" flow — select a community member, set member
  // type Property Staff, create a brand-new role (all permissions) and assign it,
  // save, then verify the data persists across the profile's 3 tabs.
  test('Add Community Member as Property Staff with a new role and verify the 3 profile tabs', async ({
    memberListPage,
    addMemberPage,
    memberProfilePage,
  }) => {
    test.setTimeout(180000);
    const roleName = `AM06 Role ${Helpers.uniqueId()}`;

    await memberListPage.navigateTo();
    await memberListPage.clickAddMember();

    // Step 1 — pick a community member (their General Info pre-fills, fields locked).
    await addMemberPage.openCommunityMemberPanel();
    const community = await addMemberPage.firstCommunityMember();
    expect(community, 'expected at least one community member to select').toBeTruthy();
    await addMemberPage.selectFirstCommunityMember();
    await addMemberPage.verifyGeneralInfoPrefilled({
      name: community.name,
      email: community.email,
      contact: community.contact,
    });
    await addMemberPage.clickNext();

    // Step 2 — Organization Member Information.
    await addMemberPage.waitForRoleListLoaded();
    await addMemberPage.selectMemberType('Property Staff');
    await addMemberPage.createNewRole(roleName, `Automation role for ${community.name}`);
    await addMemberPage.selectRoleByName(roleName); // appears at list bottom after refetch
    await addMemberPage.submitAndConfirm();

    // Open the new org member's profile (search by their unique community name).
    await memberListPage.openMemberProfile(community.name);

    // All 3 tabs must be present.
    await memberProfilePage.verifyTabsPresent([
      'Profile Information',
      'Organization Member',
      'Community Member',
    ]);

    // Profile Information tab — identity carried over from the community member.
    await memberProfilePage.openTab('Profile Information');
    await memberProfilePage.verifyField('Full Name', community.name);
    await memberProfilePage.verifyField('E-Mail', community.email);
    await memberProfilePage.verifyField('Contact Number', community.contact);

    // Organization Member tab — member type + the newly created role persisted.
    await memberProfilePage.openTab('Organization Member');
    await memberProfilePage.verifyField('Type', 'Property Staff');
    await memberProfilePage.verifyField('Role', roleName);

    // Community Member tab — login credential email carried over.
    await memberProfilePage.openTab('Community Member');
    await memberProfilePage.verifyField('E-mail/Phone number', community.email);
  });

  // AM-07: empty required fields (Name/Email/Contact) block advancing past step 1.
  // (Next is either disabled or no-ops on click while required fields are empty.)
  test('AM-07 empty required fields block advancing to step 2', async ({ memberListPage, addMemberPage, page }) => {
    await memberListPage.navigateTo();
    await memberListPage.clickAddMember();
    await expect(addMemberPage.fullNameInput).toBeVisible(); // form mounted

    const memberTypeRadio = page.locator('input[name="member_type"]').first(); // step 2 only

    // Empty → cannot advance (force-click covers the disabled-button case too).
    await addMemberPage.nextButton.click({ force: true }).catch(() => {});
    await page.waitForTimeout(800);
    await expect(memberTypeRadio).toHaveCount(0);
    await expect(addMemberPage.fullNameInput).toBeVisible();

    // All required filled → Next enabled and advances to step 2.
    await addMemberPage.fillGeneralInfo('QA Required', `qa.req.${Helpers.uniqueId()}@example.com`, '01711111111');
    await expect(addMemberPage.nextButton).toBeEnabled();
    await addMemberPage.clickNext();
    await expect(memberTypeRadio).toBeVisible({ timeout: 10000 });
  });

  // AM-08: invalid email format is rejected on Next.
  test('AM-08 invalid email format shows error', async ({ memberListPage, addMemberPage }) => {
    await memberListPage.navigateTo();
    await memberListPage.clickAddMember();

    await addMemberPage.fillGeneralInfo('QA Email', 'bad-email', '01711111111');
    await addMemberPage.clickNext();

    await expect(addMemberPage.invalidEmailError).toBeVisible({ timeout: 10000 });
    // Stays on step 1 (Next still present, not advanced).
    await expect(addMemberPage.nextButton).toBeVisible();
  });

  // AM-10: an email already in use is rejected by the server on submit.
  test('AM-10 duplicate email is rejected on submit', async ({ memberListPage, addMemberPage }) => {
    test.setTimeout(120000);

    // Grab an existing member's email from the list.
    await memberListPage.navigateTo();
    await memberListPage.waitForRows();
    const [existing] = await memberListPage.rowCells();
    expect(existing, 'expected an existing member to read an email from').toBeTruthy();

    await memberListPage.clickAddMember();
    await addMemberPage.fillGeneralInfo('QA Duplicate Test', existing.email, '01799999999');
    await addMemberPage.clickNext();
    await addMemberPage.selectRoleAndType();
    await addMemberPage.clickNext();
    await addMemberPage.clickSubmit();

    await expect(addMemberPage.duplicateEmailError).toBeVisible({ timeout: 20000 });
  });

  // AM-14: wrong file type and oversize (>5MB) uploads are rejected for the profile photo.
  test('AM-14 invalid/oversize photo upload is rejected', async ({ memberListPage, addMemberPage }) => {
    await memberListPage.navigateTo();
    await memberListPage.clickAddMember();

    // Wrong type (PDF).
    await addMemberPage.photoInput.setInputFiles(filePath('Announcement3.pdf'));
    await expect(addMemberPage.fileRejectError).toBeVisible({ timeout: 10000 });

    // Oversize (>5MB JPG).
    await addMemberPage.photoInput.setInputFiles(filePath('morethan5MB.jpg'));
    await expect(addMemberPage.fileRejectError).toBeVisible({ timeout: 10000 });
  });
});
