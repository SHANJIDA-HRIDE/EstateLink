import { test } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

test.describe('Unit Owner Management', () => {
  test.describe.configure({ mode: 'serial' });

  test('Find unoccupied unit and add new owner', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(90000);

    const id = Helpers.uniqueId();
    const memberData = {
      name: `Owner Automation ${id}`,
      email: `owner.automation.${id}@gmail.com`,
      contact: Helpers.uniqueContact(), // valid 11-digit number
    };
    const ownershipPercentage = '100';

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openFirstUnoccupiedUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickAddOwner();

    await addOwnerPage.addNewMember(memberData);
    await addOwnerPage.fillOwnershipDetails({ percentage: ownershipPercentage });
    await addOwnerPage.saveOwner();

    await unitOwnersPage.verifyOwnerAdded(unit.unitDetailsUrl, memberData);
  });

  test('Find unoccupied unit and add 3 new owners at a time', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(120000);

    const owners = [
      { percentage: '25' },
      { percentage: '40' },
      { percentage: '35' },
    ].map((owner) => {
      const id = Helpers.uniqueId();
      return {
        ...owner,
        memberData: {
          name: `Owner Automation ${id}`,
          email: `owner.automation.${id}@gmail.com`,
          contact: Helpers.uniqueContact(), // valid 11-digit number
        },
      };
    });

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openFirstUnoccupiedUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickAddOwner();

    await addOwnerPage.addMultipleNewOwners(owners);
    await addOwnerPage.saveOwner();

    await unitOwnersPage.verifyOwnersAdded(
      unit.unitDetailsUrl,
      owners.map((owner) => owner.memberData),
    );
  });

  test('Find unoccupied unit and add existing member as owner', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(90000);

    const searchTerm = 'Automation Org Member';
    const previousDay = String(new Date(Date.now() - 24 * 60 * 60 * 1000).getDate());

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openFirstUnoccupiedUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickAddOwner();

    const selectedOwnerName = await addOwnerPage.searchAndSelectExistingMember(searchTerm);
    await addOwnerPage.fillOwnershipDetails({ percentage: '100', day: previousDay });
    await addOwnerPage.saveOwner();

    await unitOwnersPage.verifyOwnerNameAdded(unit.unitDetailsUrl, selectedOwnerName);
  });

  test('Find available unit and change ownership to new owner', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(90000);

    const id = Helpers.uniqueId();
    const memberData = {
      name: `Owner Automation ${id}`,
      email: `owner.automation.${id}@gmail.com`,
      contact: Helpers.uniqueContact(), // valid 11-digit number
    };
    // Ownership date in the past, clamped to a day that always exists in the
    // current month so the date picker never lands on a previous-month cell.
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const ownershipDay = String(
      yesterday.getMonth() === new Date().getMonth() ? yesterday.getDate() : new Date().getDate(),
    );

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickChangeOwnership();

    await addOwnerPage.changeOwnershipToNewMember(memberData, {
      percentage: '10',
      day: ownershipDay,
    });
    await addOwnerPage.saveOwner();

    await unitOwnersPage.verifyOwnerNameAdded(unit.unitDetailsUrl, memberData.name);
  });

  test('Find available unit and add resident', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
  }) => {
    test.setTimeout(90000);

    const id = Helpers.uniqueId();
    const residentData = {
      name: `Resident Automation ${id}`,
      email: `resident.automation.${id}@gmail.com`,
      contact: Helpers.uniqueContact(), // valid 11-digit number
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await addResidentPage.setStatusOccupied();
    await unitResidentsPage.clickAddResident();

    await addResidentPage.addNewResident(residentData);

    await unitResidentsPage.verifyResidentAdded(unit.unitDetailsUrl, residentData);
  });
});

test.describe('Unit Information Management', () => {
  test.describe.configure({ mode: 'serial' });

  test('Edit unit general info and upload document', async ({
    viewTowersPage,
    unitDetailsPage,
    editUnitGeneralPage,
    page,
  }) => {
    test.setTimeout(90000);

    const unitData = {
      area: '1500',
      bathrooms: '2',
      rooms: '3',
      balconies: '1',
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    // Open a random unit (navigates to its details page)
    await viewTowersPage.openRandomAvailableUnit();

    // Go to Unit Information tab
    await unitDetailsPage.goToUnitInformationTab();

    // Click Edit button
    await unitDetailsPage.clickEditButton();
    await page.waitForLoadState('domcontentloaded');

    // Fill out all unit information
    await editUnitGeneralPage.fillGeneralInfo(unitData);

    // Save the unit information
    await editUnitGeneralPage.saveUnitInfo();

    // Verify success message
    await editUnitGeneralPage.verifySuccessMessage();
    
    // Click OK button
    await editUnitGeneralPage.clickOK();
  });
});

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
});
