/**
 * Test credentials sourced exclusively from environment variables.
 * Never commit real secrets. Set ADMIN_EMAIL / ADMIN_PASSWORD in a local .env
 * (see .env.example) or via CI secrets.
 */
function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var "${name}". Copy .env.example to .env and fill it in, or set it in your CI secrets.`,
    );
  }
  return value;
}

export const credentials = {
  users: {
    admin: {
      get email() {
        return required('ADMIN_EMAIL');
      },
      get password() {
        return required('ADMIN_PASSWORD');
      },
    },
  },
};
