import { expect } from '@playwright/test';
import { ENV } from '../../env/env.config';
import { AddMemberPage } from './AddMemberPage';

/**
 * General Information edit page (/general-information-edit/{id}).
 * Reuses AddMemberPage's field locators/fillers (identical input names); the only
 * differences are the "Update" submit button and the "Member updated successfully!"
 * confirmation dialog.
 */
export class EditMemberGeneralPage extends AddMemberPage {
  constructor(page) {
    super(page);
    this.updateButton = page.getByRole('button', { name: /^Update$/ });
    this.updateSuccess = page.getByText('Member updated successfully!');
  }

  async navigateTo(id) {
    await this.navigate(`${ENV.BASE_URL}/general-information-edit/${id}`);
    await this.fullNameInput.waitFor({ state: 'visible', timeout: 15000 });
    // The form fetches the member's data asynchronously and populates the fields
    // after mount; wait for that load to finish so our edits aren't overwritten.
    await expect(this.fullNameInput).not.toHaveValue('', { timeout: 15000 });
  }

  /** Overwrites required + every optional General Information field from the data object. */
  async fillAll(data) {
    await this.fillGeneralInfo(data.name, data.email, data.contact);
    await this.fillOptionalInfo(data);
  }

  /** Clicks Update and confirms the success dialog. */
  async update() {
    await this.updateButton.click();
    await this.updateSuccess.waitFor({ state: 'visible', timeout: 20000 });
    await this.okButton.click();
  }
}
