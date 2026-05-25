import { test } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

test.describe('Unit Resident Management', () => {
  test.describe.configure({ mode: 'serial' });

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
