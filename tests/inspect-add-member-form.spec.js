import { test, expect } from '../fixtures/customTest';
import { Helpers } from '../utils/helpers';

test.describe('Unit Owner Management', () => {
  test('find a unit without owner and add a new owner', async ({ page, viewTowersPage }) => {
    test.setTimeout(90000);

    const memberData = Helpers.generateMemberData();
    const ownerName = memberData.name;
    const ownershipPercentage = '100';
    const today = new Date();
    const ownershipDay = String(today.getDate());

    await viewTowersPage.navigateTo();

    const unownedUnit = page.locator('a[href^="/unit-details/"]', {
      has: page.getByTitle('no owner'),
    }).first();

    await expect(unownedUnit, 'Expected at least one unit with no owner').toBeVisible({ timeout: 15000 });

    const unitHref = await unownedUnit.getAttribute('href');
    const unitNumber = (await unownedUnit.innerText()).trim();

    await unownedUnit.click();
    await expect(page).toHaveURL(/\/unit-details\/\d+$/);

    const unitDetailsUrl = page.url();
    await page.goto(`${unitDetailsUrl}?tab=2`);
    await expect(page).toHaveURL(/\/unit-details\/\d+\?tab=2$/);

    await page.getByRole('button', { name: /^Add Owner$/i }).click();
    await expect(page).toHaveURL(/\/unit\/\d+\/add-owner$/);

    await page.getByRole('button', { name: /Add New Member/i }).click();

    await page.locator('input[name="full_name"]').fill(ownerName);
    await page.locator('input[name="general_email"]').fill(memberData.email);
    await page.locator('input[name="general_contact"]').fill(memberData.contact);

    await page.getByRole('button', { name: /^Next$/i }).click();
    await page.getByRole('button', { name: /^Submit$/i }).click();

    await expect(page.getByRole('heading', { name: /Add New Comm Member/i })).toBeHidden({
      timeout: 15000,
    });
    await expect(page.getByPlaceholder('Enter Name')).toHaveValue(ownerName);

    await page.locator('input[name="owners.0.ownershipPercentage"]').fill(ownershipPercentage);

    const ownershipDate = page.locator('input[placeholder*="Select date of ownership"]').first();
    await ownershipDate.click();
    await page.getByText(new RegExp(`^${ownershipDay}$`)).last().click();
    await expect(ownershipDate).not.toHaveValue('');

    await page.locator('button[type="submit"]').filter({ hasText: /^Save$/i }).click();
    await expect(page.getByRole('button', { name: /Creating Owners/i })).toBeHidden({ timeout: 45000 });

    await page.goto(`${unitDetailsUrl}?tab=2`);
    await expect(page.getByRole('heading', { name: ownerName })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('span').filter({ hasText: memberData.email })).toBeVisible();

    console.log(`Added ${ownerName} as owner for unit ${unitNumber} (${unitHref})`);
  });
});
