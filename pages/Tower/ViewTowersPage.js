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

    return { unitHref, unitNumber, unitDetailsUrl: this.page.url() };
  }

  async openFirstUnoccupiedUnit() {
    const units = this.getUnoccupiedUnits();
    // Wait for the grid to render at least one matching unit before opening.
    await units.first().waitFor({ state: 'visible', timeout: LOAD_TIMEOUT });
    return this.#openUnit(units.first());
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
