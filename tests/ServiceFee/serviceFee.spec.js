import { test } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

const EXISTING_MEMBER = 'Automation Org Member';

/**
 * Steps 0-12: create a fresh single-unit tower, add owner + primary contact, create a
 * service fee, (optionally) upload readings, and generate bills. Returns the tower name.
 * @param pages page-object fixtures
 * @param {{serviceFeeDate?:Date, dueDay?:number, skipBillUpload?:boolean, generateMonths?:string[]}} [opts]
 */
async function setupThroughBilling(
  {
    page,
    viewTowersPage,
    addTowerPage,
    unitOwnersPage,
    addOwnerPage,
    unitContactsPage,
    serviceFeeSettingsPage,
    serviceFeeBillUploadsPage,
    billingManagementPage,
  },
  opts = {},
) {
  const { serviceFeeDate, dueDay = 31, skipBillUpload = false, generateMonths } = opts;
  // Step 0: fresh tower (1 floor, 1 unit) -> guaranteed clean unit.
  const towerName = `E2E Tower ${Helpers.uniqueId()}`;
  await addTowerPage.navigateTo();
  await page.waitForTimeout(1500);
  await addTowerPage.fillTowerName(towerName);
  await addTowerPage.fillNumberOfFloors(1);
  await addTowerPage.fillUnitsInEachFloor(1);
  await addTowerPage.saveTower();
  await addTowerPage.handleSuccessDialog();

  // Step 1: open the unit, add an existing member as owner.
  await viewTowersPage.navigateTo();
  const unit = await viewTowersPage.openUnitInTower(towerName);
  await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
  await unitOwnersPage.clickAddOwner();
  const previousDay = String(new Date(Date.now() - 24 * 60 * 60 * 1000).getDate());
  const ownerName = await addOwnerPage.searchAndSelectExistingMember(EXISTING_MEMBER);
  await addOwnerPage.fillOwnershipDetails({ percentage: '100', day: previousDay });
  await addOwnerPage.saveOwner();
  await unitOwnersPage.verifyOwnerNameAdded(unit.unitDetailsUrl, ownerName);

  // Steps 2-5: primary contact.
  await unitContactsPage.navigateToContactsTab(unit.unitDetailsUrl);
  await unitContactsPage.addPrimaryContact(EXISTING_MEMBER);

  // Steps 6-10: service fee with late penalty (optionally back-dated to a previous month).
  await serviceFeeSettingsPage.navigateTo();
  await serviceFeeSettingsPage.createServiceFee({
    towerName,
    unitNumber: unit.unitNumber,
    amount: 500,
    dueDay,
    penaltyPercent: 10,
    daysOverdue: 10,
    serviceFeeDate,
  });

  // Step 11: bill upload (readings) — skipped for service-fee-only billing.
  if (!skipBillUpload) {
    await serviceFeeBillUploadsPage.navigateTo();
    await serviceFeeBillUploadsPage.uploadReadings({
      towerName,
      unitNumber: unit.unitNumber,
      uom: 1,
      pricePerUnit: 10,
      prevReading: 100,
      currentReading: 150,
    });
  }

  // Step 12: generate bill(s) for the requested month(s) (default: current month).
  const months = generateMonths || [new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })];
  for (const monthYear of months) {
    await billingManagementPage.navigateTo();
    await billingManagementPage.generateBills({ monthYear, towerName, unitNumber: unit.unitNumber });
  }

  return { towerName, unit };
}

