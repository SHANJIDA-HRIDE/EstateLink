import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

/**
 * Role list page (/role-list).
 * Table columns: Name | Description | Permissions | Status.
 * The table is search-driven: it shows skeleton rows (.animate-pulse) until a
 * search term is entered (or a status filter applied on a loaded set). The Status
 * filter is a checkbox dropdown (All/Active/Inactive) with a Done button.
 */
export class RoleListPage extends BasePage {
  constructor(page) {
    super(page);
    this.addRoleBtn = page.getByRole('button', { name: /^Add Role$/i });
    this.searchInput = page.locator('input[name="search"]');
    this.statusBtn = page.getByRole('button', { name: /Status/i });
    this.doneBtn = page.getByRole('button', { name: /^Done$/ });
    // Scope to the dropdown (a tooltip also uses .absolute.top-full) via its Done button.
    this.statusPanel = page.locator('div.absolute.top-full').filter({ has: page.getByRole('button', { name: /^Done$/ }) });
  }

  async navigateTo() {
    await this.navigate(`${ENV.BASE_URL}/role-list`);
    await this.verifyRoleListLoaded();
  }

  async clickAddRole() {
    await this.addRoleBtn.click();
  }

  async verifyRoleListLoaded() {
    await this.addRoleBtn.waitFor({ state: 'visible', timeout: 10000 });
  }

  async search(term) {
    await this.searchInput.fill(term);
  }

  /** Searches a role by name and returns its Status cell value (or null). */
  async statusOf(name) {
    await this.search(name);
    await this.waitForResults();
    const [row] = await this.rowCells();
    return row ? row[3] : null;
  }

  /** Searches for a role then opens its profile (/roleProfile/{id}). */
  async openRoleProfile(name) {
    await this.search(name);
    await this.waitForResults();
    await this.page.locator('table tbody tr:not(:has(.animate-pulse))').first().click();
    await this.page.waitForURL(/roleProfile\/\d+/, { timeout: 15000 });
  }

  /** Current non-skeleton rows as [name, description, permissions, status] tuples. */
  async rowCells() {
    return this.page.evaluate(() => {
      const trs = [...document.querySelectorAll('table tbody tr')].filter((tr) => !tr.querySelector('.animate-pulse'));
      return trs.map((tr) => [...tr.querySelectorAll('td')].map((c) => c.innerText.trim()));
    });
  }

  async rowCount() {
    return (await this.rowCells()).length;
  }

  /** Waits until the search/filter query resolves to at least one real row. */
  async waitForResults(timeout = 20000) {
    await expect.poll(() => this.rowCount(), { timeout }).toBeGreaterThan(0);
  }

  /** Count of current rows whose Name contains the term (case-insensitive). */
  async rowsMatchingName(term) {
    const rows = await this.rowCells();
    const t = term.toLowerCase();
    return rows.filter((r) => (r[0] || '').toLowerCase().includes(t)).length;
  }

  /** True if there is at least one row and every row's Status equals the given value. */
  async everyRowHasStatus(status) {
    const rows = await this.rowCells();
    return rows.length > 0 && rows.every((r) => r[3] === status);
  }

  /**
   * Applies the Status filter so that exactly `status` ("All"|"Active"|"Inactive")
   * is selected, then confirms with Done.
   */
  async applyStatus(status) {
    await this.statusBtn.first().click();
    await this.statusPanel.waitFor({ state: 'visible', timeout: 10000 });
    for (const opt of ['All', 'Active', 'Inactive']) {
      const label = this.statusPanel.locator('label').filter({ hasText: new RegExp(`^${opt}$`) });
      const checked = await label.locator('input').isChecked();
      if ((opt === status) !== checked) await label.click(); // toggle to desired state
    }
    await this.doneBtn.first().click();
  }
}
