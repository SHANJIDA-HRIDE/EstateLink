import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

/**
 * Service Fee Bill Uploads (/service-fee-bill-uploads).
 * Filter by Tower + Service Fee (by unit), then enter meter readings per row:
 *   UoM | Price/Unit | Prev Reading | Current Reading  (Consumption + Amount auto-computed).
 */
export class ServiceFeeBillUploadsPage extends BasePage {
  constructor(page) {
    super(page);
    this.towerFilterBtn = page.getByRole('button', { name: /Select Tower/i });
    this.serviceFeeFilterBtn = page.getByRole('button', { name: /Select Service Fee/i });
    this.doneBtn = page.getByRole('button', { name: /^Done$/ });
    this.clearBtn = page.getByRole('button', { name: /^Clear$/ });
    this.saveBtn = page.getByRole('button', { name: /^Save$/ });
    this.okBtn = page.getByRole('button', { name: /^OK$/ });
    this.successMessage = page.getByText(/success/i);

    // Reading cells (only these number inputs use 0 / 0.00 placeholders).
    this.readingInputs = page.locator('input[placeholder="0"], input[placeholder="0.00"]');
  }

  async navigateTo() {
    await this.navigate(`${ENV.BASE_URL}/service-fee-bill-uploads`);
    await this.towerFilterBtn.first().waitFor({ state: 'visible', timeout: 30000 });
  }

  /** @param {string} towerName full name or unique substring (restricts to ONLY this tower) */
  async filterByTower(towerName) {
    await this.towerFilterBtn.first().click();
    if (await this.clearBtn.count()) await this.clearBtn.first().click();
    await this.page.getByText(towerName, { exact: false }).first().click();
    if (await this.doneBtn.count()) await this.doneBtn.first().click();
    await this.page.waitForTimeout(800);
  }

  /**
   * Filters to a SINGLE service fee by its unit number. Clears any pre-selected
   * units first so the readings table shows only this unit's row.
   * @param {string} unitNumber
   */
  async filterByServiceFee(unitNumber) {
    await this.serviceFeeFilterBtn.first().click();
    if (await this.clearBtn.count()) await this.clearBtn.first().click();
    await this.page.getByText(unitNumber, { exact: true }).first().click();
    if (await this.doneBtn.count()) await this.doneBtn.first().click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Fills the first reading row. After filtering to a single tower+service-fee, the
   * table shows exactly that unit's row. Columns in DOM order:
   * 0=UoM, 1=Price/Unit, 2=Prev, 3=Current (4=Consumption, 5=Amount auto-computed).
   * @param {{uom:string|number, pricePerUnit:string|number, prevReading:string|number, currentReading:string|number}} r
   */
  async fillReadings({ uom, pricePerUnit, prevReading, currentReading }) {
    await this.readingInputs.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.readingInputs.nth(0).fill(String(uom));
    await this.readingInputs.nth(1).fill(String(pricePerUnit));
    await this.readingInputs.nth(2).fill(String(prevReading));
    await this.readingInputs.nth(3).fill(String(currentReading));
  }

  async save() {
    await this.saveBtn.first().click();
  }

  async saveAndConfirm() {
    await this.save();
    await expect(this.successMessage).toBeVisible({ timeout: 20000 });
    if (await this.okBtn.count()) await this.okBtn.first().click();
  }

  /**
   * Full flow: filter tower + service fee, enter readings, save.
   * @param {{towerName:string, unitNumber:string, uom:string|number, pricePerUnit:string|number,
   *          prevReading:string|number, currentReading:string|number}} data
   */
  async uploadReadings({ towerName, unitNumber, uom = 1, pricePerUnit = 10, prevReading = 100, currentReading = 150 }) {
    await this.filterByTower(towerName);
    await this.filterByServiceFee(unitNumber);
    await this.fillReadings({ uom, pricePerUnit, prevReading, currentReading });
    await this.saveAndConfirm();
  }
}
