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
    // Find all checkbox IDs and click their associated labels
    const checkboxes = await this.permissionCheckboxes.all();
    
    for (const checkbox of checkboxes) {
      const checkboxId = await checkbox.getAttribute('id');
      const isChecked = await checkbox.isChecked();
      
      if (!isChecked && checkboxId) {
        // Find and click the associated label
        const label = this.page.locator(`label[for="${checkboxId}"]`);
        const labelExists = await label.count() > 0;
        
        if (labelExists) {
          await label.click();
        } else {
          // If no label found, try clicking the checkbox with force
          try {
            await checkbox.evaluate((el) => el.click());
          } catch (e) {
            // Skip if can't click
          }
        }
        await this.page.waitForTimeout(100);
      }
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