test.describe('Service Fee Management - end to end', () => {
  // Each test creates its own fresh single-unit tower (clean data).
  test.describe.configure({ mode: 'serial', retries: 1 });

  test('full payment: fresh tower -> ... -> record full payment (steps 0-13)', async ({
    page,
    viewTowersPage,
    addTowerPage,
    unitOwnersPage,
    addOwnerPage,
    unitContactsPage,
    serviceFeeSettingsPage,
    serviceFeeBillUploadsPage,
    billingManagementPage,
    serviceFeeListPage,
  }) => {
    test.setTimeout(360000);
    const { towerName } = await setupThroughBilling({
      page, viewTowersPage, addTowerPage, unitOwnersPage, addOwnerPage,
      unitContactsPage, serviceFeeSettingsPage, serviceFeeBillUploadsPage, billingManagementPage,
    });

    // Step 13: record the FULL payment.
    await serviceFeeListPage.navigateTo();
    await serviceFeeListPage.recordPayment(towerName);
  });

  test('partial payment: fresh tower -> ... -> record half of Total Due (steps 0-13)', async ({
    page,
    viewTowersPage,
    addTowerPage,
    unitOwnersPage,
    addOwnerPage,
    unitContactsPage,
    serviceFeeSettingsPage,
    serviceFeeBillUploadsPage,
    billingManagementPage,
    serviceFeeListPage,
  }) => {
    test.setTimeout(360000);
    const { towerName } = await setupThroughBilling({
      page, viewTowersPage, addTowerPage, unitOwnersPage, addOwnerPage,
      unitContactsPage, serviceFeeSettingsPage, serviceFeeBillUploadsPage, billingManagementPage,
    });

    // Step 13: record a PARTIAL payment (half of Total Due via "Total Amount (BDT)").
    await serviceFeeListPage.navigateTo();
    await serviceFeeListPage.recordPartialPayment(towerName);
  });

  test('two-month payment: back-dated fee -> generate prev + current month -> pay both (steps 0-13)', async ({
    page,
    viewTowersPage,
    addTowerPage,
    unitOwnersPage,
    addOwnerPage,
    unitContactsPage,
    serviceFeeSettingsPage,
    serviceFeeBillUploadsPage,
    billingManagementPage,
    serviceFeeListPage,
  }) => {
    test.setTimeout(420000);

    const now = new Date();
    // Service fee back-dated to the 1st of last month, so both months are billable.
    const serviceFeeDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthYear = serviceFeeDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const currMonthYear = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const { towerName } = await setupThroughBilling(
      {
        page, viewTowersPage, addTowerPage, unitOwnersPage, addOwnerPage,
        unitContactsPage, serviceFeeSettingsPage, serviceFeeBillUploadsPage, billingManagementPage,
      },
      {
        serviceFeeDate,
        skipBillUpload: true, // service-fee-only (no utility readings)
        generateMonths: [prevMonthYear, currMonthYear], // previous month first, then current
      },
    );

    // Step 13: pay BOTH month bills in full (select both month cards).
    await serviceFeeListPage.navigateTo();
    await serviceFeeListPage.recordPaymentAllMonths(towerName);
  });

  test('advance payment: full payment then 1000 advance on same unit (steps 0-13 + advance)', async ({
    page,
    viewTowersPage,
    addTowerPage,
    unitOwnersPage,
    addOwnerPage,
    unitContactsPage,
    serviceFeeSettingsPage,
    serviceFeeBillUploadsPage,
    billingManagementPage,
    serviceFeeListPage,
  }) => {
    test.setTimeout(420000);
    const { towerName } = await setupThroughBilling({
      page, viewTowersPage, addTowerPage, unitOwnersPage, addOwnerPage,
      unitContactsPage, serviceFeeSettingsPage, serviceFeeBillUploadsPage, billingManagementPage,
    });

    // Step 13: record the FULL payment for the current month.
    await serviceFeeListPage.navigateTo();
    await serviceFeeListPage.recordPayment(towerName);

    // Extra step: re-open Record Payment on the same unit and pay a 1000 BDT advance.
    await serviceFeeListPage.recordAdvancePayment(towerName, 1000);
  });

  test('advance auto-pays next bill: overpay prev month -> generate current -> Payment History (steps 0-13 + auto)', async ({
    page,
    viewTowersPage,
    addTowerPage,
    unitOwnersPage,
    addOwnerPage,
    unitContactsPage,
    serviceFeeSettingsPage,
    serviceFeeBillUploadsPage,
    billingManagementPage,
    serviceFeeListPage,
  }) => {
    test.setTimeout(480000);

    const now = new Date();
    const serviceFeeDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // 1st of last month
    const prevMonthYear = serviceFeeDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const currMonthYear = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // Steps 0-12: back-dated fee (Due Day 25), service-fee-only, generate ONLY the previous month.
    const { towerName, unit } = await setupThroughBilling(
      {
        page, viewTowersPage, addTowerPage, unitOwnersPage, addOwnerPage,
        unitContactsPage, serviceFeeSettingsPage, serviceFeeBillUploadsPage, billingManagementPage,
      },
      { serviceFeeDate, dueDay: 25, skipBillUpload: true, generateMonths: [prevMonthYear] },
    );

    // Step 13: select the previous month, then OVERPAY (500 due + 500 advance = 1000) without
    // selecting the card — clears the bill and leaves a 500 advance.
    await serviceFeeListPage.navigateTo();
    await serviceFeeListPage.recordOverpayment(towerName, 1000, serviceFeeDate);

    // Extra: generate the CURRENT month bill — the 500 advance should auto-pay it.
    await billingManagementPage.navigateTo();
    await billingManagementPage.generateBills({ monthYear: currMonthYear, towerName, unitNumber: unit.unitNumber });

    // Verify in Payment History that an allocation exists for the CURRENT month (auto-paid).
    await serviceFeeListPage.navigateTo();
    await serviceFeeListPage.verifyPaymentHistoryBillMonth(towerName, currMonthYear);
  });
});
