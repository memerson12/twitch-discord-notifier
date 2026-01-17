import "dotenv/config";

export const config = {
  port: process.env.PORT || 8000,
  hook_secret: process.env.HOOK_SECRET,
  adminPassword: process.env.ADMIN_PASSWORD || "admin",
  twitch: {
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    callbackUrl: process.env.CALLBACK_URL,
  },
  discord: {
    webhook: process.env.DISCORD_WEBHOOK,
  },
  page_title: process.env.PAGE_TITLE || "BookDub Streamer Notification Management",
  favicon_url: process.env.FAVICON_URL || "/images/favicon-32x32.png",
  bot_name: process.env.BOT_NAME || "BookDub Stream Notifications",
  bot_avatar_url:
    process.env.BOT_AVATAR_URL ||
    "https://cdn.discordapp.com/icons/1123463570445844480/6211998a5621eb19fe58701d30def49d.webp?size=240",
};
