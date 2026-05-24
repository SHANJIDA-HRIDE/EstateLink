import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

// ViewTowers renders a large tower/unit grid and is slow to become interactive,
// so list/grid waits use a generous timeout.
const LOAD_TIMEOUT = 45000;

export class ViewTowersPage extends BasePage {
  constructor(page) {
    super(page);
    this.addTowerBtn = page.getByRole('button', { name: /Add Tower/i });
  }

  async navigateTo() {
    await this.page.goto(`${ENV.BASE_URL}/ViewTowers`, {
      waitUntil: 'domcontentloaded',
      timeout: LOAD_TIMEOUT,
    });
    await this.verifyTowerListLoaded();
  }

  async verifyTowerListLoaded() {
    await this.addTowerBtn.waitFor({ state: 'visible', timeout: LOAD_TIMEOUT });
  }

  getUnoccupiedUnits() {
    return this.page.locator('a[href^="/unit-details/"]', {
      has: this.page.getByTitle('no owner'),
    });
  }

  getAvailableUnits() {
    return this.page.locator('a[href*="/unit-details/"]', {
      has: this.page.getByTitle('available'),
    });
  }

  /**
   * Opens a unit link, then returns its identifying details.
   * @param {import('@playwright/test').Locator} unitLocator
   */
  async #openUnit(unitLocator) {
    await unitLocator.waitFor({ state: 'visible', timeout: LOAD_TIMEOUT });

    const unitHref = await unitLocator.getAttribute('href');
    const unitNumber = (await unitLocator.innerText()).trim();

    await unitLocator.click();
    await this.page.waitForURL(/\/unit-details\/\d+$/, { timeout: LOAD_TIMEOUT });

    // Capture the tower name shown on the unit-details page (e.g. "AUTOMATION TOWER 1779120660157 #15").
    const towerName = await this.page
      .evaluate(() => {
        const m = document.body.innerText.match(/[A-Za-z ]*Tower\s+\d+/);
        return m ? m[0].trim() : null;
      })
      .catch(() => null);

    return { unitHref, unitNumber, unitDetailsUrl: this.page.url(), towerName };
  }

  async openFirstUnoccupiedUnit() {
    const units = this.getUnoccupiedUnits();
    // Wait for the grid to render at least one matching unit before opening.
    await units.first().waitFor({ state: 'visible', timeout: LOAD_TIMEOUT });
    return this.#openUnit(units.first());
  }

  /**
   * Opens the (first) unit belonging to a specific tower — used after creating a fresh
   * single-unit tower so the whole flow runs on a guaranteed-clean unit.
   * @param {string} towerName
   */
  async openUnitInTower(towerName) {
    await this.page.getByText(towerName, { exact: false }).first().waitFor({ state: 'visible', timeout: LOAD_TIMEOUT });
    const data = await this.page.evaluate((name) => {
      const c = (s) => (s || '').replace(/\s+/g, ' ').trim();
      const heading = [...document.querySelectorAll('*')].find(
        (el) => c(el.innerText).includes(name) && c(el.innerText).length < 80,
      );
      let section = heading;
      for (let i = 0; i < 8 && section; i++) {
        if (section.querySelector && section.querySelector('a[href^="/unit-details/"]')) break;
        section = section.parentElement;
      }
      const a = section && section.querySelector('a[href^="/unit-details/"]');
      return a ? { href: a.getAttribute('href'), number: c(a.innerText) } : null;
    }, towerName);
    if (!data) throw new Error(`No unit found for tower "${towerName}"`);

    await this.page.goto(`${ENV.BASE_URL}${data.href}`, { waitUntil: 'domcontentloaded' });
    await this.page.waitForURL(/\/unit-details\/\d+$/, { timeout: LOAD_TIMEOUT });
    return { unitHref: data.href, unitNumber: data.number, unitDetailsUrl: this.page.url(), towerName };
  }

  /** Random no-owner unit — spreads load across units to avoid re-hitting a polluted one. */
  async openRandomUnoccupiedUnit() {
    const units = this.getUnoccupiedUnits();
    await units.first().waitFor({ state: 'visible', timeout: LOAD_TIMEOUT });
    const count = await units.count();
    const randomIndex = Math.floor(Math.random() * count);
    return this.#openUnit(units.nth(randomIndex));
  }

  async openRandomAvailableUnit() {
    const availableUnits = this.getAvailableUnits();
    // Wait for the grid to render before counting, otherwise count() races to 0.
    await availableUnits.first().waitFor({ state: 'visible', timeout: LOAD_TIMEOUT });

    const count = await availableUnits.count();
    const randomIndex = Math.floor(Math.random() * count);
    return this.#openUnit(availableUnits.nth(randomIndex));
  }
}
