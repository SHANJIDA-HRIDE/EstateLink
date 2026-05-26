import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/Login/LoginPage';
import { MemberListPage } from '../pages/Org Member/MemberListPage';
import { AddMemberPage } from '../pages/Org Member/AddMemberPage';
import { MemberProfilePage } from '../pages/Org Member/MemberProfilePage';
import { EditMemberGeneralPage } from '../pages/Org Member/EditMemberGeneralPage';
import { EditOrgMemberPage } from '../pages/Org Member/EditOrgMemberPage';
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
import { RoleProfilePage } from '../pages/Role/RoleProfilePage';
import { AddRolePage } from '../pages/Role/AddRolePage';
import { GroupListPage } from '../pages/Group/GroupListPage';
import { AddGroupPage } from '../pages/Group/AddGroupPage';
import { AnnouncementsPage } from '../pages/Announcement/AnnouncementsPage';
import { AddAnnouncementPage } from '../pages/Announcement/AddAnnouncementPage';
import { UnitContactsPage } from '../pages/Unit/UnitContactsPage';
import { ServiceFeeSettingsPage } from '../pages/ServiceFee/ServiceFeeSettingsPage';
import { ServiceFeeBillUploadsPage } from '../pages/ServiceFee/ServiceFeeBillUploadsPage';
import { BillingManagementPage } from '../pages/ServiceFee/BillingManagementPage';
import { ServiceFeeListPage } from '../pages/ServiceFee/ServiceFeeListPage';
import { NoticeBoardPage } from '../pages/Notice/NoticeBoardPage';
import { AddNoticePage } from '../pages/Notice/AddNoticePage';
import { CommunityMemberListPage } from '../pages/Community Member/CommunityMemberListPage';

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
  memberProfilePage: async ({ page }, use) => {
    const memberProfilePage = new MemberProfilePage(page);
    await use(memberProfilePage);
  },
  editMemberGeneralPage: async ({ page }, use) => {
    const editMemberGeneralPage = new EditMemberGeneralPage(page);
    await use(editMemberGeneralPage);
  },
  editOrgMemberPage: async ({ page }, use) => {
    const editOrgMemberPage = new EditOrgMemberPage(page);
    await use(editOrgMemberPage);
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
  roleProfilePage: async ({ page }, use) => {
    const roleProfilePage = new RoleProfilePage(page);
    await use(roleProfilePage);
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
  },
  unitContactsPage: async ({ page }, use) => {
    const unitContactsPage = new UnitContactsPage(page);
    await use(unitContactsPage);
  },
  serviceFeeSettingsPage: async ({ page }, use) => {
    const serviceFeeSettingsPage = new ServiceFeeSettingsPage(page);
    await use(serviceFeeSettingsPage);
  },
  serviceFeeBillUploadsPage: async ({ page }, use) => {
    const serviceFeeBillUploadsPage = new ServiceFeeBillUploadsPage(page);
    await use(serviceFeeBillUploadsPage);
  },
  billingManagementPage: async ({ page }, use) => {
    const billingManagementPage = new BillingManagementPage(page);
    await use(billingManagementPage);
  },
  serviceFeeListPage: async ({ page }, use) => {
    const serviceFeeListPage = new ServiceFeeListPage(page);
    await use(serviceFeeListPage);
  },
  communityMemberListPage: async ({ page }, use) => {
    const communityMemberListPage = new CommunityMemberListPage(page);
    await use(communityMemberListPage);
  }
});

export { expect } from '@playwright/test';
