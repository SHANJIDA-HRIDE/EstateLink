import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';

export class AddMemberPage extends BasePage {
  constructor(page) {
    super(page);
    this.fullNameInput = page.locator('input[name="full_name"]');
    this.emailInput = page.locator('input[name="general_email"]');
    this.contactInput = page.locator('input[name="general_contact"]');

    // Step 1 optional fields
    this.nidInput = page.locator('input[name="nid_number"]');
    this.permanentAddressInput = page.locator('input[name="permanent_address"]');
    this.presentAddressInput = page.locator('input[name="present_address"]');
    this.occupationInput = page.locator('input[name="occupation"]');
    this.descriptionInput = page.locator('textarea[name="about_us"]');
    this.facebookInput = page.locator('input[name="facebook_profile"]');
    this.linkedinInput = page.locator('input[name="linkedin_profile"]');
    this.dobInput = page.locator('input[placeholder*="date of birth" i]');
    // Custom dropdown triggers — the clickable is the `.login-field-input` div next to
    // each field's <label>. (Targeting placeholder text breaks on the edit page, where
    // the trigger shows the current value and the placeholder is the <label>.)
    this.maritalTrigger = page.locator('.login-field:has(label[for="marital_status"]) .login-field-input');
    this.religionTrigger = page.locator('.login-field:has(label[for="religion"]) .login-field-input');
    // File inputs (image/jpeg,png,jpg)
    this.photoInput = page.locator('#photo');
    this.nidFrontInput = page.locator('#nid_front');
    this.nidBackInput = page.locator('#nid_back');

    // Step 2 locators
    this.memberTypeManagement = page.locator('input[name="member_type"][value="1"]');
    this.memberRoleFirst = page.locator('input[name="members_role"]').first();

    this.nextButton = page.getByRole('button', { name: /Next/i });
    this.submitButton = page.getByRole('button', { name: /Submit/i });
    
    // Success dialog locators
    this.successMessage = page.getByText('Member created successfully!');
    this.okButton = page.getByRole('button', { name: 'OK' });

    // Notification bell (top-right)
    this.notificationBell = page.getByRole('button', { name: 'Notifications' });

    // Validation messages
    this.invalidEmailError = page.getByText('Invalid email format');
    this.duplicateEmailError = page.getByText(/This email address is already in use/i);
    this.fileRejectError = page.getByText('Only JPG, JPEG, PNG files under 5MB are allowed.');

    // Community member ("Add Community Member") flow
    this.addCommunityMemberBtn = page.getByRole('button', { name: /Add Community Member/i });
    this.communityAddBtn = page.getByRole('button', { name: /^Add$/ });

    // Step 2 — Member Role + inline "Add New Role" modal
    this.addNewRoleBtn = page.getByRole('button', { name: /Add New Role/i });
    this.roleNameInput = page.locator('[role="dialog"] input[name="role_name"]');
    this.roleDescInput = page.locator('[role="dialog"] textarea[name="role_description"]');
    this.createRoleBtn = page.getByRole('button', { name: /Create Role/i });
    this.okButtonAny = page.getByRole('button', { name: /^OK$/i });
  }

