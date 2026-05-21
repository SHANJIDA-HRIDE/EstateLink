import { test } from '../fixtures/customTest';
import { Helpers } from '../utils/helpers';

test.describe('Unit Owner Management', () => {
  test.describe.configure({ mode: 'serial' });

  test('Find unoccupied unit and add new owner', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(90000);

    const uniqueId = Date.now();
    const memberData = {
      name: `Owner Automation ${uniqueId}`,
      email: `owner.automation.${uniqueId}@gmail.com`,
      contact: `017${String(uniqueId).slice(-7)}`,
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

    console.log(`Added ${memberData.name} as owner for unit ${unit.unitNumber} (${unit.unitHref})`);
  });

  test('Find unoccupied unit and add 3 new owners at a time', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(120000);

    const uniqueId = Date.now();
    const owners = [
      { percentage: '25' },
      { percentage: '40' },
      { percentage: '35' },
    ].map((owner, index) => ({
      ...owner,
      memberData: {
        name: `Owner Automation ${uniqueId}-${index + 1}`,
        email: `owner.automation.${uniqueId}.${index + 1}@gmail.com`,
        contact: `017${String(uniqueId).slice(-7)}${index + 1}`,
      },
    }));

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

    console.log(`Added 3 owners as 25%, 40%, and 35% owners for unit ${unit.unitNumber} (${unit.unitHref})`);
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

    console.log(`Added existing member ${selectedOwnerName} as owner for unit ${unit.unitNumber} (${unit.unitHref})`);
  });

  test('Find available unit and change ownership to new owner', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(90000);

    const uniqueId = Date.now();
    const memberData = {
      name: `Owner Automation ${uniqueId}`,
      email: `owner.automation.${uniqueId}@gmail.com`,
      contact: `017${String(uniqueId).slice(-7)}`,
    };
    const previousDay = String(new Date(Date.now() - 24 * 60 * 60 * 1000).getDate());

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickChangeOwnership();

    await addOwnerPage.changeOwnershipToNewMember(memberData, {
      percentage: '10',
      day: previousDay,
    });
    await addOwnerPage.saveOwner();

    await unitOwnersPage.verifyOwnerNameAdded(unit.unitDetailsUrl, memberData.name);

    console.log(`Changed ownership by adding ${memberData.name} as 10% owner for unit ${unit.unitNumber} (${unit.unitHref})`);
  });

  test('Find available unit and add resident', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
  }) => {
    test.setTimeout(90000);

    const uniqueId = Date.now();
    const residentData = {
      name: `Resident Automation ${uniqueId}`,
      email: `resident.automation.${uniqueId}@gmail.com`,
      contact: `017${String(uniqueId).slice(-7)}`,
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await addResidentPage.setStatusOccupied();
    await unitResidentsPage.clickAddResident();

    await addResidentPage.addNewResident(residentData);

    await unitResidentsPage.verifyResidentAdded(unit.unitDetailsUrl, residentData);

    console.log(`Added ${residentData.name} as resident for unit ${unit.unitNumber} (${unit.unitHref})`);
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

    // Open a random unit
    const unit = await viewTowersPage.openRandomAvailableUnit();

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

    console.log(`Successfully updated unit ${unit.unitNumber} with area: ${unitData.area}, bathrooms: ${unitData.bathrooms}, rooms: ${unitData.rooms}, balconies: ${unitData.balconies}`);
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

    const uniqueId = Date.now();
    const staffData = {
      name: `Staff Automation ${uniqueId}`,
      email: `staff.automation.${uniqueId}@gmail.com`,
      contact: `017${String(uniqueId).slice(-7)}`,
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitStaffPage.navigateToStaffTab(unit.unitDetailsUrl);
    await unitStaffPage.clickAddStaff();

    await addStaffPage.addNewStaff(staffData);

    await unitStaffPage.verifyStaffAdded(unit.unitDetailsUrl, staffData);

    console.log(`Added ${staffData.name} as staff for unit ${unit.unitNumber} (${unit.unitHref})`);
  });
});
