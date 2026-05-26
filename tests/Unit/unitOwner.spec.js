import path from 'path';
import { test, expect } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

const filePath = (f) => path.resolve(process.cwd(), 'test-data', 'files', f);

test.describe('Unit Owner Management', () => {
  test.describe.configure({ mode: 'serial' });

  test('Find unoccupied unit and add new owner', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(90000);

    const id = Helpers.uniqueId();
    const memberData = {
      name: `Owner Automation ${id}`,
      email: `owner.automation.${id}@gmail.com`,
      contact: Helpers.uniqueContact(), // valid 11-digit number
    };
    const ownershipPercentage = '100';

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openFirstUnoccupiedUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickAddOwner();

    await addOwnerPage.addNewMember(memberData);
    await addOwnerPage.fillOwnershipDetails({ percentage: ownershipPercentage });
    await addOwnerPage.saveOwner();

    await unitOwnersPage.verifyOwnerAdded(unit.unitDetailsUrl, memberData);
  });

  test('Find unoccupied unit and add 3 new owners at a time', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(120000);

    const owners = [
      { percentage: '25' },
      { percentage: '40' },
      { percentage: '35' },
    ].map((owner) => {
      const id = Helpers.uniqueId();
      return {
        ...owner,
        memberData: {
          name: `Owner Automation ${id}`,
          email: `owner.automation.${id}@gmail.com`,
          contact: Helpers.uniqueContact(), // valid 11-digit number
        },
      };
    });

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openFirstUnoccupiedUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickAddOwner();

    await addOwnerPage.addMultipleNewOwners(owners);
    await addOwnerPage.saveOwner();

    await unitOwnersPage.verifyOwnersAdded(
      unit.unitDetailsUrl,
      owners.map((owner) => owner.memberData),
    );
  });

  test('Find unoccupied unit and add existing member as owner', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(90000);

    const searchTerm = 'Automation Org Member';
    const previousDay = String(new Date(Date.now() - 24 * 60 * 60 * 1000).getDate());

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openFirstUnoccupiedUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickAddOwner();

    const selectedOwnerName = await addOwnerPage.searchAndSelectExistingMember(searchTerm);
    await addOwnerPage.fillOwnershipDetails({ percentage: '100', day: previousDay });
    await addOwnerPage.saveOwner();

    await unitOwnersPage.verifyOwnerNameAdded(unit.unitDetailsUrl, selectedOwnerName);
  });

  test('Find available unit and change ownership to new owner', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(90000);

    const id = Helpers.uniqueId();
    const memberData = {
      name: `Owner Automation ${id}`,
      email: `owner.automation.${id}@gmail.com`,
      contact: Helpers.uniqueContact(), // valid 11-digit number
    };
    // Ownership date in the past, clamped to a day that always exists in the
    // current month so the date picker never lands on a previous-month cell.
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const ownershipDay = String(
      yesterday.getMonth() === new Date().getMonth() ? yesterday.getDate() : new Date().getDate(),
    );

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickChangeOwnership();

    await addOwnerPage.changeOwnershipToNewMember(memberData, {
      percentage: '10',
      day: ownershipDay,
    });
    await addOwnerPage.saveOwner();

    await unitOwnersPage.verifyOwnerNameAdded(unit.unitDetailsUrl, memberData.name);
  });

  // OW-05: add a new Company as owner (@100%) and verify it appears in the Owners tab.
  test('Find unoccupied unit and add new company as owner', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(90000);

    const id = Helpers.uniqueId();
    const company = {
      name: `Company Automation ${id}`,
      email: `company.automation.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openFirstUnoccupiedUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickAddOwner();

    await addOwnerPage.addNewCompany(company);
    await addOwnerPage.fillOwnershipDetails({ percentage: '100' });
    await addOwnerPage.saveOwner();

    await unitOwnersPage.verifyOwnerNameAdded(unit.unitDetailsUrl, company.name);
  });

  // OW-06: add two new owners split 50/50.
  test('Find unoccupied unit and add two new owners (50/50)', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(120000);

    const owners = [{ percentage: '50' }, { percentage: '50' }].map((owner) => {
      const id = Helpers.uniqueId();
      return {
        ...owner,
        memberData: {
          name: `Owner Automation ${id}`,
          email: `owner.automation.${id}@gmail.com`,
          contact: Helpers.uniqueContact(),
        },
      };
    });

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openFirstUnoccupiedUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickAddOwner();

    await addOwnerPage.addMultipleNewOwners(owners);
    await addOwnerPage.saveOwner();

    await unitOwnersPage.verifyOwnersAdded(
      unit.unitDetailsUrl,
      owners.map((owner) => owner.memberData),
    );
  });

  // OW-07: mixed owners — one member + one company, split 50/50.
  test('Find unoccupied unit and add a member and a company owner (50/50)', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(120000);

    const mid = Helpers.uniqueId();
    const member = {
      name: `Owner Automation ${mid}`,
      email: `owner.automation.${mid}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };
    const cid = Helpers.uniqueId();
    const company = {
      name: `Company Automation ${cid}`,
      email: `company.automation.${cid}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openFirstUnoccupiedUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickAddOwner();

    // Owner 0: member @50%.
    await addOwnerPage.addNewMember(member, 0);
    await addOwnerPage.fillOwnershipDetails({ percentage: '50', ownerIndex: 0 });

    // Owner 1: company @50%.
    await addOwnerPage.addOwnershipSection(1);
    await addOwnerPage.addNewCompany(company, 1);
    await addOwnerPage.fillOwnershipDetails({ percentage: '50', ownerIndex: 1 });

    await addOwnerPage.saveOwner();

    await unitOwnersPage.verifyOwnerNameAdded(unit.unitDetailsUrl, member.name);
    await unitOwnersPage.verifyOwnerNameAdded(unit.unitDetailsUrl, company.name);
  });

  // OW-10: ownership total != 100% is rejected.
  test('Add owner with total ownership below 100% is rejected', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(90000);

    const id = Helpers.uniqueId();
    const member = {
      name: `Owner Automation ${id}`,
      email: `owner.automation.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openFirstUnoccupiedUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickAddOwner();

    await addOwnerPage.addNewMember(member, 0);
    await addOwnerPage.fillOwnershipDetails({ percentage: '50' }); // total 50% != 100%
    await addOwnerPage.saveOwnerAndVerifyPercentageTotalError('50');
  });

  // OW-09: add an owner with an ownership document attached (upload accepted, owner saved).
  // Note: the app does not surface the uploaded document anywhere on the Owners tab,
  // so we verify the owner persists (the upload doesn't break the save).
  test('Add owner with an ownership document attached', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(90000);

    const id = Helpers.uniqueId();
    const member = {
      name: `Owner Automation ${id}`,
      email: `owner.automation.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openFirstUnoccupiedUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickAddOwner();

    await addOwnerPage.addNewMember(member, 0);
    await addOwnerPage.fillOwnershipDetails({ percentage: '100' });
    await addOwnerPage.uploadOwnershipDocument(filePath('ProfilePicture.png'));
    await addOwnerPage.saveOwner();

    await unitOwnersPage.verifyOwnerAdded(unit.unitDetailsUrl, member);
  });

  // OW-11: ownership total above 100% is rejected.
  test('Add owners with total ownership above 100% is rejected', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(120000);

    const owners = [{ percentage: '60' }, { percentage: '60' }].map((owner) => {
      const id = Helpers.uniqueId();
      return {
        ...owner,
        memberData: {
          name: `Owner Automation ${id}`,
          email: `owner.automation.${id}@gmail.com`,
          contact: Helpers.uniqueContact(),
        },
      };
    });

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openFirstUnoccupiedUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickAddOwner();

    await addOwnerPage.addMultipleNewOwners(owners); // 60 + 60 = 120%
    await addOwnerPage.saveOwnerAndVerifyPercentageTotalError('120');
  });

  // OW-12: a 0% ownership percentage is rejected.
  test('Add owner with 0% ownership is rejected', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(90000);

    const id = Helpers.uniqueId();
    const member = {
      name: `Owner Automation ${id}`,
      email: `owner.automation.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openFirstUnoccupiedUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickAddOwner();

    await addOwnerPage.addNewMember(member, 0);
    await addOwnerPage.fillOwnershipDetails({ percentage: '0' });
    await addOwnerPage.saveOwnerAndVerifyPercentageRangeError();
  });

  // OW-16: decimal percentages are accepted but must still total exactly 100%
  // (33.33 x 3 = 99.99 -> rejected).
  test('Add owners with decimal percentages not summing to 100% is rejected', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(150000);

    const owners = [{ percentage: '33.33' }, { percentage: '33.33' }, { percentage: '33.33' }].map((owner) => {
      const id = Helpers.uniqueId();
      return {
        ...owner,
        memberData: {
          name: `Owner Automation ${id}`,
          email: `owner.automation.${id}@gmail.com`,
          contact: Helpers.uniqueContact(),
        },
      };
    });

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openFirstUnoccupiedUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickAddOwner();

    await addOwnerPage.addMultipleNewOwners(owners); // 33.33 x 3 = 99.99%
    await addOwnerPage.saveOwnerAndVerifyPercentageTotalError('99.99');
  });

  // OW-17: creating an owner-member with an already-used email is rejected on save.
  test('Add owner member with duplicate email is rejected', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
    memberListPage,
  }) => {
    test.setTimeout(120000);

    // Reuse an existing member's email.
    await memberListPage.navigateTo();
    await memberListPage.waitForRows();
    const [existing] = await memberListPage.rowCells();
    expect(existing, 'expected an existing member email').toBeTruthy();

    const member = {
      name: `Dup Owner ${Helpers.uniqueId()}`,
      email: existing.email,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openFirstUnoccupiedUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickAddOwner();

    await addOwnerPage.addNewMember(member, 0);
    await addOwnerPage.fillOwnershipDetails({ percentage: '100' });
    await addOwnerPage.saveOwnerAndVerifyDuplicateEmail();
  });

  // OW-17b: creating an owner-company with an already-used email is rejected on save.
  test('Add owner company with duplicate email is rejected', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
    memberListPage,
  }) => {
    test.setTimeout(120000);

    // Reuse an existing member's email.
    await memberListPage.navigateTo();
    await memberListPage.waitForRows();
    const [existing] = await memberListPage.rowCells();
    expect(existing, 'expected an existing member email').toBeTruthy();

    const company = {
      name: `Dup Company ${Helpers.uniqueId()}`,
      email: existing.email,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openFirstUnoccupiedUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickAddOwner();

    await addOwnerPage.addNewCompany(company);
    await addOwnerPage.fillOwnershipDetails({ percentage: '100' });
    await addOwnerPage.saveOwnerAndVerifyDuplicateEmail();
  });

  // OW-18: change ownership transfers a share to the new owner; totals stay 100%.
  test('Change ownership transfers percentage and totals stay 100%', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(90000);

    const id = Helpers.uniqueId();
    const member = {
      name: `Owner Automation ${id}`,
      email: `owner.automation.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const day = String(
      yesterday.getMonth() === new Date().getMonth() ? yesterday.getDate() : new Date().getDate(),
    );

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickChangeOwnership();

    // Transfer 30% to the new owner from an existing one.
    await addOwnerPage.changeOwnershipToNewMember(member, { percentage: '30', day });
    await addOwnerPage.saveOwner();

    // New owner is listed (robust re-navigating check), then assert percentages.
    await unitOwnersPage.verifyOwnerNameAdded(unit.unitDetailsUrl, member.name);
    let rows = [];
    await expect
      .poll(async () => {
        rows = await unitOwnersPage.ownerRows();
        return rows.some((r) => r.name.includes(member.name));
      }, { timeout: 20000 })
      .toBe(true);
    const mine = rows.find((r) => r.name.includes(member.name));
    expect(mine?.percent).toBe(30); // transferred share
    const total = rows.reduce((s, r) => s + (r.percent || 0), 0);
    expect(Math.round(total)).toBe(100); // totals preserved
  });

  // OW-19: a partial (10%) change leaves the prior owner(s) with the remainder.
  test('Partial change ownership leaves the prior owner with the remainder', async ({
    viewTowersPage,
    unitOwnersPage,
    addOwnerPage,
  }) => {
    test.setTimeout(90000);

    const id = Helpers.uniqueId();
    const member = {
      name: `Owner Automation ${id}`,
      email: `owner.automation.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const day = String(
      yesterday.getMonth() === new Date().getMonth() ? yesterday.getDate() : new Date().getDate(),
    );

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitOwnersPage.navigateToOwnersTab(unit.unitDetailsUrl);
    await unitOwnersPage.clickChangeOwnership();

    // Transfer only 10% to the new owner.
    await addOwnerPage.changeOwnershipToNewMember(member, { percentage: '10', day });
    await addOwnerPage.saveOwner();

    await unitOwnersPage.verifyOwnerNameAdded(unit.unitDetailsUrl, member.name);
    let rows = [];
    await expect
      .poll(async () => {
        rows = await unitOwnersPage.ownerRows();
        return rows.some((r) => r.name.includes(member.name));
      }, { timeout: 20000 })
      .toBe(true);
    const mine = rows.find((r) => r.name.includes(member.name));
    expect(mine?.percent).toBe(10);
    // Prior owner(s) retained, not replaced.
    expect(rows.length).toBeGreaterThan(1);
    const total = rows.reduce((s, r) => s + (r.percent || 0), 0);
    expect(Math.round(total)).toBe(100);
  });
});
