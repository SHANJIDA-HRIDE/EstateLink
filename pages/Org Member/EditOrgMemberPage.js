import { expect } from '@playwright/test';
import { ENV } from '../../env/env.config';
import { AddMemberPage } from './AddMemberPage';

/**
 * Edits the "Organization Member" profile sections:
 *  - Login Credential email  -> /login-credential-edit/{id}
 *  - Member Type & Role       -> /MemberTypeAndRoleEdit/{id}
 *
 * Extends AddMemberPage to reuse the "Add New Role" modal flow (createNewRole /
 * selectRoleByName), since the Type/Role edit page hosts the same role widget.
 *
 * The Type/Role page only renders when reached by clicking its Edit link from a
 * list-navigated profile (it relies on router state); a direct URL load is blank.
 */
export class EditOrgMemberPage extends AddMemberPage {
  constructor(page) {
    super(page);
    // Login credential edit
    this.emailInput = page.locator('input[name="delivery_method"]');
    // Type/role edit
    this.typeRoleEditLink = page.locator('a[href*="MemberTypeAndRoleEdit"]');
    this.memberTypeRadios = page.locator('input[name="member_type"]');
    // Save + confirm
    this.updateBtn = page.getByRole('button', { name: /^Update$/ });
    this.okBtn = page.getByRole('button', { name: /^OK$/ });
    this.updateSuccess = page.getByText('Member updated successfully!');
  }

  // ---- Login credential (email) ----

  async navigateLoginCredential(id) {
    await this.navigate(`${ENV.BASE_URL}/login-credential-edit/${id}`);
    await this.emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await expect(this.emailInput).not.toHaveValue('', { timeout: 15000 }); // wait async load
  }

  /** Replaces the login credential email and saves. */
  async editEmail(newEmail) {
    await this.emailInput.fill(newEmail);
    await this.emailInput.blur(); // commit the value so Update enables
    await expect(this.updateBtn).toBeEnabled({ timeout: 10000 });
    await this.updateBtn.click();
    // Saves via a success dialog or a redirect — tolerate either.
    await this.okBtn.first().click({ timeout: 8000 }).catch(() => {});
    await this.page.waitForTimeout(1500);
  }

  // ---- Member type & role ----

  /**
   * Opens the Type/Role edit form via its Edit link. Caller must be on a
   * list-navigated profile, Organization Member tab.
   */
  async openTypeRoleEdit() {
    await this.typeRoleEditLink.waitFor({ state: 'visible', timeout: 15000 });
    await this.page.waitForTimeout(800); // let the tab/router settle before navigating
    await this.typeRoleEditLink.click();
    await this.memberTypeRadios.first().waitFor({ state: 'visible', timeout: 20000 });
    // Roles load asynchronously; wait for the always-present "Superadmin" option.
    await this.page.locator('label').filter({ hasText: /^Superadmin$/ }).first().waitFor({ state: 'visible', timeout: 20000 });
  }

  /**
   * Selects the Member Type ("Management" | "Property Staff") by clicking its text
   * label (the React-controlled radio doesn't flip on a force-check). Set this AFTER
   * the role list has settled, otherwise the async refetch resets the selection.
   */
  async setMemberType(type) {
    const value = type === 'Management' ? '1' : '2';
    await this.page.getByText(type, { exact: true }).first().click();
    await expect(this.page.locator(`input[name="member_type"][value="${value}"]`)).toBeChecked();
  }

  /**
   * Selects a role by name. Overrides the parent: on this page role checkboxes have
   * no name attribute, and they're React-controlled (flip on text-label click). The
   * just-created role appears at the list end after the ~12s refetch.
   */
  async selectRoleByName(name) {
    const cb = this.page.locator('label').filter({ hasText: name }).locator('input[type="checkbox"]');
    await cb.waitFor({ state: 'attached', timeout: 30000 });
    await this.page.getByText(name, { exact: true }).first().click();
    await expect(cb).toBeChecked();
  }

  /** Saves the type/role form and confirms the success dialog. */
  async saveTypeRole() {
    await expect(this.updateBtn).toBeEnabled({ timeout: 10000 });
    await this.updateBtn.click();
    await this.updateSuccess.waitFor({ state: 'visible', timeout: 20000 });
    await this.okBtn.first().click();
  }
}
