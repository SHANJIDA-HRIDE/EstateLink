import { test, expect } from '../fixtures/customTest';
import { Helpers } from '../utils/helpers';

test.describe('Organization Member Management', () => {

  test('Add new Org member and assert addition', async ({ memberListPage, addMemberPage }) => {
    // Generate unique test data via helper
    const testData = Helpers.generateMemberData();

    // 1. Navigate to Member List
    await memberListPage.navigateTo();
    
    // 2. Click Add Member to start the flow
    await memberListPage.clickAddMember();
    await addMemberPage.waitForNetworkIdle();
    
    // 3. Step 1: General Information
    await addMemberPage.fillGeneralInfo(testData.name, testData.email, testData.contact);
    await addMemberPage.clickNext();

    // 4. Step 2: Member Type & Role
    await addMemberPage.selectRoleAndType();
    await addMemberPage.clickNext();

    // 5. Step 3: Login Credentials
    await addMemberPage.clickSubmit();
    // Wait for the API call to complete before checking for success message
    await addMemberPage.waitForNetworkIdle();

    // 6. Wait for success dialog and click OK
    await addMemberPage.handleSuccessDialog();
  });

});
