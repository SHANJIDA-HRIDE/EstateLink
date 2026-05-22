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
    this.membersDropdown = page.locator('input[placeholder*="Select Member"]').first();
    this.membersList = page.locator('[role="option"]');
    
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
    // Get all role checkboxes and click the labels
    const checkboxes = await this.page.locator('input[type="checkbox"]').all();
    
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
          // If no label found, try clicking via evaluate
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

  async selectFirstMember() {
    // Try different selectors for the members dropdown
    const selectors = [
      'input[placeholder*="Select Member"]',
      'input[placeholder*="member"]',
      'input[placeholder*="Member"]',
      'select',
      'div[role="listbox"]'
    ];

    let clicked = false;
    for (const selector of selectors) {
      try {
        const element = this.page.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 5000 }).catch(() => false);
        if (isVisible) {
          await element.click();
          clicked = true;
          await this.page.waitForTimeout(500);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!clicked) {
      console.warn('Could not find member dropdown, attempting alternative approach');
      // Try clicking on any visible input near the member selection area
      const allInputs = this.page.locator('input[type="text"]');
      const count = await allInputs.count();
      if (count > 2) {
        await allInputs.nth(2).click(); // Usually 3rd input is members
        await this.page.waitForTimeout(500);
      }
    }
    
    // Select the first member from the list if available
    try {
      const firstMember = this.page.locator('[role="option"]').first();
      const isMemberVisible = await firstMember.isVisible({ timeout: 5000 }).catch(() => false);
      if (isMemberVisible) {
        await firstMember.click();
        await this.page.waitForTimeout(500);
      }
    } catch (e) {
      console.warn('Could not click first member option', e);
    }
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
    
    // Select all roles
    await this.selectAllRoles();
    
    // Select first member
    await this.selectFirstMember();
    
    // Click Create button
    await this.clickCreate();
    
    // Wait for success message and click OK
    await expect(this.successMessage).toBeVisible({ timeout: 30000 });
    await this.clickOK();
  }
}