  /** Opens the "Add Community Member" panel (existing community members list). */
  async openCommunityMemberPanel() {
    await this.addCommunityMemberBtn.click();
    await this.communityAddBtn.first().waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Reads the first community row {name, contact, email, type, tower, floor, unit} from the panel. */
  async firstCommunityMember() {
    return this.page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Add');
      if (!btn) return null;
      let el = btn;
      for (let i = 0; i < 6 && el.parentElement; i++) {
        el = el.parentElement;
        if (el.tagName === 'TR') break;
      }
      const td = [...el.querySelectorAll('td')].map((t) => t.innerText.trim());
      return { name: td[0], contact: td[1], email: td[2], type: td[3], tower: td[4], floor: td[5], unit: td[6] };
    });
  }

  /** Selects the first community member — pre-fills the General Information form with their data. */
  async selectFirstCommunityMember() {
    await this.communityAddBtn.first().click();
  }

  /** Asserts the General Information form is pre-filled with the given values. */
  async verifyGeneralInfoPrefilled({ name, email, contact }) {
    await expect(this.fullNameInput).toHaveValue(name);
    await expect(this.emailInput).toHaveValue(email);
    await expect(this.contactInput).toHaveValue(contact);
  }

  async fillGeneralInfo(name, email, contact) {
    await this.fullNameInput.fill(name);
    await this.emailInput.fill(email);
    await this.contactInput.fill(contact);
  }

  /** Selects gender by its radio value (Male|Female|Other); radio is visually hidden. */
  async selectGender(gender) {
    await this.page.locator(`input[name="gender"][value="${gender}"]`).click({ force: true });
  }

  /** Opens the Marital Status dropdown and picks an option (Single|Married|Divorced|Widowed). */
  async selectMaritalStatus(value) {
    await this.maritalTrigger.click();
    await this.page.getByText(value, { exact: true }).first().click();
  }

  /** Opens the Religion dropdown and picks an option (Islam|Christianity|Hinduism|Buddhism|Judaism|Other). */
  async selectReligion(value) {
    await this.religionTrigger.click();
    await this.page.getByText(value, { exact: true }).first().click();
  }

  /** Picks a Date of Birth in the react-datepicker (month/year selects + day cell). */
  async pickDob(date) {
    await this.dobInput.click();
    const dp = this.page.locator('.react-datepicker').first();
    await dp.waitFor({ state: 'visible', timeout: 10000 });
    const monthName = date.toLocaleString('en-US', { month: 'long' });
    await dp.locator('select').nth(0).selectOption({ label: monthName });
    await dp.locator('select').nth(1).selectOption({ label: String(date.getFullYear()) });
    const dd = String(date.getDate()).padStart(3, '0');
    await dp
      .locator(`.react-datepicker__day--${dd}:not(.react-datepicker__day--outside-month):not(.react-datepicker__day--disabled)`)
      .first()
      .click();
  }

  /**
   * Fills every optional General-Information field present on the data object.
   * Each key is optional; only provided values are filled/uploaded.
   */
  async fillOptionalInfo(d) {
    if (d.nidNumber) await this.nidInput.fill(d.nidNumber);
    if (d.permanentAddress) await this.permanentAddressInput.fill(d.permanentAddress);
    if (d.presentAddress) await this.presentAddressInput.fill(d.presentAddress);
    if (d.occupation) await this.occupationInput.fill(d.occupation);
    if (d.description) await this.descriptionInput.fill(d.description);
    if (d.facebook) await this.facebookInput.fill(d.facebook);
    if (d.linkedin) await this.linkedinInput.fill(d.linkedin);
    if (d.gender) await this.selectGender(d.gender);
    if (d.maritalStatus) await this.selectMaritalStatus(d.maritalStatus);
    if (d.religion) await this.selectReligion(d.religion);
    if (d.dob) await this.pickDob(d.dob);
    if (d.photo) await this.photoInput.setInputFiles(d.photo);
    if (d.nidFront) await this.nidFrontInput.setInputFiles(d.nidFront);
    if (d.nidBack) await this.nidBackInput.setInputFiles(d.nidBack);
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

  /** Selects the Member Type radio ("Management" | "Property Staff"). */
  async selectMemberType(type) {
    const value = type === 'Management' ? '1' : '2';
    await this.page.locator(`input[name="member_type"][value="${value}"]`).check({ force: true });
  }

  /** Waits for the Member Role checkbox list to finish its (async) load. */
  async waitForRoleListLoaded() {
    await this.page.waitForFunction(
      () => document.querySelectorAll('label input[name="members_role"]').length > 1,
      null,
      { timeout: 25000 },
    );
  }

  /**
   * Opens the "Add New Role" modal, fills name/description, selects ALL permissions
   * (one "All" checkbox per category), creates the role, and confirms the dialog.
   */
  async createNewRole(name, description) {
    await this.addNewRoleBtn.click();
    await this.roleNameInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.roleNameInput.fill(name);
    await this.roleDescInput.fill(description);
    const dlg = this.page.locator('[role="dialog"]').first();
    for (const all of await dlg.locator('label').filter({ hasText: /^All$/ }).all()) {
      await all.click();
    }
    await this.createRoleBtn.click();
    await this.okButtonAny.first().waitFor({ state: 'visible', timeout: 30000 });
    await this.okButtonAny.first().click();
  }

  /**
   * Selects a role by name from the Member Role list. The list refetches a few
   * seconds after inline creation, appending the new role at the bottom — so this
   * waits for the checkbox to attach before checking it.
   */
  async selectRoleByName(name) {
    const cb = this.page.locator('label').filter({ hasText: name }).locator('input[name="members_role"]');
    await cb.waitFor({ state: 'attached', timeout: 30000 });
    await cb.scrollIntoViewIfNeeded();
    await cb.check({ force: true });
    await expect(cb).toBeChecked();
  }

  /** Submits the wizard and confirms the success dialog, landing back on the member list. */
  async submitAndConfirm() {
    await this.submitButton.click();
    await this.okButtonAny.first().waitFor({ state: 'visible', timeout: 30000 });
    await this.okButtonAny.first().click();
    await this.page.waitForURL(/member-list/, { timeout: 20000 });
  }

  async handleSuccessDialog() {
    await this.successMessage.waitFor({ state: 'visible', timeout: 15000 });
    await this.okButton.click();
    await this.successMessage.waitFor({ state: 'hidden' });
  }

  /**
   * Opens the notification bell and asserts the "New Organization Member Added"
   * entry plus its "New organization member added - <memberName>" body
   * (triggered when a member is created).
   */
  async verifyNewMemberNotification(memberName) {
    await this.notificationBell.click();
    await expect(
      this.page.getByText(/New Organization Member Added/i).first(),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      this.page
        .getByText(new RegExp(`New organization member added\\s*[-–]?\\s*${memberName}`, 'i'))
        .first(),
    ).toBeVisible({ timeout: 10000 });
  }
}
