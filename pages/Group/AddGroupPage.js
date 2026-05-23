import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';

export class AddGroupPage extends BasePage {
  constructor(page) {
    super(page);
    // Form inputs
    this.groupNameInput = page.locator('input[name="group_name"]');
    this.groupDescriptionInput = page.locator('textarea').first();

    // Checkbox groups
    this.roleCheckboxes = page.locator('input[type="checkbox"][name="role_ids"]');
    this.memberCheckboxes = page.locator(
      'input[type="checkbox"]:not([name="role_ids"]):not([id="selectAll"])',
    );

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

  /**
   * Checks every checkbox matched by the given locator. These are custom-styled
   * inputs, so we click the wrapping <label> (the visible target) and fall back
   * to a native click only when no label wraps the input.
   * @param {import('@playwright/test').Locator} checkboxLocator
   */
  async #checkAll(checkboxLocator) {
    await checkboxLocator.first().waitFor({ state: 'attached', timeout: 15000 });
    const checkboxes = await checkboxLocator.all();

    for (const checkbox of checkboxes) {
      if (await checkbox.isChecked()) continue;

      const parentLabel = checkbox.locator('xpath=ancestor::label[1]');
      if ((await parentLabel.count()) > 0) {
        await parentLabel.click();
      } else {
        await checkbox.evaluate((el) => {
          const input = /** @type {HTMLInputElement} */ (el);
          if (!input.checked) input.click();
        });
      }
      await expect(checkbox).toBeChecked();
    }
  }

  async selectAllRoles() {
    await this.#checkAll(this.roleCheckboxes);
  }

  async selectAllMembers() {
    await this.#checkAll(this.memberCheckboxes);
  }

  async clickCreate() {
    await this.createBtn.click();
  }

  async clickOK() {
    await this.okBtn.click();
  }

  async addNewGroup(groupName, groupDescription) {
    await this.fillGroupName(groupName);
    await this.fillGroupDescription(groupDescription);

    // Select members before roles to avoid checkbox-state interference.
    await this.selectAllMembers();
    await this.selectAllRoles();

    await this.clickCreate();
    await expect(this.successMessage).toBeVisible({ timeout: 30000 });
    await this.clickOK();
  }
}
