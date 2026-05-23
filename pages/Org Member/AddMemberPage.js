import { BasePage } from '../Base/BasePage';

export class AddMemberPage extends BasePage {
  constructor(page) {
    super(page);
    this.fullNameInput = page.locator('input[name="full_name"]');
    this.emailInput = page.locator('input[name="general_email"]');
    this.contactInput = page.locator('input[name="general_contact"]');
    
    // Step 2 locators
    this.memberTypeManagement = page.locator('input[name="member_type"][value="1"]');
    this.memberRoleFirst = page.locator('input[name="members_role"]').first();

    this.nextButton = page.getByRole('button', { name: /Next/i });
    this.submitButton = page.getByRole('button', { name: /Submit/i });
    
    // Success dialog locators
    this.successMessage = page.getByText('Member created successfully!');
    this.okButton = page.getByRole('button', { name: 'OK' });
  }

  async fillGeneralInfo(name, email, contact) {
    await this.fullNameInput.fill(name);
    await this.emailInput.fill(email);
    await this.contactInput.fill(contact);
  }

  async selectRoleAndType() {
    await this.memberTypeManagement.click();
    await this.memberRoleFirst.click();
  }

  async clickNext() {
    await this.nextButton.click();
  }

  async clickSubmit() {
    await this.submitButton.click();
  }

  async handleSuccessDialog() {
    await this.successMessage.waitFor({ state: 'visible', timeout: 15000 });
    await this.okButton.click();
    await this.successMessage.waitFor({ state: 'hidden' });
  }
}
