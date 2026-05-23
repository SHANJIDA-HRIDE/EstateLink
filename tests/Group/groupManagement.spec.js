import { test } from '../../fixtures/customTest';

test.describe('Group Management', () => {
  test.describe.configure({ mode: 'serial' });

  test('Add new group with valid name', async ({
    page,
    groupListPage,
    addGroupPage,
  }) => {
    test.setTimeout(90000);

    const uniqueId = Date.now();
    const groupName = `Group Automation ${uniqueId}`;
    const groupDescription = `Automated test group created at ${new Date().toISOString()}`;

    // Set up network listeners
    page.on('requestfailed', request => {
      console.log(`--- Request Failed: ${request.url()} | Error: ${request.failure()?.errorText}`);
    });
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`--- HTTP Error Response: ${response.status()} | URL: ${response.url()}`);
      }
    });

    await groupListPage.navigateTo();
    await groupListPage.verifyGroupListLoaded();

    await groupListPage.clickAddGroup();

    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    const dialogs = await page.locator('div.fixed.inset-0').all();
    console.log(`--- DEBUG: Found ${dialogs.length} overlay dialogs ---`);
    for (let i = 0; i < dialogs.length; i++) {
      const text = await dialogs[i].innerText();
      const html = await dialogs[i].evaluate(el => el.outerHTML.slice(0, 500));
      console.log(`Dialog ${i}: Text="${text}" | HTML="${html}"`);
    }
    console.log(`--- END DEBUG ---`);

    try {
      await addGroupPage.addNewGroup(groupName, groupDescription);
    } catch (e) {
      console.log('Test action failed:', e);
      throw e;
    }

    console.log(`Successfully added group: ${groupName}`);
  });
});
