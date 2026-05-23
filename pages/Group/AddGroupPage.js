import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';

export class AddGroupPage extends BasePage {
  constructor(page) {
    super(page);
    // Form inputs
    this.groupNameInput = page.locator('input[name="group_name"]');
    this.groupDescriptionInput = page.locator('textarea').first();

    // Roles and Members selection
    this.rolesCheckboxes = page.locator('input[type="checkbox"]').filter({ hasText: /role/i });
    this.memberCheckboxes = page.locator('input[type="checkbox"]');

    // Buttons
    this.createBtn = page.getByRole('button', { name: /^Create$/i });
    this.okBtn = page.getByRole('button', { name: /^OK$/i });

    // Success message
    this.successMessage = page.getByText(/Group created successfully/i);
  }

  async fillGroupName(groupName) {
    await this.groupNameInput.fill(groupName);
  }

  async fillGroupDescription(description) {
    await this.groupDescriptionInput.fill(description);
  }

  async selectAllRoles() {
    // Wait for network to stabilize
    await this.page.waitForLoadState('networkidle').catch(() => { });

    // Wait for roles to load (we wait for at least one checkbox with name="role_ids" to be attached)
    const roleCheckboxLocator = this.page.locator('input[type="checkbox"][name="role_ids"]');
    await roleCheckboxLocator.first().waitFor({ state: 'attached', timeout: 15000 });
    await this.page.waitForTimeout(1000); // Wait for list to finish rendering

    const checkboxes = await roleCheckboxLocator.all();
    console.log(`Found ${checkboxes.length} role checkboxes`);

    let checkedCountBefore = 0;
    for (const checkbox of checkboxes) {
      if (await checkbox.isChecked()) checkedCountBefore++;
    }
    console.log(`Already checked roles initially: ${checkedCountBefore}`);

    let selectActionsCount = 0;
    for (const checkbox of checkboxes) {
      try {
        const isChecked = await checkbox.isChecked();
        if (!isChecked) {
          // Try parent label first (contains role name)
          const parentLabel = checkbox.locator('xpath=ancestor::label[1]');
          if (await parentLabel.count() > 0) {
            await parentLabel.click();
            selectActionsCount++;
          } else {
            // Fallback: evaluate JS click
            await checkbox.evaluate((el) => { if (!el.checked) el.click(); });
            selectActionsCount++;
          }
          await this.page.waitForTimeout(100);
        }
      } catch (e) {
        console.warn('Failed to check role checkbox:', e.message);
      }
    }

    // Verify check status
    let checkedCountAfter = 0;
    for (const checkbox of checkboxes) {
      if (await checkbox.isChecked()) checkedCountAfter++;
    }
    console.log(`Select role actions performed: ${selectActionsCount}, total checked roles at end: ${checkedCountAfter} / ${checkboxes.length}`);
  }

  async selectAllMembers() {
    // Wait for network to stabilize
    await this.page.waitForLoadState('networkidle').catch(() => { });

    // Wait for members to load (checkboxes that are NOT role_ids and NOT selectAll)
    const memberCheckboxLocator = this.page.locator('input[type="checkbox"]:not([name="role_ids"]):not([id="selectAll"])');
    await memberCheckboxLocator.first().waitFor({ state: 'attached', timeout: 15000 });
    await this.page.waitForTimeout(1500); // Wait for list to finish rendering

    const checkboxes = await memberCheckboxLocator.all();
    console.log(`Found ${checkboxes.length} member checkboxes`);

    let checkedCountBefore = 0;
    for (const checkbox of checkboxes) {
      if (await checkbox.isChecked()) checkedCountBefore++;
    }
    console.log(`Already checked members initially: ${checkedCountBefore}`);

    let memberCheckboxCount = 0;
    for (const checkbox of checkboxes) {
      try {
        const isChecked = await checkbox.isChecked();
        if (!isChecked) {
          // Try parent label first
          const parentLabel = checkbox.locator('xpath=ancestor::label[1]');
          if (await parentLabel.count() > 0) {
            await parentLabel.click();
            memberCheckboxCount++;
          } else {
            // Fallback: evaluate JS click
            await checkbox.evaluate((el) => { if (!el.checked) el.click(); });
            memberCheckboxCount++;
          }
          await this.page.waitForTimeout(100);
        }
      } catch (e) {
        console.warn('Failed to check member checkbox:', e.message);
      }
    }

    // Verify check status
    let checkedCountAfter = 0;
    for (const checkbox of checkboxes) {
      if (await checkbox.isChecked()) checkedCountAfter++;
    }
    console.log(`Select member actions performed: ${memberCheckboxCount}, total checked members at end: ${checkedCountAfter} / ${checkboxes.length}`);
  }

  async clickCreate() {
    await this.createBtn.click();
  }

  async clickOK() {
    await this.okBtn.click();
  }

  async addNewGroup(groupName, groupDescription) {
    // Fill group details
    await this.fillGroupName(groupName);
    await this.fillGroupDescription(groupDescription);

    // Select all members FIRST (before roles, to avoid checkbox state interference)
    await this.selectAllMembers();

    // Select all roles
    await this.selectAllRoles();

    // Click Create button
    await this.clickCreate();

    // Wait for success message and click OK
    await expect(this.successMessage).toBeVisible({ timeout: 30000 });
    await this.clickOK();
  }
}
