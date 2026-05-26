import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

export class AddOwnerPage extends BasePage {
  constructor(page) {
    super(page);
    this.addNewMemberBtn = page.getByRole('button', { name: /Add New Member/i });
    this.addNewCompanyBtn = page.getByRole('button', { name: /Add New Company/i });
    this.companyNameInput = page.locator('input[name="company_name"]');
    this.memberNameInput = page.locator('input[name="full_name"]');
    this.memberEmailInput = page.locator('input[name="general_email"]');
    this.memberContactInput = page.locator('input[name="general_contact"]');
    this.nextBtn = page.getByRole('button', { name: /^Next$/i });
    this.submitBtn = page.getByRole('button', { name: /^Submit$/i });
    this.memberDrawerHeading = page.getByRole('heading', { name: /Add New Comm Member/i });
    this.selectedOwnerInput = page.getByPlaceholder('Enter Name');
    this.existingMemberRows = page.locator('main').getByRole('listitem');
    this.ownershipPercentageInput = page.locator('input[name="owners.0.ownershipPercentage"]');
    this.ownershipPercentageInputs = page.locator('input[name^="owners."][name$=".ownershipPercentage"]');
    this.transferFromInput = page.getByPlaceholder('Search owner...');
    this.ownershipDateInput = page.locator('input[placeholder*="Select date of ownership"]').first();
    this.ownershipDateInputs = page.locator('input[placeholder*="Select date of ownership"]');
    this.addOwnershipSectionBtn = page
      .locator('h4', { hasText: '1st Ownership Details' })
      .locator('..')
      .getByRole('button');
    this.saveBtn = page.locator('button[type="submit"]').filter({ hasText: /^Save$/i });
    this.creatingOwnersBtn = page.getByRole('button', { name: /Creating Owners/i });
    this.successMessage = page.getByText(/successfully/i);
    this.okBtn = page.getByRole('button', { name: /^OK$/i });
    this.percentageTotalError = page.getByText(/Total ownership percentage must be exactly 100%/i);
  }

  async navigateToAddOwner(unitId) {
    await this.navigate(`${ENV.BASE_URL}/unit/${unitId}/add-owner`);
  }

  /**
   * Adds a new Company as owner via the company drawer (a modal whose Next/Submit are
   * <input type="button"> controls, not <button>s). On submit the drawer closes and
   * the company becomes the selected owner; ownership %/date are filled afterwards.
   */
  async addNewCompany(companyData, ownerIndex = 0) {
    await this.addNewCompanyBtn.first().click();
    await this.companyNameInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.companyNameInput.fill(companyData.name);
    await this.memberEmailInput.fill(companyData.email);
    await this.memberContactInput.fill(companyData.contact);
    await this.page.locator('input[type="button"][value="Next"]').click();
    await this.page.locator('input[value="Submit"]').click();
    await expect(this.selectedOwnerInput.nth(ownerIndex)).toHaveValue(companyData.name);
  }

  /** Uploads an ownership document (the add-owner form's file input). */
  async uploadOwnershipDocument(filePath) {
    await this.page.locator('input[type="file"]').last().setInputFiles(filePath);
  }

  async addNewMember(memberData, ownerIndex = 0) {
    await this.addNewMemberBtn.click();
    await this.memberNameInput.fill(memberData.name);
    await this.memberEmailInput.fill(memberData.email);
    await this.memberContactInput.fill(memberData.contact);
    await this.nextBtn.click();
    await this.submitBtn.click();
    await expect(this.memberDrawerHeading).toBeHidden({ timeout: 15000 });
    await expect(this.selectedOwnerInput.nth(ownerIndex)).toHaveValue(memberData.name);
  }

  async searchAndSelectExistingMember(searchTerm, ownerIndex = 0) {
    const ownerInput = this.selectedOwnerInput.nth(ownerIndex);

    await ownerInput.click();
    await ownerInput.fill(searchTerm);

    const memberRow = this.existingMemberRows.filter({ hasText: searchTerm }).first();
    await expect(memberRow).toBeVisible({ timeout: 15000 });
    await memberRow.click();

    await expect(ownerInput).not.toHaveValue(searchTerm);
    return await ownerInput.inputValue();
  }

  async addOwnershipSection(ownerIndex) {
    await this.addOwnershipSectionBtn.click();
    await expect(this.selectedOwnerInput.nth(ownerIndex)).toBeVisible({ timeout: 10000 });
    await expect(this.addNewMemberBtn).toBeEnabled();
  }

  async fillOwnershipDetails({ percentage = '100', day = String(new Date().getDate()), ownerIndex = 0 } = {}) {
    await this.page.locator(`input[name="owners.${ownerIndex}.ownershipPercentage"]`).fill(percentage.toString());

    const ownershipDateInput = this.ownershipDateInputs.nth(ownerIndex);
    await ownershipDateInput.click();
    await this.page.getByText(new RegExp(`^${day}$`)).last().click();
    await expect(ownershipDateInput).not.toHaveValue('');
  }

  async addMultipleNewOwners(owners) {
    for (const [index, owner] of owners.entries()) {
      if (index > 0) {
        await this.addOwnershipSection(index);
      }

      await this.addNewMember(owner.memberData, index);
      await this.fillOwnershipDetails({
        percentage: owner.percentage,
        ownerIndex: index,
      });
    }
  }

  async changeOwnershipToNewMember(memberData, { percentage = '10', day = String(new Date().getDate()) } = {}) {
    await this.addNewMember(memberData);

    const transferFromInput = this.transferFromInput.last();
    if ((await transferFromInput.inputValue()) === '') {
      await transferFromInput.click();
      const currentOwnerOption = this.page.locator('main').getByText(/Ownership:\s*\d/i).first();
      await expect(currentOwnerOption).toBeVisible({ timeout: 10000 });
      await currentOwnerOption.click({ force: true });
      await expect(transferFromInput).not.toHaveValue('');
    }

    const ownershipPercentageInput = this.ownershipPercentageInputs.last();
    await ownershipPercentageInput.fill(percentage.toString());

    const ownershipDateInput = this.ownershipDateInputs.last();
    await ownershipDateInput.click();
    await this.page.getByText(new RegExp(`^${day}$`)).last().click();
    await expect(ownershipDateInput).not.toHaveValue('');
  }

  async saveOwner() {
    await this.saveBtn.click();
    await expect(this.creatingOwnersBtn).toBeHidden({ timeout: 45000 });
    await expect(this.successMessage).toBeVisible({ timeout: 45000 });
    await this.okBtn.click();
  }

  async saveOwnerAndVerifyPercentageTotalError(expectedTotal) {
    await this.saveBtn.click();
    await expect(
      this.page.getByText(`Total ownership percentage must be exactly 100%. Current total: ${expectedTotal}%`),
    ).toBeVisible({ timeout: 15000 });
  }

  /** Saves and asserts the duplicate-email server error. */
  async saveOwnerAndVerifyDuplicateEmail() {
    await this.saveBtn.click();
    await expect(
      this.page.getByText(/This email address is already in use/i).first(),
    ).toBeVisible({ timeout: 15000 });
  }

  /** Saves and asserts the per-owner percentage range error (e.g. for 0% or >100%). */
  async saveOwnerAndVerifyPercentageRangeError() {
    await this.saveBtn.click();
    await expect(
      this.page.getByText(/Each ownership percentage must be greater than 0 and less than or equal to 100%/i).first(),
    ).toBeVisible({ timeout: 15000 });
  }
}
