import { test, expect } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

test.describe('Unit Resident Management', () => {
  test.describe.configure({ mode: 'serial' });

  test('Find available unit and add resident', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
  }) => {
    test.setTimeout(90000);

    const id = Helpers.uniqueId();
    const residentData = {
      name: `Resident Automation ${id}`,
      email: `resident.automation.${id}@gmail.com`,
      contact: Helpers.uniqueContact(), // valid 11-digit number
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await addResidentPage.setStatusOccupied();
    await unitResidentsPage.clickAddResident();

    await addResidentPage.addNewResident(residentData);

    await unitResidentsPage.verifyResidentAdded(unit.unitDetailsUrl, residentData);
  });

  // RS-02: add resident WITHOUT the "Resident is also a tenant" checkbox -> Type = "Resident".
  test('Add resident without tenant checkbox lists Type as Resident', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
  }) => {
    test.setTimeout(120000);

    const id = Helpers.uniqueId();
    const residentData = {
      name: `Resident Automation ${id}`,
      email: `resident.automation.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await addResidentPage.setStatusOccupied();
    await unitResidentsPage.clickAddResident();

    // addNewResident skips step 2 (checkbox unchecked by default) -> Type = "Resident".
    await addResidentPage.addNewResident(residentData);
    await unitResidentsPage.verifyResidentAdded(unit.unitDetailsUrl, residentData);

    // Type column reflects unchecked checkbox.
    let rows = [];
    await expect
      .poll(async () => {
        rows = await unitResidentsPage.residentRows();
        return rows.some((r) => r.name.includes(residentData.name));
      }, { timeout: 20000 })
      .toBe(true);
    const mine = rows.find((r) => r.name.includes(residentData.name));
    expect(mine?.type).toBe('Resident');
  });

  // RS-03: add resident WITH the "Resident is also a tenant" checkbox -> Type = "Resident (Tenant)".
  test('Add resident with tenant checkbox lists Type as Resident (Tenant)', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
  }) => {
    test.setTimeout(120000);

    const id = Helpers.uniqueId();
    const residentData = {
      name: `Tenant Automation ${id}`,
      email: `tenant.automation.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await addResidentPage.setStatusOccupied();
    await unitResidentsPage.clickAddResident();

    await addResidentPage.addNewResidentAsTenant(residentData);
    await unitResidentsPage.verifyResidentAdded(unit.unitDetailsUrl, residentData);

    let rows = [];
    await expect
      .poll(async () => {
        rows = await unitResidentsPage.residentRows();
        return rows.some((r) => r.name.includes(residentData.name));
      }, { timeout: 20000 })
      .toBe(true);
    const mine = rows.find((r) => r.name.includes(residentData.name));
    expect(mine?.type).toBe('Resident (Tenant)');
  });

  // RS-04: add two residents sequentially to the same unit; both listed.
  test('Add two residents to the same unit', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
  }) => {
    test.setTimeout(180000);

    const mk = (tag) => {
      const id = Helpers.uniqueId();
      return {
        name: `${tag} Automation ${id}`,
        email: `${tag.toLowerCase()}.automation.${id}@gmail.com`,
        contact: Helpers.uniqueContact(),
      };
    };
    const r1 = mk('Resident');
    const r2 = mk('Resident');

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    // First resident.
    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await addResidentPage.setStatusOccupied();
    await unitResidentsPage.clickAddResident();
    await addResidentPage.addNewResident(r1);
    await unitResidentsPage.verifyResidentNameAdded(unit.unitDetailsUrl, r1.name);

    // Second resident.
    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await unitResidentsPage.clickAddResident();
    await addResidentPage.addNewResident(r2);
    await unitResidentsPage.verifyResidentNameAdded(unit.unitDetailsUrl, r2.name);

    // Both visible in the list.
    let rows = [];
    await expect
      .poll(async () => {
        rows = await unitResidentsPage.residentRows();
        return (
          rows.some((r) => r.name.includes(r1.name)) && rows.some((r) => r.name.includes(r2.name))
        );
      }, { timeout: 20000 })
      .toBe(true);
  });

  // RS-05: add an existing member as resident via the "Add Existing Member" modal.
  test('Add existing member as resident via the modal', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
  }) => {
    test.setTimeout(150000);

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await addResidentPage.setStatusOccupied();
    await unitResidentsPage.clickAddResident();

    // Pick a known community member via search.
    const selectedName = await addResidentPage.addExistingMember('Rahim Ahmed');

    await unitResidentsPage.verifyResidentNameAdded(unit.unitDetailsUrl, selectedName);
  });

  // RS-06: Add Existing Member modal search narrows the list.
  test('Add Existing Member modal search narrows results', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
  }) => {
    test.setTimeout(150000);

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await addResidentPage.setStatusOccupied();
    await unitResidentsPage.clickAddResident();
    await addResidentPage.openExistingMemberModal();

    // Search "Rahim" -> all visible row names contain "Rahim".
    await addResidentPage.searchExistingMember('Rahim');
    let names = [];
    await expect
      .poll(async () => {
        names = await addResidentPage.modalRowNames();
        return names.length > 0 && names.every((n) => /rahim/i.test(n));
      }, { timeout: 15000 })
      .toBe(true);

    // Switch search to "Nusrat" -> rows update; no row contains "Rahim".
    await addResidentPage.searchExistingMember('Nusrat');
    await expect
      .poll(async () => {
        names = await addResidentPage.modalRowNames();
        return names.length > 0 && names.every((n) => /nusrat/i.test(n)) && names.every((n) => !/rahim/i.test(n));
      }, { timeout: 15000 })
      .toBe(true);
  });

  // RS-07: STATUS = Vacant disables Add Resident; setting Occupied enables it.
  test('Status Vacant disables Add Resident; Occupied enables it', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
  }) => {
    test.setTimeout(120000);

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    // Owned unit (status radios are togglable; require an owner).
    const unit = await viewTowersPage.openRandomAvailableUnit();
    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);

    // Default Vacant (no resident yet) -> Add Resident disabled.
    await expect(unitResidentsPage.addResidentBtn).toBeDisabled({ timeout: 10000 });

    // Set Occupied -> Add Resident enabled.
    await addResidentPage.setStatusOccupied();
    await expect(unitResidentsPage.addResidentBtn).toBeEnabled({ timeout: 10000 });
  });

  // RS-16: remove a resident -> gone from the list.
  test('Remove a resident removes them from the list', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
  }) => {
    test.setTimeout(150000);

    const id = Helpers.uniqueId();
    const r = {
      name: `Resident Rm ${id}`,
      email: `resident.rm.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await addResidentPage.setStatusOccupied();
    await unitResidentsPage.clickAddResident();
    await addResidentPage.addNewResident(r);
    await unitResidentsPage.verifyResidentNameAdded(unit.unitDetailsUrl, r.name);

    // Remove.
    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await unitResidentsPage.removeResident(r.name);

    // Gone from the list.
    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await expect
      .poll(async () => {
        const rows = await unitResidentsPage.residentRows();
        return rows.some((row) => row.name.includes(r.name));
      }, { timeout: 15000 })
      .toBe(false);
  });

  // RS-17: Type column reflects checkbox -> "Resident" vs "Resident (Tenant)" on the same unit.
  test('Type column reflects tenant checkbox per resident', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
  }) => {
    test.setTimeout(180000);

    const mk = (tag) => {
      const id = Helpers.uniqueId();
      return {
        name: `${tag} Automation ${id}`,
        email: `${tag.toLowerCase()}.automation.${id}@gmail.com`,
        contact: Helpers.uniqueContact(),
      };
    };
    const family = mk('Family');
    const tenant = mk('Tenant');

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    // 1st: without checkbox -> "Resident".
    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await addResidentPage.setStatusOccupied();
    await unitResidentsPage.clickAddResident();
    await addResidentPage.addNewResident(family);
    await unitResidentsPage.verifyResidentNameAdded(unit.unitDetailsUrl, family.name);

    // 2nd: with checkbox -> "Resident (Tenant)".
    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await unitResidentsPage.clickAddResident();
    await addResidentPage.addNewResidentAsTenant(tenant);
    await unitResidentsPage.verifyResidentNameAdded(unit.unitDetailsUrl, tenant.name);

    // Both rows present with the right Type.
    let rows = [];
    await expect
      .poll(async () => {
        rows = await unitResidentsPage.residentRows();
        return (
          rows.some((r) => r.name.includes(family.name) && r.type === 'Resident') &&
          rows.some((r) => r.name.includes(tenant.name) && r.type === 'Resident (Tenant)')
        );
      }, { timeout: 20000 })
      .toBe(true);
  });

  // RS-19: click resident name -> profile; General Information matches what was entered.
  test('Click resident opens profile with matching General Information', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
    memberProfilePage,
    page,
  }) => {
    test.setTimeout(150000);

    const id = Helpers.uniqueId();
    const r = {
      name: `Resident Prof ${id}`,
      email: `resident.prof.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await addResidentPage.setStatusOccupied();
    await unitResidentsPage.clickAddResident();
    await addResidentPage.addNewResident(r);
    await unitResidentsPage.verifyResidentNameAdded(unit.unitDetailsUrl, r.name);

    // Click resident name -> /member-profile/{id}.
    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await page.getByText(r.name).first().click();
    await page.waitForURL(/member-profile\/\d+/, { timeout: 15000 });

    await memberProfilePage.openTab('Profile Information');
    await memberProfilePage.verifyField('Full Name', r.name);
    await memberProfilePage.verifyField('E-Mail', r.email);
    await memberProfilePage.verifyField('Contact Number', r.contact);
  });

  // RS-20: Profile Community Member tab -> Resident card shows tower/unit/type.
  test('Resident profile Community Member tab shows unit info', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
    memberProfilePage,
    page,
  }) => {
    test.setTimeout(150000);

    const id = Helpers.uniqueId();
    const r = {
      name: `Resident Comm ${id}`,
      email: `resident.comm.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();
    expect(unit.towerName, 'expected tower name from random unit').toBeTruthy();

    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await addResidentPage.setStatusOccupied();
    await unitResidentsPage.clickAddResident();
    await addResidentPage.addNewResident(r);
    await unitResidentsPage.verifyResidentNameAdded(unit.unitDetailsUrl, r.name);

    // Click resident -> profile -> Community Member tab.
    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await page.getByText(r.name).first().click();
    await page.waitForURL(/member-profile\/\d+/, { timeout: 15000 });
    await memberProfilePage.openTab('Community Member');

    // Resident card: Member Type = "Resident" (unchecked tenant) + Unit Name; Tower
    // Name format from openRandomAvailableUnit varies, just assert it's populated.
    await memberProfilePage.verifyField('Member Type', 'Resident');
    await memberProfilePage.verifyField('Unit Name', unit.unitNumber);
    await expect
      .poll(async () => ((await memberProfilePage.fieldValue('Tower Name')) || '').length, { timeout: 10000 })
      .toBeGreaterThan(0);
  });

  // RS-21: resident appears BOTH in the unit's Residents list AND in their profile Community Member tab.
  test('Resident appears in unit list and in profile Community Member tab', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
    memberProfilePage,
    page,
  }) => {
    test.setTimeout(150000);

    const id = Helpers.uniqueId();
    const r = {
      name: `Resident Both ${id}`,
      email: `resident.both.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await addResidentPage.setStatusOccupied();
    await unitResidentsPage.clickAddResident();
    await addResidentPage.addNewResident(r);

    // (1) On the unit's Residents list.
    await unitResidentsPage.verifyResidentAdded(unit.unitDetailsUrl, r);

    // (2) On their profile -> Community Member tab.
    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await page.getByText(r.name).first().click();
    await page.waitForURL(/member-profile\/\d+/, { timeout: 15000 });
    await memberProfilePage.openTab('Community Member');
    await memberProfilePage.verifyField('Member Type', 'Resident');
    await memberProfilePage.verifyField('Unit Name', unit.unitNumber);
  });

  // RS-22: editing a resident's name updates both the unit's list and their profile.
  test('Editing resident name updates list and profile', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
    editMemberGeneralPage,
    memberProfilePage,
    page,
  }) => {
    test.setTimeout(180000);

    const id = Helpers.uniqueId();
    const r = {
      name: `Resident Edit ${id}`,
      email: `resident.edit.${id}@gmail.com`,
      contact: Helpers.uniqueContact(),
    };
    const newName = `Resident Edited ${Helpers.uniqueId()}`;

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();

    const unit = await viewTowersPage.openRandomAvailableUnit();

    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await addResidentPage.setStatusOccupied();
    await unitResidentsPage.clickAddResident();
    await addResidentPage.addNewResident(r);
    await unitResidentsPage.verifyResidentNameAdded(unit.unitDetailsUrl, r.name);

    // Open resident's profile to grab the id, then edit general info.
    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await page.getByText(r.name).first().click();
    await page.waitForURL(/member-profile\/\d+/, { timeout: 15000 });
    const memberId = page.url().match(/member-profile\/(\d+)/)[1];

    await editMemberGeneralPage.navigateTo(memberId);
    await editMemberGeneralPage.fillAll({
      name: newName,
      email: r.email,
      contact: r.contact,
    });
    await editMemberGeneralPage.update();

    // Profile reflects the new name.
    await memberProfilePage.navigateTo(memberId);
    await memberProfilePage.openTab('Profile Information');
    await memberProfilePage.verifyField('Full Name', newName);

    // Residents list reflects the new name.
    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await expect
      .poll(async () => {
        const rows = await unitResidentsPage.residentRows();
        return rows.some((row) => row.name.includes(newName));
      }, { timeout: 20000 })
      .toBe(true);
  });

  // RS-23: lifecycle round-trip on a unit -> add, remove, re-add.
  // (A fresh tower's unit has no owner, which disables the status radios -> can't
  //  add residents; use openRandomAvailableUnit which already has an owner.)
  test('Resident lifecycle: add -> remove -> re-add', async ({
    viewTowersPage,
    unitResidentsPage,
    addResidentPage,
  }) => {
    test.setTimeout(200000);

    const mk = (tag) => {
      const id = Helpers.uniqueId();
      return {
        name: `${tag} ${id}`,
        email: `${tag.toLowerCase()}.${id}@gmail.com`,
        contact: Helpers.uniqueContact(),
      };
    };
    const r1 = mk('R1');
    const r2 = mk('R2');

    await viewTowersPage.navigateTo();
    await viewTowersPage.verifyTowerListLoaded();
    const unit = await viewTowersPage.openRandomAvailableUnit();

    // Add r1.
    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await addResidentPage.setStatusOccupied();
    await unitResidentsPage.clickAddResident();
    await addResidentPage.addNewResident(r1);
    await unitResidentsPage.verifyResidentNameAdded(unit.unitDetailsUrl, r1.name);

    // Remove r1 -> gone.
    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await unitResidentsPage.removeResident(r1.name);
    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    await expect
      .poll(async () => {
        const rows = await unitResidentsPage.residentRows();
        return rows.some((row) => row.name.includes(r1.name));
      }, { timeout: 15000 })
      .toBe(false);

    // Re-add r2 — after removal the unit reverts to Vacant. Wait for the Occupied
    // radio to be enabled, flip it, then Add Resident.
    await unitResidentsPage.navigateToResidentsTab(unit.unitDetailsUrl);
    const occupied = unitResidentsPage.page.getByLabel(/^Occupied$/);
    await expect(occupied).toBeEnabled({ timeout: 15000 });
    await occupied.click();
    await expect(unitResidentsPage.addResidentBtn).toBeEnabled({ timeout: 10000 });
    await unitResidentsPage.clickAddResident();
    await addResidentPage.addNewResident(r2);
    await unitResidentsPage.verifyResidentNameAdded(unit.unitDetailsUrl, r2.name);
  });
});
