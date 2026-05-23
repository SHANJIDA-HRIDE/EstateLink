import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';

export class AddAnnouncementPage extends BasePage {
  constructor(page) {
    super(page);
    // Core fields
    this.titleInput = page.locator('input[name="title"]');
    this.descriptionInput = page.locator('textarea[name="description"]');
    this.fileInput = page.locator('#file-upload'); // hidden, multiple

    // Post-as + member selection
    this.postAsMemberRadio = page.locator('input[name="postAs"][value="Member"]');
    this.memberSelectTrigger = page.getByText(/Select a member\.\.\./).first();
    this.memberSearchInput = page.getByPlaceholder('Search members...');

    // Visibility (date range) — react-datepicker
    this.startDateInput = page.getByPlaceholder('Select Start Date');
    this.endDateInput = page.getByPlaceholder('Select End Date');

    // Time controls (custom dropdown; 5-minute granularity). DOM order: start, end.
    this.timeTriggers = page
      .locator('div.cursor-pointer')
      .filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
    this.startTimeTrigger = this.timeTriggers.nth(0);
    this.endTimeTrigger = this.timeTriggers.nth(1);

    // Labels
    this.labelDropdown = page.locator('.label-selector-dropdown');
    this.createNewLabelBtn = page.getByRole('button', { name: /Create New Label/i });
    this.newLabelInput = page.getByPlaceholder('Enter new label name...');
    this.addLabelBtn = page.getByRole('button', { name: /^Add$/ });

    // Tower / Unit selectors
    this.towerTrigger = page.getByText(/Select Towers/).first();
    this.allTowersOption = page.getByText(/^All Towers$/).first();
    this.unitTrigger = page.getByText(/Select Units/).first();
    this.doneBtn = page.getByRole('button', { name: /^Done$/ });

    // Submit + result
    this.sendBtn = page.getByRole('button', { name: /^Send$/ });
    this.successMessage = page.getByText(/success/i);
    this.okBtn = page.getByRole('button', { name: /^OK$/ });
    this.endBeforeStartError = page.getByText(/End date\/time must be after start date\/time/i);
  }

  async fillTitle(title) {
    await this.titleInput.fill(title);
  }

  async fillDescription(description) {
    await this.descriptionInput.fill(description);
  }

  /**
   * Attaches files in a single setInputFiles call (input is multiple).
   * @param {string[]} filePaths
   */
  async addAttachments(filePaths) {
    await this.fileInput.setInputFiles(filePaths);
  }

  /** Creates a new label and adds (selects) it. */
  async createAndAddLabel(labelName) {
    await this.labelDropdown.click();
    await this.createNewLabelBtn.click();
    await this.newLabelInput.fill(labelName);
    await this.addLabelBtn.click();
    // The new label is auto-added; confirm it shows in the label field.
    await expect(this.labelDropdown.getByText(labelName, { exact: false })).toBeVisible({
      timeout: 10000,
    });
    await this.page.keyboard.press('Escape');
  }

  /** @param {'Urgent'|'High'|'Normal'|'Low'} level */
  async selectPriority(level) {
    // Open the priority dropdown (its trigger shows the current value, default "Normal").
    await this.page.getByText(/^Normal$/).first().click();
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
   * Picks a date in a react-datepicker, navigating months as needed.
   * @param {import('@playwright/test').Locator} inputLocator
   * @param {Date} date
   */
  async pickDate(inputLocator, date) {
    await inputLocator.click();
    const dp = this.page.locator('.react-datepicker').first();
    await dp.waitFor({ state: 'visible', timeout: 10000 });

    // Custom header uses month + year <select>s — jump directly (handles any month).
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
   * Picks a time in the custom time dropdown (Hour / Minute / Period buttons).
   * NOTE: minute list is 5-minute granular — date.getMinutes() must be a multiple of 5.
   * @param {import('@playwright/test').Locator} triggerLocator
   * @param {Date} date
   */
  async pickTime(triggerLocator, date) {
    await triggerLocator.click();
    const panel = this.page.locator('div.absolute.z-50').last();
    await panel.waitFor({ state: 'visible', timeout: 10000 });

    let hour = date.getHours();
    const period = hour >= 12 ? 'PM' : 'AM';
    let hour12 = hour % 12;
    if (hour12 === 0) hour12 = 12;
    const minute = String(date.getMinutes()).padStart(2, '0');

    await panel.getByRole('button', { name: String(hour12), exact: true }).click();
    await panel.getByRole('button', { name: minute, exact: true }).click();
    await panel.getByRole('button', { name: period, exact: true }).click();
    // Commit by clicking outside the panel (Escape does not propagate the value).
    await this.titleInput.click();
    await expect(panel).toBeHidden({ timeout: 5000 });
  }

  async selectAllTowers() {
    await this.towerTrigger.click();
    await this.allTowersOption.click();
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
   * Full ongoing-announcement creation flow.
   * @param {{title:string, description:string, labelName:string, attachments:string[]}} data
   */
  async createOngoingAnnouncement({ title, description, labelName, attachments }) {
    await this.fillTitle(title);
    await this.fillDescription(description);
    await this.addAttachments(attachments);
    await this.createAndAddLabel(labelName);
    await this.selectPriority('Urgent');
    await this.selectAllTowers();
    await this.selectAllUnits();
    await this.send();
    await this.verifySuccessAndConfirm();
  }

  /**
   * Member-targeted, scheduled (upcoming) announcement flow.
   * @param {{title:string, description:string, memberSearch:string,
   *          priority?:string, startDate:Date, endDate:Date}} data
   * @returns {Promise<string>} selected member display name
   */
  async createMemberAnnouncement({ title, description, memberSearch, labelName, attachments = [], priority = 'High', startDate, endDate }) {
    await this.fillTitle(title);
    await this.fillDescription(description);
    if (attachments.length) {
      await this.addAttachments(attachments);
    }
    await this.selectPostAsMember();
    const member = await this.searchAndSelectMember(memberSearch);
    await this.createAndAddLabel(labelName); // Labels is a required field
    await this.selectPriority(priority);
    await this.pickDate(this.startDateInput, startDate);
    await this.pickDate(this.endDateInput, endDate);
    await this.selectAllTowers();
    await this.selectAllUnits();
    await this.send();
    await this.verifySuccessAndConfirm();
    return member;
  }

  /**
   * Attempts a SAME-DAY expiry window (end date = today, end time later than start)
   * and asserts it is rejected.
   *
   * KNOWN DEFECT: the End-Time picker updates its own display but never propagates
   * to the form model, so the form treats end-time == start-time. With end date =
   * start date this yields end == start and Send is blocked with
   * "End date/time must be after start date/time". This test guards that behavior;
   * once the End-Time picker is fixed it should be converted to a real
   * Ongoing -> Expired transition test.
   * @param {{title:string, description:string, labelName:string, endDateTime:Date}} data
   */
  async attemptSameDayExpiryExpectingError({ title, description, labelName, endDateTime }) {
    await this.fillTitle(title);
    await this.fillDescription(description);
    await this.createAndAddLabel(labelName); // required field
    await this.selectAllTowers();
    await this.selectAllUnits();
    // Keep start at defaults (today / now). Try to set end to later today.
    await this.pickDate(this.endDateInput, endDateTime);
    await this.pickTime(this.endTimeTrigger, endDateTime);
    await this.send();
    await expect(this.endBeforeStartError).toBeVisible({ timeout: 15000 });
    await expect(this.successMessage).toBeHidden();
  }
}
