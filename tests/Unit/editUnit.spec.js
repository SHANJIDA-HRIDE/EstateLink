import path from 'path';
import { test } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

const filePath = (f) => path.resolve(process.cwd(), 'test-data', 'files', f);

test.describe('Unit - Edit Information', () => {
  // Shares one live account; run serially to avoid concurrent-session flakiness.
  test.describe.configure({ mode: 'serial' });

  // UE-01: edit area/rooms/bathrooms/balconies + attachment -> persists on Unit Information tab.
  test('UE-01 edit unit information and attachment persists', async ({
    addTowerPage,
    viewTowersPage,
    unitDetailsPage,
    editUnitGeneralPage,
    page,
  }) => {
    test.setTimeout(180000);

    // Fresh single-unit tower -> guaranteed clean unit.
    const tower = { ...Helpers.generateTowerData(), floors: 1, unitsPerFloor: 1 };
    tower.name = `UnitT ${Helpers.uniqueId()}`;
    await addTowerPage.navigateTo();
    await addTowerPage.fillTowerInfo(tower);
    await addTowerPage.saveTower();
    await addTowerPage.handleSuccessDialog();

    await viewTowersPage.navigateTo();
    await viewTowersPage.openUnitInTower(tower.name);
    const id = page.url().match(/unit-details\/(\d+)/)[1];

    // Edit General Information + upload a document.
    const unit = Helpers.generateUnitData(); // area 1500, bathrooms 2, rooms 3, balconies 1
    await unitDetailsPage.clickEditButton();
    await page.waitForURL(/edit-unit-general/, { timeout: 30000 });
    await editUnitGeneralPage.waitLoaded();
    await editUnitGeneralPage.fillGeneralInfo(unit);
    await editUnitGeneralPage.uploadDocument(filePath('ProfilePicture.png'));
    await editUnitGeneralPage.saveUnitInfo();
    await editUnitGeneralPage.verifySuccessMessage();
    await editUnitGeneralPage.clickOK();

    // Verify on the Unit Information tab.
    await unitDetailsPage.navigateToUnit(id);
    await unitDetailsPage.goToUnitInformationTab();
    await unitDetailsPage.verifyFieldContains('Area', String(unit.area));
    await unitDetailsPage.verifyField('Number of Bathrooms', String(unit.bathrooms));
    await unitDetailsPage.verifyField('Number of Rooms', String(unit.rooms));
    await unitDetailsPage.verifyField('Number of Balconies', String(unit.balconies));
    await unitDetailsPage.verifyDocumentPresent();
  });
});
