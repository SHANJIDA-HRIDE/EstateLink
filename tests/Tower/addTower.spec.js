import path from 'path';
import { test, expect } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

const filePath = (f) => path.resolve(process.cwd(), 'test-data', 'files', f);

test.describe('Tower Management', () => {
  // Shares one live account; run serially to avoid concurrent-session flakiness.
  test.describe.configure({ mode: 'serial' });

  // TA-01: create a tower (numerical naming) and verify it appears in ViewTowers.
  test('TA-01 create a tower and verify it in ViewTowers', async ({ addTowerPage, viewTowersPage }) => {
    test.setTimeout(120000);
    const tower = Helpers.generateTowerData(); // 5 floors x 4 units, numerical

    await addTowerPage.navigateTo();
    await addTowerPage.fillTowerInfo(tower);
    await addTowerPage.saveTower();
    await addTowerPage.handleSuccessDialog();

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerVisible(tower.name);
  });

  // TA-02: alphabetical unit naming -> units named with letters (1A, 1B, ...).
  test('TA-02 create a tower with alphabetical unit naming', async ({ addTowerPage, viewTowersPage }) => {
    test.setTimeout(120000);
    const tower = { ...Helpers.generateTowerData(), unitNaming: 'alphabetical', floors: 2, unitsPerFloor: 3 };
    tower.name = `AlphaTower ${Helpers.uniqueId()}`;

    await addTowerPage.navigateTo();
    await addTowerPage.fillTowerInfo(tower);
    await addTowerPage.saveTower();
    await addTowerPage.handleSuccessDialog();

    await viewTowersPage.navigateTo();
    const units = await viewTowersPage.towerUnitNames(tower.name);
    expect(units.length).toBeGreaterThan(0);
    // Every unit is floor-number + letter (alphabetical), not a numeric-only name.
    expect(units.every((u) => /^\d+[A-Z]+$/.test(u))).toBe(true);
    expect(units).toContain('1A');
  });

  // TA-03: "Add Tower Number to Unit Name" prefixes every unit with the tower number.
  test('TA-03 add tower number to unit name prefixes units', async ({ addTowerPage, viewTowersPage }) => {
    test.setTimeout(120000);
    const tower = { ...Helpers.generateTowerData(), unitNaming: 'numerical', floors: 2, unitsPerFloor: 2 };
    tower.name = `PrefixTower ${Helpers.uniqueId()}`;

    await addTowerPage.navigateTo();
    await addTowerPage.fillTowerInfo(tower);
    await addTowerPage.addTowerNumberToUnitName();
    await addTowerPage.saveTower();
    await addTowerPage.handleSuccessDialog();

    await viewTowersPage.navigateTo();
    const num = await viewTowersPage.towerNumber(tower.name);
    expect(num).toBeTruthy();
    const units = await viewTowersPage.towerUnitNames(tower.name);
    expect(units.length).toBeGreaterThan(0);
    // Every unit is prefixed "{towerNumber} - ...".
    expect(units.every((u) => u.startsWith(`${num} - `))).toBe(true);
  });

  // TA-05: the generated grid has exactly floors x units cells.
  test('TA-05 grid has floors x units total cells', async ({ addTowerPage, viewTowersPage }) => {
    test.setTimeout(120000);
    const floors = 3;
    const unitsPerFloor = 4;
    const tower = { ...Helpers.generateTowerData(), unitNaming: 'numerical', floors, unitsPerFloor };
    tower.name = `GridTower ${Helpers.uniqueId()}`;

    await addTowerPage.navigateTo();
    await addTowerPage.fillTowerInfo(tower);
    await addTowerPage.saveTower();
    await addTowerPage.handleSuccessDialog();

    await viewTowersPage.navigateTo();
    const units = await viewTowersPage.towerUnitNames(tower.name);
    expect(units.length).toBe(floors * unitsPerFloor); // 3 x 4 = 12
  });

  // TA-10: optional description + photo persist (verified on the edit form).
  test('TA-10 description and photo persist', async ({ addTowerPage, viewTowersPage, page }) => {
    test.setTimeout(120000);
    const tower = { ...Helpers.generateTowerData(), floors: 2, unitsPerFloor: 2 };
    tower.name = `PhotoTower ${Helpers.uniqueId()}`;
    tower.description = `Desc ${tower.name}`;

    await addTowerPage.navigateTo();
    await addTowerPage.fillTowerInfo(tower);
    await addTowerPage.uploadPhoto(filePath('ProfilePicture.png'));
    await addTowerPage.saveTower();
    await addTowerPage.handleSuccessDialog();

    // On the edit form: description prefilled and the uploaded photo is served from media/towers.
    await viewTowersPage.navigateTo();
    await viewTowersPage.openTowerEdit(tower.name);
    await expect(page.locator('textarea[name="description"]')).toHaveValue(tower.description, { timeout: 15000 });
    await expect(page.locator('img[src*="media/towers"]').first()).toBeVisible({ timeout: 15000 });
  });

  // TA-11: invalid type / oversize tower photo is rejected.
  test('TA-11 invalid/oversize tower photo is rejected', async ({ addTowerPage }) => {
    test.setTimeout(120000);
    await addTowerPage.navigateTo();

    // Wrong type (PDF).
    await addTowerPage.uploadPhoto(filePath('Announcement3.pdf'));
    await expect(addTowerPage.photoTypeError).toBeVisible({ timeout: 10000 });

    // Oversize (>5MB JPG).
    await addTowerPage.uploadPhoto(filePath('morethan5MB.jpg'));
    await expect(addTowerPage.photoSizeError).toBeVisible({ timeout: 10000 });
  });
});
