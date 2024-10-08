import fetch from "node-fetch";
import "dotenv/config";

class DiscordNotifier {
  constructor() {
    this.DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
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
      username: "BookDub Stream Notifications",
      avatar_url:
        "https://cdn.discordapp.com/icons/1123463570445844480/6211998a5621eb19fe58701d30def49d.webp?size=240",
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

  async sendMessage(message) {
    const messageTemplate = {
      content: message,
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
