import "dotenv/config";

export const config = {
  port: process.env.PORT || 8000,
  hook_secret: process.env.HOOK_SECRET,
  sslKeyPath: process.env.SSL_KEY_PATH,
  sslCertPath: process.env.SSL_CERT_PATH,
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
  twitch: {
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    callbackUrl: process.env.CALLBACK_URL
  },
  discord: {
    webhook: process.env.DISCORD_WEBHOOK
  }
};