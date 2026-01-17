import fetch from "node-fetch";
import { config } from "../config/index.js";

class DiscordNotifier {
  constructor() {
    this.DISCORD_WEBHOOK = config.discord.webhook;
  }

  async notify(streamInfoJson) {
    const messageTemplate = {
      content: streamInfoJson.goingLiveMessage || "",
      tts: false,
      embeds: [
        {
          description: "",
          fields: [
            {
              name: "Game",
              value: streamInfoJson.game,
              inline: true,
            },
            {
              name: "Viewers",
              value: "Yes Please",
              inline: true,
            },
          ],
          author: {
            name: `${streamInfoJson.streamerName} is live now on Twitch!`,
            url: streamInfoJson.streamURL,
            icon_url: streamInfoJson.profileURL,
          },
          title: streamInfoJson.title,
          image: {
            url: streamInfoJson.thumbnailURL,
          },
          url: streamInfoJson.streamURL,
          color: 9455359,
          footer: {
            text: "Memerson's Notifs",
          },
          timestamp: streamInfoJson.streamStart,
        },
      ],
      components: [],
      actions: {},
      username: config.bot_name,
      avatar_url:
        config.bot_avatar_url,
    };

    const message = await fetch(this.DISCORD_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageTemplate),
    });
    console.log(message.status, message.statusText, await message.text());
  }

  async sendMessage(content) {
    const messageTemplate = {
      content,
    };

    const message = await fetch(this.DISCORD_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageTemplate),
    });
    console.log(message.status, message.statusText, await message.text());
  }
}

export default DiscordNotifier;