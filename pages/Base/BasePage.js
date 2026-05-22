export class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to the specified URL or base path
   * @param {string} path 
   */
  async navigate(path) {
    await this.page.goto(path);
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for a specific URL pattern
   * @param {string | RegExp | Function} url 
   */
  async waitForUrl(url) {
    await this.page.waitForURL(url, { timeout: 15000 });
  }
}
