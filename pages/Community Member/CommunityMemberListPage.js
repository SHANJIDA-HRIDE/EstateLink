import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

/**
 * Community Members list (/community-member-list).
 * Table columns: Name | Contact | Email | Type | Tower | Unit | Status.
 * The search input only narrows by Name or Email (placeholder hints so) — typing
 * a contact number returns no rows. Two inputs share the placeholder (mobile +
 * desktop), so the visible one is targeted explicitly.
 */
export class CommunityMemberListPage extends BasePage {
  constructor(page) {
    super(page);
    this.searchInput = page
      .locator('input[placeholder="Search name or email…"]')
      .locator('visible=true')
      .first();
    this.emptyState = page.getByText(/No (Community )?Members? Found/i);
    // After a non-default selection the trigger may show "Member Type (1)" or similar.
    this.memberTypeBtn = page.getByRole('button', { name: /^Member Type\b/ });
    this.statusFilterBtn = page.getByRole('button', { name: /^Status$/ });
    // The dropdown panel: an absolute-positioned div containing the Owner option
    // (a hidden tooltip also has the .absolute.top-full class — disambiguate by
    // visibility + content).
    this.menu = page
      .locator('div.absolute')
      .filter({ has: page.locator('label', { hasText: /^Owner$/ }) })
      .locator('visible=true')
      .first();
  }

  async navigateTo() {
    await this.navigate(`${ENV.BASE_URL}/community-member-list`);
    await expect(this.searchInput).toBeVisible({ timeout: 15000 });
    // Wait for at least one populated row (table renders skeletons first).
    await this.page.waitForFunction(() => {
      const tr = document.querySelector('table tbody tr');
      if (!tr) return false;
      const tds = tr.querySelectorAll('td');
      return tds.length > 1 && tds[1].innerText.trim().length > 0;
    }, null, { timeout: 25000 });
  }

  async search(term) {
    await this.searchInput.fill(term);
  }

  async clearSearch() {
    await this.searchInput.fill('');
  }

  /** Reads visible data rows into [{name, contact, email, type, tower, unit, status}]. */
  async rowCells() {
    return this.page.evaluate(() => {
      const out = [];
      for (const tr of document.querySelectorAll('table tbody tr')) {
        const cells = [...tr.querySelectorAll('td')].map((c) => c.innerText.trim());
        if (cells.length < 7) continue;
        const [name, contact, email, type, tower, unit, status] = cells;
        if (!name || name === '—') continue;
        // Skip placeholder/empty rows (no email yet).
        if (!email || !email.includes('@')) continue;
        out.push({ name, contact, email, type, tower, unit, status });
      }
      return out;
    });
  }

  async rowCount() {
    return (await this.rowCells()).length;
  }

  async waitForRows(timeout = 15000) {
    await expect.poll(() => this.rowCount(), { timeout }).toBeGreaterThan(0);
  }

  async waitForNoRows(timeout = 15000) {
    await expect.poll(() => this.rowCount(), { timeout }).toBe(0);
  }

  /**
   * True if every row's Name OR Email contains term (case-insensitive).
   * The community-member search filters by either field, so per-row matches
   * may land in name or email.
   */
  async everyRowNameOrEmailContains(term) {
    const rows = await this.rowCells();
    const t = term.toLowerCase();
    return (
      rows.length > 0 &&
      rows.every((r) => r.name.toLowerCase().includes(t) || r.email.toLowerCase().includes(t))
    );
  }

  /** Opens the Member Type dropdown panel. */
  async openMemberTypeMenu() {
    await this.memberTypeBtn.click();
    await this.menu.waitFor({ state: 'visible', timeout: 5000 });
  }

  /** Reads the Member Type option labels (in order). */
  async memberTypeOptions() {
    if (!(await this.menu.isVisible().catch(() => false))) {
      await this.openMemberTypeMenu();
    }
    return this.menu.locator('label').allInnerTexts();
  }

  /**
   * Selects a Member Type ("All" | "Owner" | "Resident" | "Resident (Tenant)" |
   * "Staff") and applies it. Closes the menu via Done if present.
   */
  async filterByMemberType(option) {
    await this.openMemberTypeMenu();
    await this.menu
      .locator('label')
      .filter({ hasText: new RegExp(`^${option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) })
      .first()
      .click();
    const done = this.page.getByRole('button', { name: /^(Done|Apply)$/ });
    if (await done.isVisible({ timeout: 1000 }).catch(() => false)) await done.click();
    // Wait for the panel to close so subsequent reads see the filtered table.
    await this.menu.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  /** True if there is at least one row and every row's Type equals the given type. */
  async everyRowHasType(type) {
    const rows = await this.rowCells();
    return rows.length > 0 && rows.every((r) => r.type === type);
  }

  /** Picks an existing row's name to use as a search seed. */
  async firstRowName() {
    const rows = await this.rowCells();
    return rows[0]?.name || '';
  }

  async firstRowContact() {
    const rows = await this.rowCells();
    return rows[0]?.contact || '';
  }

  /** Returns the first row whose Type matches the given value. */
  async firstRowOfType(type) {
    const rows = await this.rowCells();
    return rows.find((r) => r.type === type) || null;
  }

  /**
   * Searches by a unique email and polls until a row with that email appears
   * (optionally with the expected Type). Returns the matching row.
   */
  async waitForMemberByEmail(email, { type } = {}, timeout = 30000) {
    await this.navigateTo();
    await this.search(email);
    let found;
    await expect
      .poll(async () => {
        const rows = await this.rowCells();
        found = rows.find((r) => r.email.toLowerCase() === email.toLowerCase());
        if (!found) return false;
        if (type && found.type !== type) return false;
        return true;
      }, { timeout })
      .toBe(true);
    return found;
  }

  /** Polls until no row matches the email (used after a remove). */
  async waitForMemberAbsentByEmail(email, timeout = 30000) {
    await this.navigateTo();
    await this.search(email);
    await expect
      .poll(async () => {
        const rows = await this.rowCells();
        return rows.some((r) => r.email.toLowerCase() === email.toLowerCase());
      }, { timeout })
      .toBe(false);
  }

  /**
   * Clicks the Name cell for the given member and waits for the profile URL.
   * Returns the member-profile id.
   */
  async openProfileByName(name) {
    await this.page
      .locator('table tbody tr td')
      .filter({ hasText: name })
      .first()
      .click();
    await this.page.waitForURL(/member-profile\/\d+/, { timeout: 15000 });
    const id = this.page.url().match(/member-profile\/(\d+)/)[1];
    return id;
  }
}
