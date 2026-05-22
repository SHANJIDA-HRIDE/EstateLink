import { test, expect } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

test.describe('Tower Management', () => {

  test('Add new tower and verify creation', async ({ page, viewTowersPage, addTowerPage }) => {
    // Generate unique test data via helper
    const testData = Helpers.generateTowerData();

    // 1. Navigate to Tower Management page
    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    // 2. Click Add Tower button
    await viewTowersPage.clickAddTower();
    await page.waitForURL('**/addTower');

    // 3. Fill tower information
    await addTowerPage.fillTowerName(testData.name);
    await addTowerPage.fillNumberOfFloors(testData.floors);
    await addTowerPage.fillUnitsInEachFloor(testData.unitsPerFloor);

    // 4. Verify Save button is enabled
    await addTowerPage.verifySaveBtnEnabled();

    // 5. Submit the form
    await addTowerPage.saveTower();

    // 6. Handle success dialog
    await addTowerPage.handleSuccessDialog();

    // 7. Verify redirect back to tower list
    await page.waitForURL('**/ViewTowers');
    await viewTowersPage.verifyTowerListLoaded();

    console.log(`Tower '${testData.name}' created successfully!`);
  });

  test('Add tower with all fields populated', async ({ page, viewTowersPage, addTowerPage }) => {
    // Generate test data with specific values
    const testData = {
      name: `Automation Tower ${new Date().getTime()}`,
      description: 'Test tower with description for automation testing',
      floors: 5,
      unitsPerFloor: 4
    };

    // 1. Navigate and click Add Tower
    await viewTowersPage.navigateTo();
    await viewTowersPage.clickAddTower();

    // 2. Fill all tower fields
    await addTowerPage.fillTowerName(testData.name);
    await addTowerPage.fillDescription(testData.description);
    await addTowerPage.fillNumberOfFloors(testData.floors);
    await addTowerPage.fillUnitsInEachFloor(testData.unitsPerFloor);

    // 3. Verify Save button is enabled after filling required fields
    await addTowerPage.verifySaveBtnEnabled();

    // 4. Submit form
    await addTowerPage.saveTower();

    // 5. Handle success dialog
    await addTowerPage.handleSuccessDialog();

    // 6. Verify returned to tower list
    await expect(page).toHaveURL(/ViewTowers/);
    console.log(`Tower '${testData.name}' with ${testData.floors} floors and ${testData.unitsPerFloor} units created successfully!`);
  });

  test('Add tower with minimum fields (name only)', async ({ page, viewTowersPage, addTowerPage }) => {
    const testData = {
      name: `Min Tower ${new Date().getTime()}`,
      floors: 1,
      unitsPerFloor: 1
    };

    // 1. Navigate to tower management
    await viewTowersPage.navigateTo();
    await viewTowersPage.clickAddTower();

    // 2. Fill only required fields (tower name)
    await addTowerPage.fillTowerName(testData.name);
    
    // Set minimum floors and units
    await addTowerPage.fillNumberOfFloors(testData.floors);
    await addTowerPage.fillUnitsInEachFloor(testData.unitsPerFloor);

    // 3. Save tower
    await addTowerPage.saveTower();

    // 4. Verify success
    await addTowerPage.handleSuccessDialog();
    await viewTowersPage.verifyTowerListLoaded();

    console.log(`Minimal tower '${testData.name}' created successfully!`);
  });

});
