import path from 'path';
import { test } from '../../fixtures/customTest';
import { Helpers } from '../../utils/helpers';

const attachments = ['Announcement1.png', 'Announcement2.jpeg', 'Announcement3.pdf'].map((f) =>
  path.resolve(process.cwd(), 'test-data', 'files', f),
);

test.describe('Announcement Management', () => {
  test.describe.configure({ mode: 'serial' });

  test('Create Post as:Creator an ongoing announcement and verify it under the Ongoing tab', async ({
    announcementsPage,
    addAnnouncementPage,
  }) => {
    test.setTimeout(120000);

    const id = Helpers.uniqueId();
    const data = {
      title: `Auto Announcement ${id}`,
      description: `Automated ongoing announcement created by E2E test ${id}.`,
      labelName: `AutoLabel ${id}`,
      attachments,
    };

    // Open the create form
    await announcementsPage.navigateTo();
    await announcementsPage.clickCreateAnnouncement();

    // Fill, attach, label, urgent priority, all towers + all units, send
    // (default dates span today, so the announcement is Ongoing).
    await addAnnouncementPage.createOngoingAnnouncement(data);

    // Verify it appears under the Ongoing tab
    await announcementsPage.verifyAnnouncementInOngoing(data.title);
  });

  test('Create a Post as: other member-targeted upcoming announcement and verify it under the Upcoming tab', async ({
    announcementsPage,
    addAnnouncementPage,
  }) => {
    test.setTimeout(120000);

    const id = Helpers.uniqueId();
    // Start tomorrow, end 2 days after start -> scheduled, so it lands in Upcoming.
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);

    const data = {
      title: `Auto Upcoming ${id}`,
      description: `Automated member-targeted upcoming announcement ${id}.`,
      memberSearch: 'Automation Org Member',
      labelName: `AutoLabel ${id}`,
      attachments: [path.resolve(process.cwd(), 'test-data', 'files', 'Announcement2.jpeg')],
      priority: 'High',
      startDate,
      endDate,
    };

    await announcementsPage.navigateTo();
    await announcementsPage.clickCreateAnnouncement();

    await addAnnouncementPage.createMemberAnnouncement(data);

    await announcementsPage.verifyAnnouncementInUpcoming(data.title);
  });

  // KNOWN DEFECT (found by automation): the End-Time picker updates its own display
  // but does not propagate to the form model, so the form treats end-time == start-time.
  // A same-day expiry window (end date = today) therefore can't be created — Send is
  // blocked with "End date/time must be after start date/time". This makes the requested
  // Ongoing -> Expired (1-minute) transition impossible via the UI. This negative test
  // guards that behavior; flip it to a real transition test once the picker is fixed.
  test('Announcement Visibility: same-day end is rejected because End-Time is not applied (BUG)', async ({
    announcementsPage,
    addAnnouncementPage,
  }) => {
    test.setTimeout(120000);

    const id = Helpers.uniqueId();
    const endDateTime = new Date();
    endDateTime.setHours(23, 55, 0, 0); // later TODAY, same day as the default start

    const data = {
      title: `Auto SameDayEnd ${id}`,
      description: `Attempt a same-day expiry window to exercise End-Time validation ${id}.`,
      labelName: `AutoLabel ${id}`,
      endDateTime,
    };

    await announcementsPage.navigateTo();
    await announcementsPage.clickCreateAnnouncement();

    await addAnnouncementPage.attemptSameDayExpiryExpectingError(data);
  });
});
