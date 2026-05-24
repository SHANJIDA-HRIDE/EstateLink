import path from 'path';
import { test } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

const attachments = ['Announcement1.png', 'Announcement2.jpeg', 'Announcement3.pdf'].map((f) =>
  path.resolve(process.cwd(), 'test-data', 'files', f),
);

test.describe('Notice Board Management', () => {
  test.describe.configure({ mode: 'serial' });

  test('Add a new notice with current time (Ongoing) and verify it under the Ongoing tab', async ({
    noticeBoardPage,
    addNoticePage,
  }) => {
    test.setTimeout(120000);

    const id = Helpers.uniqueId();
    const data = {
      labelName: `AutoLabel ${id}`,
      attachments,
    };

    // Navigate to Notice Board and open the create form
    await noticeBoardPage.navigateTo();
    await noticeBoardPage.clickAddNotice();

    // Fill: 3 attachments, create & add a label, set priority to Urgent,
    // select all towers & all units, then send.
    // Default dates span today → today+2, so the notice is Ongoing.
    await addNoticePage.createOngoingNotice(data);

    // Verify the notice appears under the Ongoing tab
    await noticeBoardPage.verifyNoticeInOngoing(data.labelName);

    // Verify the "New Notice has been posted by - Shanjida Hride" notification triggered
    await noticeBoardPage.verifyNewNoticeNotification('Shanjida Hride');
  });

  test('Create a member-targeted upcoming notice (2 attachments, High) and verify it under the Upcoming tab', async ({
    noticeBoardPage,
    addNoticePage,
  }) => {
    test.setTimeout(120000);

    const id = Helpers.uniqueId();
    // Start tomorrow, end 2 days after start -> scheduled, so it lands in Upcoming.
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);

    const data = {
      memberSearch: 'Automation Org Member',
      labelName: `AutoLabel ${id}`,
      attachments: attachments.slice(0, 2), // 2 attachments
      priority: 'High',
      startDate,
      endDate,
    };

    await noticeBoardPage.navigateTo();
    await noticeBoardPage.clickAddNotice();

    await addNoticePage.createMemberNotice(data);

    await noticeBoardPage.verifyNoticeInUpcoming(data.labelName);
  });
});
