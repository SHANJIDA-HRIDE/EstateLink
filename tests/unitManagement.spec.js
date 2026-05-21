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

    const memberData = Helpers.generateMemberData();
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
        name: `Automation Unit Owner ${uniqueId}-${index + 1}`,
        email: `automation.unit.owner.${uniqueId}.${index + 1}@gmail.com`,
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

    const memberData = Helpers.generateMemberData();
    const previousDay = String(new Date(Date.now() - 24 * 60 * 60 * 1000).getDate());

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openFirstAvailableUnit();

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
});
