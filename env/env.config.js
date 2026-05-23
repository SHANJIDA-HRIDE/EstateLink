/**
 * Central environment configuration.
 * Values are sourced from process.env (loaded from a local .env via dotenv in
 * playwright.config.js). Defaults are safe, non-secret values only.
 */
export const ENV = {
  BASE_URL: process.env.BASE_URL || 'https://control.estatelink.cloud',
};
