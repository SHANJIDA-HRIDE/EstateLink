import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/Login/LoginPage';
import { MemberListPage } from '../pages/Org Member/MemberListPage';
import { AddMemberPage } from '../pages/Org Member/AddMemberPage';
import { ViewTowersPage } from '../pages/Tower/ViewTowersPage';
import { AddTowerPage } from '../pages/Tower/AddTowerPage';
import { UnitDetailsPage } from '../pages/Unit/UnitDetailsPage';
import { EditUnitGeneralPage } from '../pages/Unit/EditUnitGeneralPage';
import { AddOwnerPage } from '../pages/Owner/AddOwnerPage';
import { UnitOwnersPage } from '../pages/Owner/UnitOwnersPage';
import { AddResidentPage } from '../pages/Resident/AddResidentPage';
import { UnitResidentsPage } from '../pages/Resident/UnitResidentsPage';
import { AddStaffPage } from '../pages/Staff/AddStaffPage';
import { UnitStaffPage } from '../pages/Staff/UnitStaffPage';
import { RoleListPage } from '../pages/Role/RoleListPage';
import { AddRolePage } from '../pages/Role/AddRolePage';
import { GroupListPage } from '../pages/Group/GroupListPage';
import { AddGroupPage } from '../pages/Group/AddGroupPage';
import { AnnouncementsPage } from '../pages/Announcement/AnnouncementsPage';
import { AddAnnouncementPage } from '../pages/Announcement/AddAnnouncementPage';
import { NoticeBoardPage } from '../pages/Notice/NoticeBoardPage';
import { AddNoticePage } from '../pages/Notice/AddNoticePage';

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
  },
  addResidentPage: async ({ page }, use) => {
    const addResidentPage = new AddResidentPage(page);
    await use(addResidentPage);
  },
  unitResidentsPage: async ({ page }, use) => {
    const unitResidentsPage = new UnitResidentsPage(page);
    await use(unitResidentsPage);
  },
  addStaffPage: async ({ page }, use) => {
    const addStaffPage = new AddStaffPage(page);
    await use(addStaffPage);
  },
  unitStaffPage: async ({ page }, use) => {
    const unitStaffPage = new UnitStaffPage(page);
    await use(unitStaffPage);
  },
  roleListPage: async ({ page }, use) => {
    const roleListPage = new RoleListPage(page);
    await use(roleListPage);
  },
  addRolePage: async ({ page }, use) => {
    const addRolePage = new AddRolePage(page);
    await use(addRolePage);
  },
  groupListPage: async ({ page }, use) => {
    const groupListPage = new GroupListPage(page);
    await use(groupListPage);
  },
  addGroupPage: async ({ page }, use) => {
    const addGroupPage = new AddGroupPage(page);
    await use(addGroupPage);
  },
  announcementsPage: async ({ page }, use) => {
    const announcementsPage = new AnnouncementsPage(page);
    await use(announcementsPage);
  },
  addAnnouncementPage: async ({ page }, use) => {
    const addAnnouncementPage = new AddAnnouncementPage(page);
    await use(addAnnouncementPage);
  },
  noticeBoardPage: async ({ page }, use) => {
    const noticeBoardPage = new NoticeBoardPage(page);
    await use(noticeBoardPage);
  },
  addNoticePage: async ({ page }, use) => {
    const addNoticePage = new AddNoticePage(page);
    await use(addNoticePage);
  }
});

export { expect } from '@playwright/test';
