import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

/**
 * Members List page (/member-list).
 * Table columns: Name | Contact | Email | Type | Role | Status.
 * Filters: "Role" and "Member Type" are dropdown buttons; each opens a checkbox
 * panel (absolute.top-full) with options + Done/Clear. The Role options load
 * asynchronously (~6s) from a separate request, so filterByRole waits for them.
 */
export class MemberListPage extends BasePage {
  constructor(page) {
    super(page);
    this.addMemberBtn = page.getByRole('button', { name: /Add Member/i });
    this.searchInput = page.locator('input[placeholder*="Search List"]');

    // Filter dropdown triggers.
    this.roleFilterBtn = page.getByRole('button', { name: /^Role$/ });
    this.memberTypeFilterBtn = page.getByRole('button', { name: /^Member Type$/ });

    // The open dropdown panel (only one is open at a time).
    this.menu = page.locator('div.absolute.top-full');
  }

  async navigateTo() {
    await this.navigate(`${ENV.BASE_URL}/member-list`);
    await this.addMemberBtn.waitFor({ state: 'visible', timeout: 10000 });
  }

  async clickAddMember() {
    await this.addMemberBtn.click();
  }

  async searchMember(name) {
    await this.searchInput.fill(name);
  }

  /** Selects a Member Type ("Management" | "Property Staff" | "All") and applies it. */
  async filterByMemberType(type) {
    await this.memberTypeFilterBtn.click();
    await this.menu.locator('label').filter({ hasText: new RegExp(`^${type}$`) }).first().click();
    await this.menu.getByRole('button', { name: /^Done$/ }).click();
  }

  /** Selects a Role by name and applies it. Waits for the async role options to load. */
  async filterByRole(roleName) {
    await this.roleFilterBtn.click();
    // Roles load from a separate request (~6s) — only "All" exists until then.
    await expect.poll(() => this.menu.locator('label').count(), { timeout: 20000 }).toBeGreaterThan(1);
    await this.menu.locator('label').filter({ hasText: new RegExp(`^${roleName}$`) }).first().click();
    await this.menu.getByRole('button', { name: /^Done$/ }).click();
  }

  /** Reads the current page's data rows into [{name, contact, email, type, role, status}]. */
  async rowCells() {
    return this.page.evaluate(() => {
      const out = [];
      for (const tr of document.querySelectorAll('table tr')) {
        const cells = [...tr.querySelectorAll('td')];
        if (cells.length < 6) continue; // skip the header row (uses <th>)
        out.push({
          name: cells[0].innerText.trim(),
          contact: cells[1].innerText.trim(),
          email: cells[2].innerText.trim(),
          type: cells[3].innerText.trim(),
          role: cells[4].innerText.trim(),
          status: cells[5].innerText.trim(),
        });
      }
      return out;
    });
  }

  async rowCount() {
    return (await this.rowCells()).length;
  }

  /** Waits until the table has rendered at least one data row. */
  async waitForRows(timeout = 15000) {
    await expect.poll(() => this.rowCount(), { timeout }).toBeGreaterThan(0);
  }

  /** Count of current rows whose Name contains the term (case-insensitive). */
  async rowsMatchingName(term) {
    const rows = await this.rowCells();
    const t = term.toLowerCase();
    return rows.filter((r) => r.name.toLowerCase().includes(t)).length;
  }

  /** True if there is at least one row and every row's Type equals the given type. */
  async everyRowHasType(type) {
    const rows = await this.rowCells();
    return rows.length > 0 && rows.every((r) => r.type === type);
  }

  /** True if there is at least one row and every row's Role cell contains the role. */
  async everyRowRoleContains(role) {
    const rows = await this.rowCells();
    return rows.length > 0 && rows.every((r) => r.role.includes(role));
  }

  /** Searches for a member then opens their profile (/member-profile/{id}). */
  async openMemberProfile(name) {
    await this.searchMember(name);
    await this.waitForRows();
    await this.page.locator('table tr td:first-child').filter({ hasText: name }).first().click();
    await this.page.waitForURL(/member-profile\/\d+/, { timeout: 15000 });
  }

  getMemberLocator(name) {
    return this.page.getByText(name, { exact: false }).first();
  }

  /**
   * Web-first assertion: expect() re-resolves the locator on every poll, so it
   * tolerates the list re-rendering/detaching during async load.
   */
  async verifyMemberVisible(name) {
    await expect(this.getMemberLocator(name)).toBeVisible({ timeout: 15000 });
  }
}
