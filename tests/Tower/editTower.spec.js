import { test, expect } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

test.describe('Tower - Edit', () => {
  // Shares one live account; run serially to avoid concurrent-session flakiness.
  test.describe.configure({ mode: 'serial' });

  // TE-01: edit a tower's name and verify it persists in ViewTowers.
  test('TE-01 edit tower name persists in ViewTowers', async ({ addTowerPage, viewTowersPage }) => {
    test.setTimeout(150000);
    const tower = { ...Helpers.generateTowerData(), floors: 2, unitsPerFloor: 2 };
    tower.name = `EditT ${Helpers.uniqueId()}`;

    await addTowerPage.navigateTo();
    await addTowerPage.fillTowerInfo(tower);
    await addTowerPage.saveTower();
    await addTowerPage.handleSuccessDialog();

    // Open edit, rename, update.
    await viewTowersPage.navigateTo();
    await viewTowersPage.openTowerEdit(tower.name);
    const newName = `Edited ${Helpers.uniqueId()}`;
    await addTowerPage.editTowerName(newName);

    // New name shows in ViewTowers.
    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerVisible(newName);
  });

  // TE-04: changing floors/units regenerates the grid.
  test('TE-04 change floors and units regenerates the grid', async ({ addTowerPage, viewTowersPage }) => {
    test.setTimeout(150000);
    const tower = { ...Helpers.generateTowerData(), floors: 2, unitsPerFloor: 2 };
    tower.name = `FUEdit ${Helpers.uniqueId()}`;

    await addTowerPage.navigateTo();
    await addTowerPage.fillTowerInfo(tower);
    await addTowerPage.saveTower();
    await addTowerPage.handleSuccessDialog();

    // 2x2 = 4 units initially.
    await viewTowersPage.navigateTo();
    expect((await viewTowersPage.towerUnitNames(tower.name)).length).toBe(4);

    // Edit to 3x3 = 9 units.
    await viewTowersPage.navigateTo();
    await viewTowersPage.openTowerEdit(tower.name);
    await addTowerPage.editFloorsUnits(3, 3);

    await viewTowersPage.navigateTo();
    expect((await viewTowersPage.towerUnitNames(tower.name)).length).toBe(9);
  });
});
