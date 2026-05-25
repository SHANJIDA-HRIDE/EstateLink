import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

/**
 * Role profile / view page (/roleProfile/{id}).
 * Tabs: "Role Details" (Role Name, Role Description, granted permissions) and
 * "Role Assigned Member". Fields render as <p>label</p><p>value</p>.
 */
export class RoleProfilePage extends BasePage {
  constructor(page) {
    super(page);
    this.editBtn = page.getByRole('button', { name: /^Edit$/ });
  }

  async navigateTo(id) {
    await this.navigate(`${ENV.BASE_URL}/roleProfile/${id}`);
    await this.page.getByText('Role Name', { exact: true }).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async openTab(name) {
    await this.page.getByRole('tab', { name }).click();
    await this.page.waitForTimeout(800);
  }

  /** Clicks Edit to open the role's edit form (/addRole/{id}) with router state. */
  async clickEdit() {
    const link = this.page.locator('a[href*="addRole/"]').first();
    await link.waitFor({ state: 'visible', timeout: 15000 });
    await link.click();
    await this.page.waitForURL(/addRole\/\d+/, { timeout: 15000 });
  }

  /** Reads the value rendered after a field label (label <p> + next sibling). */
  async fieldValue(label) {
    return this.page.evaluate((lbl) => {
      for (const p of document.querySelectorAll('p')) {
        if (p.textContent.trim() === lbl) {
          const v = p.nextElementSibling;
          if (v) return v.textContent.trim();
        }
      }
      return null;
    }, label);
  }

  async verifyField(label, expected) {
    await expect.poll(() => this.fieldValue(label), { timeout: 15000 }).toBe(expected);
  }

  /** True if the given permission name is listed (granted) on the Role Details tab. */
  async hasPermission(name) {
    return (await this.page.getByText(name, { exact: true }).count()) > 0;
  }
}
