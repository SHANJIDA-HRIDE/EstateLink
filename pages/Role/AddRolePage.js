import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

export class AddRolePage extends BasePage {
  constructor(page) {
    super(page);
    // Form inputs - using flexible selectors
    this.roleNameInput = page.locator('input[name="role_name"]');
    this.roleDescriptionInput = page.locator('textarea[name="role_description"]');

    // Permissions - Select all checkbox
    this.permissionCheckboxes = page.locator('input[type="checkbox"]');

    // Buttons
    this.createBtn = page.getByRole('button', { name: /^Create$/i });
    this.updateBtn = page.getByRole('button', { name: /^Update$/i });
    this.okBtn = page.getByRole('button', { name: /^OK$/i });

    // Success dialog message (create or edit). Tight phrasing avoids matching role
    // names containing "updated"/"created" elsewhere on the page.
    this.successMessage = page.getByText(/has been successfully (added|updated)/i);
    // Validation
    this.requiredNameError = page.getByText('Role name is required');
    this.duplicateNameError = page.getByText(/A role with this name already exists/i);
  }

  async navigateTo() {
    await this.navigate(`${ENV.BASE_URL}/addRole`);
    await this.roleNameInput.waitFor({ state: 'visible', timeout: 20000 });
  }

  /**
   * Overwrites name + description on the edit form and saves: Update → confirm modal
   * (Confirm) → success dialog (OK). Must be on the edit form reached via the
   * profile's Edit link (a direct /addRole/{id} load prefills but does NOT persist).
   */
  async updateNameDescription(name, description) {
    await expect(this.roleNameInput).not.toHaveValue('', { timeout: 15000 }); // prefill loaded
    await this.roleNameInput.fill(name);
    await this.roleDescriptionInput.fill(description);
    await this.updateBtn.click();
    await this.page.getByRole('button', { name: /^Confirm$/i }).click();
    await expect(this.successMessage).toBeVisible({ timeout: 30000 });
    await this.okBtn.click();
  }

  /**
   * Toggles the role's status from the edit form: click the status button
   * (Active/Inactive) → confirm modal (Confirm) → "Role status updated successfully" → OK.
   */
  async toggleStatus() {
    await this.page.getByRole('button', { name: /^(Active|Inactive)$/ }).first().click();
    await this.page.getByRole('button', { name: /^Confirm$/i }).click();
    await expect(this.page.getByText(/Role status updated successfully/i)).toBeVisible({ timeout: 30000 });
    await this.okBtn.click();
  }

  /** Renames on the edit form and submits (Update → Confirm) without waiting for success. */
  async attemptRename(name) {
    await expect(this.roleNameInput).not.toHaveValue('', { timeout: 15000 }); // prefill loaded
    await this.roleNameInput.fill(name);
    await this.updateBtn.click();
    await this.page.getByRole('button', { name: /^Confirm$/i }).click();
  }

  /** Toggles permissions on the edit form and saves: Update → Confirm → OK. */
  async togglePermissionsAndUpdate(permissions) {
    await expect(this.roleNameInput).not.toHaveValue('', { timeout: 15000 }); // prefill loaded
    await this.selectPermissions(permissions);
    await this.updateBtn.click();
    await this.page.getByRole('button', { name: /^Confirm$/i }).click();
    await expect(this.successMessage).toBeVisible({ timeout: 30000 });
    await this.okBtn.click();
  }

  /** Checks specific permissions by their visible names (React-controlled — click the text). */
  async selectPermissions(permissions) {
    for (const perm of permissions) {
      await this.page.getByText(perm, { exact: true }).first().click();
    }
  }

  /** Number of currently-checked permission checkboxes (excludes the Select-All toggles). */
  async checkedPermissionCount() {
    return this.page.locator('input[name="permissions"]:checked').count();
  }

  /** Toggles the Nth category's "Select All" checkbox (0-based). */
  async toggleCategorySelectAll(index) {
    await this.page.getByText('Select All', { exact: true }).nth(index).click();
  }

  /** Clicks every category "Select All" toggle, granting all permissions. */
  async selectAllPermissionCategories() {
    const labels = this.page.getByText('Select All', { exact: true });
    const n = await labels.count();
    for (let i = 0; i < n; i++) await labels.nth(i).click();
  }

  /**
   * Create flow granting ALL permissions via the category Select-All toggles.
   * Asserts every permission checkbox ends checked before submitting.
   */
  async createRoleWithAllPermissions(name, description) {
    await this.roleNameInput.fill(name);
    await this.roleDescriptionInput.fill(description);
    await this.selectAllPermissionCategories();
    const total = await this.page.locator('input[name="permissions"]').count();
    await expect(this.page.locator('input[name="permissions"]:checked')).toHaveCount(total);
    await this.createBtn.click();
    await expect(this.successMessage).toBeVisible({ timeout: 30000 });
    await this.okBtn.click();
  }

  /**
   * Full create flow: fill name + description, select the given permissions, Create,
   * and confirm the success dialog (lands back on the role list).
   */
  async createRole(name, description, permissions) {
    await this.roleNameInput.fill(name);
    await this.roleDescriptionInput.fill(description);
    await this.selectPermissions(permissions);
    await this.createBtn.click();
    await expect(this.successMessage).toBeVisible({ timeout: 30000 });
    await this.okBtn.click();
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
