import { test, expect } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

test.describe('Unit Staff Management', () => {
  test.describe.configure({ mode: 'serial' });

  test('Find available unit and add staff info', async ({
    viewTowersPage,
    unitStaffPage,
    addStaffPage,
  }) => {
    test.setTimeout(90000);

    const id = Helpers.uniqueId();
    const staffData = {
      name: `Staff Automation ${id}`,
      email: `staff.automation.${id}@gmail.com`,
      contact: Helpers.uniqueContact(), // valid 11-digit number
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.clickAddStaff();

    await addStaffPage.addNewStaff(staffData);

    await unitStaffPage.verifyStaffAdded(unit.unitDetailsUrl, staffData);
  });

  // ST-02: add staff as Part-time -> profile Community Member tab shows Status "Part-time".
  test('Add staff as Part-time and verify status on profile', async ({
    viewTowersPage,
    unitStaffPage,
    addStaffPage,
    memberProfilePage,
    page,
  }) => {
    test.setTimeout(180000);

    const id = Helpers.uniqueId();
    const staffData = {
      name: `PT Staff ${id}`,
      email: `pt.staff.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.clickAddStaff();
    await addStaffPage.addNewStaffAsPartTime(staffData);

    await unitStaffPage.verifyStaffNameAdded(unit.unitDetailsUrl, staffData.name);

    // Click staff -> profile Community Member tab.
    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await page.getByText(staffData.name).first().click();
    await page.waitForURL(/member-profile\/\d+/, { timeout: 15000 });
    await memberProfilePage.openTab('Community Member');

    // Unit Staff card: Type "Unit Staff" + Status "Part-time".
    await memberProfilePage.verifyField('Type', 'Unit Staff');
    await memberProfilePage.verifyField('Status', 'Part-time');
  });

  // ST-03: add two staff sequentially to the same unit; both listed.
  test('Add two staff to the same unit', async ({
    viewTowersPage,
    unitStaffPage,
    addStaffPage,
  }) => {
    test.setTimeout(180000);

    const mk = (tag) => {
      const id = Helpers.uniqueId();
      return {
        name: `${tag} Automation ${id}`,
        email: `${tag.toLowerCase()}.automation.${id}@gmail.com`,
        contact: Helpers.uniqueContact(),
      };
    };
    const s1 = mk('Staff');
    const s2 = mk('Staff');

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    // First staff (Live-in default).
    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.clickAddStaff();
    await addStaffPage.addNewStaff(s1);
    await unitStaffPage.verifyStaffNameAdded(unit.unitDetailsUrl, s1.name);

    // Second staff.
    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.clickAddStaff();
    await addStaffPage.addNewStaff(s2);
    await unitStaffPage.verifyStaffNameAdded(unit.unitDetailsUrl, s2.name);
  });

  // ST-04: add an existing member as staff via the "Add Existing Member" modal.
  test('Add existing member as staff via the modal', async ({
    viewTowersPage,
    unitStaffPage,
    addStaffPage,
  }) => {
    test.setTimeout(180000);

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.clickAddStaff();

    const selectedName = await addStaffPage.addExistingMember('Rahim Ahmed');

    await unitStaffPage.verifyStaffNameAdded(unit.unitDetailsUrl, selectedName);
  });

  // ST-05: Add Existing Member modal search narrows results.
  test('Add Existing Member modal search narrows results (staff)', async ({
    viewTowersPage,
    unitStaffPage,
    addStaffPage,
  }) => {
    test.setTimeout(150000);

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.clickAddStaff();
    await addStaffPage.openExistingMemberModal();

    // Search "Rahim" -> all row names contain "Rahim".
    await addStaffPage.searchExistingMember('Rahim');
    let names = [];
    await expect
      .poll(async () => {
        names = await addStaffPage.modalRowNames();
        return names.length > 0 && names.every((n) => /rahim/i.test(n));
      }, { timeout: 15000 })
      .toBe(true);

    // Switch to "Nusrat" -> rows update; none contain "Rahim".
    await addStaffPage.searchExistingMember('Nusrat');
    await expect
      .poll(async () => {
        names = await addStaffPage.modalRowNames();
        return names.length > 0 && names.every((n) => /nusrat/i.test(n)) && names.every((n) => !/rahim/i.test(n));
      }, { timeout: 15000 })
      .toBe(true);
  });

  // ST-14: remove a staff -> gone from the list.
  test('Remove a staff removes them from the list', async ({
    viewTowersPage,
    unitStaffPage,
    addStaffPage,
  }) => {
    test.setTimeout(150000);

    const id = Helpers.uniqueId();
    const s = {
      name: `Staff Rm ${id}`,
      email: `staff.rm.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.clickAddStaff();
    await addStaffPage.addNewStaff(s);
    await unitStaffPage.verifyStaffNameAdded(unit.unitDetailsUrl, s.name);

    // Remove.
    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.removeStaff(s.name);

    // Gone.
    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await expect
      .poll(async () => {
        const rows = await unitStaffPage.staffRows();
        return rows.some((r) => r.name.includes(s.name));
      }, { timeout: 15000 })
      .toBe(false);
  });

  // ST-16: click staff name -> profile; Profile Information matches input.
  test('Click staff opens profile with matching General Information', async ({
    viewTowersPage,
    unitStaffPage,
    addStaffPage,
    memberProfilePage,
    page,
  }) => {
    test.setTimeout(150000);

    const id = Helpers.uniqueId();
    const s = {
      name: `Staff Prof ${id}`,
      email: `staff.prof.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.clickAddStaff();
    await addStaffPage.addNewStaff(s);
    await unitStaffPage.verifyStaffNameAdded(unit.unitDetailsUrl, s.name);

    // Click staff name -> /member-profile/{id}.
    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await page.getByText(s.name).first().click();
    await page.waitForURL(/member-profile\/\d+/, { timeout: 15000 });

    await memberProfilePage.openTab('Profile Information');
    await memberProfilePage.verifyField('Full Name', s.name);
    await memberProfilePage.verifyField('E-Mail', s.email);
    await memberProfilePage.verifyField('Contact Number', s.contact);
  });

  // ST-17: profile Community Member tab -> Unit Staff card shows unit/tower/status.
  test('Staff profile Community Member tab shows unit/tower/status', async ({
    viewTowersPage,
    unitStaffPage,
    addStaffPage,
    memberProfilePage,
    page,
  }) => {
    test.setTimeout(150000);

    const id = Helpers.uniqueId();
    const s = {
      name: `Staff Comm ${id}`,
      email: `staff.comm.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.clickAddStaff();
    await addStaffPage.addNewStaff(s); // default Live-in
    await unitStaffPage.verifyStaffNameAdded(unit.unitDetailsUrl, s.name);

    // Click staff -> profile -> Community Member tab.
    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await page.getByText(s.name).first().click();
    await page.waitForURL(/member-profile\/\d+/, { timeout: 15000 });
    await memberProfilePage.openTab('Community Member');

    // Unit Staff card: Type "Unit Staff", Status "Live-in" (default), unit heading shows "Unit {n}", Tower Name populated.
    await memberProfilePage.verifyField('Type', 'Unit Staff');
    await memberProfilePage.verifyField('Status', 'Live-in');
    await expect(page.getByText(`Unit ${unit.unitNumber}`, { exact: false }).first()).toBeVisible({ timeout: 10000 });
    await expect
      .poll(async () => ((await memberProfilePage.fieldValue('Tower Name')) || '').length, { timeout: 10000 })
      .toBeGreaterThan(0);
  });

  // ST-19: editing a staff's name updates both the unit's list and their profile.
  test('Editing staff name updates list and profile', async ({
    viewTowersPage,
    unitStaffPage,
    addStaffPage,
    editMemberGeneralPage,
    memberProfilePage,
    page,
  }) => {
    test.setTimeout(180000);

    const id = Helpers.uniqueId();
    const s = {
      name: `Staff Edit ${id}`,
      email: `staff.edit.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };
    const newName = `Staff Edited ${Helpers.uniqueId()}`;

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.clickAddStaff();
    await addStaffPage.addNewStaff(s);
    await unitStaffPage.verifyStaffNameAdded(unit.unitDetailsUrl, s.name);

    // Open staff's profile to grab id, then edit general info.
    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await page.getByText(s.name).first().click();
    await page.waitForURL(/member-profile\/\d+/, { timeout: 15000 });
    const memberId = page.url().match(/member-profile\/(\d+)/)[1];

    await editMemberGeneralPage.navigateTo(memberId);
    await editMemberGeneralPage.fillAll({
      name: newName,
      email: s.email,
      contact: s.contact,
    });
    await editMemberGeneralPage.update();

    // Profile reflects new name.
    await memberProfilePage.navigateTo(memberId);
    await memberProfilePage.openTab('Profile Information');
    await memberProfilePage.verifyField('Full Name', newName);

    // Staff list reflects new name.
    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await expect
      .poll(async () => {
        const rows = await unitStaffPage.staffRows();
        return rows.some((row) => row.name.includes(newName));
      }, { timeout: 20000 })
      .toBe(true);
  });

  // ST-18: staff appears in unit's Staff list AND in profile Community Member tab.
  test('Staff appears in unit list and in profile Community Member tab', async ({
    viewTowersPage,
    unitStaffPage,
    addStaffPage,
    memberProfilePage,
    page,
  }) => {
    test.setTimeout(150000);

    const id = Helpers.uniqueId();
    const s = {
      name: `Staff Both ${id}`,
      email: `staff.both.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.clickAddStaff();
    await addStaffPage.addNewStaff(s);

    // (1) On the unit's Staff list.
    await unitStaffPage.verifyStaffAdded(unit.unitDetailsUrl, s);

    // (2) On their profile -> Community Member tab.
    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await page.getByText(s.name).first().click();
    await page.waitForURL(/member-profile\/\d+/, { timeout: 15000 });
    await memberProfilePage.openTab('Community Member');
    await memberProfilePage.verifyField('Type', 'Unit Staff');
    await expect(page.getByText(`Unit ${unit.unitNumber}`, { exact: false }).first()).toBeVisible({ timeout: 10000 });
  });

  // ST-20: lifecycle round-trip on a unit -> add, remove, re-add.
  test('Staff lifecycle: add -> remove -> re-add', async ({
    viewTowersPage,
    unitStaffPage,
    addStaffPage,
  }) => {
    test.setTimeout(200000);

    const mk = (tag) => {
      const id = Helpers.uniqueId();
      return {
        name: `${tag} ${id}`,
        email: `${tag.toLowerCase()}.${id}@gmail.com`,
        contact: Helpers.uniqueContact(),
      };
    };
    const s1 = mk('S1');
    const s2 = mk('S2');

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();
    const unit = await viewTowersPage.openRandomAvailableUnit();

    // Add s1.
    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.clickAddStaff();
    await addStaffPage.addNewStaff(s1);
    await unitStaffPage.verifyStaffNameAdded(unit.unitDetailsUrl, s1.name);

    // Remove s1 -> gone.
    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.removeStaff(s1.name);
    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await expect
      .poll(async () => {
        const rows = await unitStaffPage.staffRows();
        return rows.some((row) => row.name.includes(s1.name));
      }, { timeout: 15000 })
      .toBe(false);

    // Re-add s2.
    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.clickAddStaff();
    await addStaffPage.addNewStaff(s2);
    await unitStaffPage.verifyStaffNameAdded(unit.unitDetailsUrl, s2.name);
  });
});
