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
});
