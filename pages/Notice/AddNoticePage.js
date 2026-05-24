import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';

export class AddNoticePage extends BasePage {
  constructor(page) {
    super(page);
    // File upload (hidden input, multiple, accepts image/*,.pdf)
    this.fileInput = page.locator('#file-upload');

    // Post-as + member selection
    this.postAsMemberRadio = page.locator('input[name="postAs"][value="Member"]');
    this.memberSelectTrigger = page.getByText(/Select a member\.\.\./).first();
    this.memberSearchInput = page.getByPlaceholder('Search members...');

    // Visibility (date range) — react-datepicker
    this.startDateInput = page.getByPlaceholder('Select Start Date');
    this.endDateInput = page.getByPlaceholder('Select End Date');

    // Labels
    this.labelDropdown = page.locator('.label-selector-dropdown');
    this.createNewLabelBtn = page.getByRole('button', { name: /Create New Label/i });
    this.newLabelInput = page.getByPlaceholder('Enter new label name...');
    this.addLabelBtn = page.getByRole('button', { name: /^Add$/ });

    // Priority — custom dropdown; default value is "Normal"
    this.priorityTrigger = page.getByText('Normal', { exact: true });

    // Tower / Unit selectors
    this.towerTrigger = page.getByText(/Select Towers/).first();
    this.allTowersCheckbox = page.getByText(/^All Towers$/).first();
    // Unit field label can read "Select Units" or stay "Select towers first" (stale) — both open it.
    this.unitTrigger = page.getByText(/Select Units|Select towers first/).first();
    this.doneBtn = page.getByRole('button', { name: /^Done$/ });

    // Submit + result
    this.sendBtn = page.getByRole('button', { name: /^Send$/ });
    this.successMessage = page.getByText(/success/i);
    this.okBtn = page.getByRole('button', { name: /^OK$/ });
  }

  /**
   * Attaches files in a single setInputFiles call (input is multiple).
   * @param {string[]} filePaths
   */
  async addAttachments(filePaths) {
    await this.fileInput.setInputFiles(filePaths);
  }

  /** Creates a new label and selects it. */
  async createAndAddLabel(labelName) {
    await this.labelDropdown.click();
    await this.createNewLabelBtn.click();
    await this.newLabelInput.fill(labelName);
    await this.addLabelBtn.click();
    // Confirm the new label is visible in the selector (chip + list both match → first)
    await expect(this.labelDropdown.getByText(labelName, { exact: false }).first()).toBeVisible({
      timeout: 10000,
    });
    await this.page.keyboard.press('Escape');
  }

  /** @param {'Urgent'|'High'|'Normal'|'Low'} level */
  async selectPriority(level) {
    // Open the priority dropdown (trigger shows current value, default "Normal").
    await this.priorityTrigger.click();
    await this.page.getByText(new RegExp(`^${level}$`)).first().click();
  }

  async selectPostAsMember() {
    // Radio is visually hidden (sr-only peer); force the interaction.
    await this.postAsMemberRadio.click({ force: true });
  }

  /**
   * Opens the member dropdown, searches, selects the first match.
   * @returns {Promise<string>} the selected member's full display name
   */
  async searchAndSelectMember(searchTerm) {
    await this.memberSelectTrigger.click();
    await this.memberSearchInput.fill(searchTerm);
    const option = this.page.getByText(new RegExp(`^${searchTerm} \\d+`)).first();
    await expect(option).toBeVisible({ timeout: 15000 });
    const name = (await option.innerText()).trim();
    await option.click();
    return name;
  }

  /**
   * Picks a date in the react-datepicker (custom header uses month + year selects).
   * @param {import('@playwright/test').Locator} inputLocator
   * @param {Date} date
   */
  async pickDate(inputLocator, date) {
    await inputLocator.click();
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

  async selectAllTowers() {
    await this.towerTrigger.click();
    await this.allTowersCheckbox.click();
    await this.doneBtn.click();
  }

  async selectAllUnits() {
    await this.unitTrigger.click();
    // Unit dropdown's select-all is a row labelled exactly "All".
    await this.page.getByText('All', { exact: true }).first().click();
    await this.doneBtn.click();
  }

  async send() {
    await this.sendBtn.click();
  }

  async verifySuccessAndConfirm() {
    await expect(this.successMessage).toBeVisible({ timeout: 30000 });
    if (await this.okBtn.count()) {
      await this.okBtn.first().click();
    }
  }

  /**
   * Full ongoing-notice creation flow.
   * Default date range spans from today + 2 days → the notice is Ongoing.
   * @param {{labelName:string, attachments:string[]}} data
   */
  async createOngoingNotice({ labelName, attachments }) {
    await this.addAttachments(attachments);
    await this.createAndAddLabel(labelName);
    await this.selectPriority('Urgent');
    await this.selectAllTowers();
    await this.selectAllUnits();
    await this.send();
    await this.verifySuccessAndConfirm();
  }

  /**
   * Member-targeted, scheduled (upcoming) notice flow.
   * @param {{memberSearch:string, labelName:string, attachments:string[],
   *          priority?:string, startDate:Date, endDate:Date}} data
   * @returns {Promise<string>} selected member display name
   */
  async createMemberNotice({ memberSearch, labelName, attachments, priority = 'High', startDate, endDate }) {
    await this.addAttachments(attachments);
    await this.selectPostAsMember();
    const member = await this.searchAndSelectMember(memberSearch);
    await this.createAndAddLabel(labelName);
    await this.selectPriority(priority);
    await this.pickDate(this.startDateInput, startDate);
    await this.pickDate(this.endDateInput, endDate);
    await this.selectAllTowers();
    await this.selectAllUnits();
    await this.send();
    await this.verifySuccessAndConfirm();
    return member;
  }
}
