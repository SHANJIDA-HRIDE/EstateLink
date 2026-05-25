import { expect } from '@playwright/test';
import { BasePage } from '../Base/BasePage';
import { ENV } from '../../env/env.config';

/**
 * Member profile / detail page (/member-profile/{id}).
 * Fields render as <div.flex.flex-col><p>LABEL</p><div>VALUE</div></div>;
 * empty values show as "--". Uploaded media is served from
 * api.estatelink.cloud/media/members/... (default avatar is /assets/user-*.png).
 */
export class MemberProfilePage extends BasePage {
  constructor(page) {
    super(page);
    this.editBtn = page.getByRole('button', { name: /^Edit$/ });
  }

  async navigateTo(id) {
    await this.navigate(`${ENV.BASE_URL}/member-profile/${id}`);
    await this.page.getByRole('tab', { name: 'Profile Information' }).waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Clicks a profile tab ("Profile Information" | "Organization Member" | "Community Member"). */
  async openTab(name) {
    const tab = this.page.getByRole('tab', { name });
    await tab.click();
    await this.page.waitForTimeout(800); // tab panel swaps content
  }

  /** Asserts all the given tabs are present on the profile. */
  async verifyTabsPresent(names) {
    for (const name of names) {
      await expect(this.page.getByRole('tab', { name })).toBeVisible({ timeout: 15000 });
    }
  }

  /**
   * Reads the value rendered next to a field label, or null if the label is absent.
   * Field markup varies by tab: label is a <p>, value is the next sibling (a <div>
   * on Profile Information, a <p> on the Organization/Community Member tabs).
   */
  async fieldValue(label) {
    return this.page.evaluate((lbl) => {
      for (const p of document.querySelectorAll('p')) {
        if (p.textContent.trim() === lbl) {
          const v = p.nextElementSibling;
          if (v) return v.textContent.trim();
        }
      }
      return null;
    }, label);
  }

  /** Asserts a field's value equals expected (polls through async profile load). */
  async verifyField(label, expected) {
    await expect.poll(() => this.fieldValue(label), { timeout: 15000 }).toBe(expected);
  }

  /** Asserts a field's value contains the substring (polls). */
  async verifyFieldContains(label, substring) {
    await expect
      .poll(async () => (await this.fieldValue(label)) || '', { timeout: 15000 })
      .toContain(substring);
  }

  /** src of the NID image by its alt text ("Front"|"Back"), or null. */
  async nidImageSrc(which) {
    return this.page.getByAltText(`NID ${which}`).first().getAttribute('src');
  }

  /** Asserts both NID images resolve to uploaded member media (not a placeholder). */
  async verifyNidImagesUploaded() {
    await expect.poll(() => this.nidImageSrc('Front'), { timeout: 15000 }).toContain('media/members');
    await expect.poll(() => this.nidImageSrc('Back'), { timeout: 15000 }).toContain('media/members');
  }
}
