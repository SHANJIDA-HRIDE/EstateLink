import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { MemberListPage } from '../pages/MemberListPage';
import { AddMemberPage } from '../pages/AddMemberPage';
import { ViewTowersPage } from '../pages/ViewTowersPage';
import { AddTowerPage } from '../pages/AddTowerPage';
import { UnitDetailsPage } from '../pages/UnitDetailsPage';
import { EditUnitGeneralPage } from '../pages/EditUnitGeneralPage';
import { AddOwnerPage } from '../pages/AddOwnerPage';
import { UnitOwnersPage } from '../pages/UnitOwnersPage';

/**
 * Custom test fixture that automatically instantiates Page Objects
 * and injects them into tests.
 */
export const test = base.extend({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  memberListPage: async ({ page }, use) => {
    const memberListPage = new MemberListPage(page);
    await use(memberListPage);
  },
  addMemberPage: async ({ page }, use) => {
    const addMemberPage = new AddMemberPage(page);
    await use(addMemberPage);
  },
  viewTowersPage: async ({ page }, use) => {
    const viewTowersPage = new ViewTowersPage(page);
    await use(viewTowersPage);
  },
  addTowerPage: async ({ page }, use) => {
    const addTowerPage = new AddTowerPage(page);
    await use(addTowerPage);
  },
  unitDetailsPage: async ({ page }, use) => {
    const unitDetailsPage = new UnitDetailsPage(page);
    await use(unitDetailsPage);
  },
  editUnitGeneralPage: async ({ page }, use) => {
    const editUnitGeneralPage = new EditUnitGeneralPage(page);
    await use(editUnitGeneralPage);
  },
  unitOwnersPage: async ({ page }, use) => {
    const unitOwnersPage = new UnitOwnersPage(page);
    await use(unitOwnersPage);
  },
  addOwnerPage: async ({ page }, use) => {
    const addOwnerPage = new AddOwnerPage(page);
    await use(addOwnerPage);
  }
});

export { expect } from '@playwright/test';
