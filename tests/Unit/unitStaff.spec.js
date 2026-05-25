import { test } from '../../fixtures/customTest';
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
});
