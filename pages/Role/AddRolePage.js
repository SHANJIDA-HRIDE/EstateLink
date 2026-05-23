import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';

export class AddRolePage extends BasePage {
  constructor(page) {
    super(page);
    // Form inputs - using flexible selectors
    this.roleNameInput = page.locator('input[name="role_name"]');
    this.roleDescriptionInput = page.locator('textarea').first();
    
    // Permissions - Select all checkbox
    this.permissionCheckboxes = page.locator('input[type="checkbox"]');
    
    // Buttons
    this.createBtn = page.getByRole('button', { name: /^Create$/i });
    this.okBtn = page.getByRole('button', { name: /^OK$/i });
    
    // Success message
    this.successMessage = page.getByText(/successfully added|new role|created/i);
  }

  async fillRoleName(roleName) {
    await this.roleNameInput.fill(roleName);
  }

  async fillRoleDescription(description) {
    await this.roleDescriptionInput.fill(description);
  }

  async selectAllPermissions() {
    await this.permissionCheckboxes.first().waitFor({ state: 'attached', timeout: 15000 });
    const checkboxes = await this.permissionCheckboxes.all();

    for (const checkbox of checkboxes) {
      if (await checkbox.isChecked()) continue;

      const checkboxId = await checkbox.getAttribute('id');
      const label = checkboxId ? this.page.locator(`label[for="${checkboxId}"]`) : null;

      if (label && (await label.count()) > 0) {
        await label.click();
      } else {
        await checkbox.evaluate((el) => {
          const input = /** @type {HTMLInputElement} */ (el);
          if (!input.checked) input.click();
        });
      }
      await expect(checkbox).toBeChecked();
    }
  }

  async clickCreate() {
    await this.createBtn.click();
  }

  async clickOK() {
    await this.okBtn.click();
  }

  async addNewRole(roleName, roleDescription) {
    // Fill role details
    await this.fillRoleName(roleName);
    await this.fillRoleDescription(roleDescription);
    
    // Select all permissions
    await this.selectAllPermissions();
    
    // Click Create button
    await this.clickCreate();
    
    // Wait for success message and click OK
    await expect(this.successMessage).toBeVisible({ timeout: 30000 });
    await this.clickOK();
  }
}
