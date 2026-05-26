import { test, expect } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

test.describe('Community Member List - Cross-module sync', () => {
  test.describe.configure({ mode: 'serial' });

  // CM-30: a new Owner added via Unit Owners appears in the community list with
  // Type "Owner".
  test('CM-30 New Owner appears in community list with Type Owner', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
    communityMemberListPage,
  }) => {
    test.setTimeout(150000);

    const id = Helpers.uniqueId();
    const member = {
      name: `Owner Sync ${id}`,
      email: `owner.sync.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();
    const unit = await viewTowersPage.openFirstUnoccupiedUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickAddOwner();
    await addOwnerPage.addNewMember(member);
    await addOwnerPage.fillOwnershipDetails({ percentage: '100' });
    await addOwnerPage.saveOwner();

    const row = await communityMemberListPage.waitForMemberByEmail(member.email, { type: 'Owner' });
    expect(row.name).toBe(member.name);
  });

  // CM-31a: a new Resident (non-tenant) appears with Type "Resident".
  test('CM-31a New Resident appears with Type Resident', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
    communityMemberListPage,
  }) => {
    test.setTimeout(150000);

    const id = Helpers.uniqueId();
    const member = {
      name: `Resident Sync ${id}`,
      email: `resident.sync.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();
    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await addResidentPage.setStatusOccupied();
    await unitResidentsPage.clickAddResident();
    await addResidentPage.addNewResident(member);
    await unitResidentsPage.verifyResidentNameAdded(unit.unitDetailsUrl, member.name);

    const row = await communityMemberListPage.waitForMemberByEmail(member.email, { type: 'Resident' });
    expect(row.name).toBe(member.name);
  });

  // CM-31b: a new Tenant Resident appears with Type "Resident (Tenant)".
  test('CM-31b New Tenant Resident appears with Type Resident (Tenant)', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
    communityMemberListPage,
  }) => {
    test.setTimeout(150000);

    const id = Helpers.uniqueId();
    const member = {
      name: `Tenant Sync ${id}`,
      email: `tenant.sync.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();
    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await addResidentPage.setStatusOccupied();
    await unitResidentsPage.clickAddResident();
    await addResidentPage.addNewResidentAsTenant(member);
    await unitResidentsPage.verifyResidentNameAdded(unit.unitDetailsUrl, member.name);

    const row = await communityMemberListPage.waitForMemberByEmail(member.email, {
      type: 'Resident (Tenant)',
    });
    expect(row.name).toBe(member.name);
  });

  // CM-32: a new Unit Staff appears with Type "Staff" (the community-list column
  // reads "Staff", not "Unit Staff" — the same filter option name is used).
  test('CM-32 New Staff appears with Type Staff', async ({
    viewTowersPage,
    unitStaffPage,
    addStaffPage,
    communityMemberListPage,
  }) => {
    test.setTimeout(150000);

    const id = Helpers.uniqueId();
    const member = {
      name: `Staff Sync ${id}`,
      email: `staff.sync.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();
    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.clickAddStaff();
    await addStaffPage.addNewStaff(member);
    await unitStaffPage.verifyStaffNameAdded(unit.unitDetailsUrl, member.name);

    const row = await communityMemberListPage.waitForMemberByEmail(member.email, { type: 'Staff' });
    expect(row.name).toBe(member.name);
  });

  // CM-33: removing the only community role drops the member from the list.
  // (Uses Staff because Unit Staff has the simplest single-role lifecycle.)
  test('CM-33 Removed Staff disappears from community list', async ({
    viewTowersPage,
    unitStaffPage,
    addStaffPage,
    communityMemberListPage,
  }) => {
    test.setTimeout(180000);

    const id = Helpers.uniqueId();
    const member = {
      name: `Staff Drop ${id}`,
      email: `staff.drop.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();
    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.clickAddStaff();
    await addStaffPage.addNewStaff(member);
    await unitStaffPage.verifyStaffNameAdded(unit.unitDetailsUrl, member.name);

    // Present on community list.
    await communityMemberListPage.waitForMemberByEmail(member.email, { type: 'Staff' });

    // Remove from the unit.
    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.removeStaff(member.name);

    // Gone from the community list.
    await communityMemberListPage.waitForMemberAbsentByEmail(member.email);
  });

  // CM-34: editing a member's name (via the General Info edit page) is reflected
  // in the community list.
  test('CM-34 Edited member name reflects in community list', async ({
    viewTowersPage,
    unitStaffPage,
    addStaffPage,
    editMemberGeneralPage,
    communityMemberListPage,
    page,
  }) => {
    test.setTimeout(180000);

    const id = Helpers.uniqueId();
    const member = {
      name: `Staff Rename ${id}`,
      email: `staff.rename.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };
    const newName = `Staff Renamed ${Helpers.uniqueId()}`;

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();
    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.clickAddStaff();
    await addStaffPage.addNewStaff(member);
    await unitStaffPage.verifyStaffNameAdded(unit.unitDetailsUrl, member.name);

    // Grab member id from the staff profile click-through.
    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await page.getByText(member.name).first().click();
    await page.waitForURL(/member-profile\/\d+/, { timeout: 15000 });
    const memberId = page.url().match(/member-profile\/(\d+)/)[1];

    await editMemberGeneralPage.navigateTo(memberId);
    await editMemberGeneralPage.fillAll({
      name: newName,
      email: member.email,
      contact: member.contact,
    });
    await editMemberGeneralPage.update();

    // Community list reflects the new name (search by email -> name updated).
    const row = await communityMemberListPage.waitForMemberByEmail(member.email);
    expect(row.name).toBe(newName);
  });
});
