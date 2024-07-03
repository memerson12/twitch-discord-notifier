import fetch from "node-fetch";

class TwitchClient {
  #access_token;
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async connect() {
    const tokenData = await this.#generateToken();
    this.#access_token = tokenData.access_token;
  }

  #makeRequest = async (url, options = {}, retry = false) => {
    const rawRes = await fetch(url, {
      ...options,
      headers: {
        "Client-ID": this.clientId,
        Authorization: `Bearer ${this.#access_token}`,
        ...options?.headers,
      },
    });
    if (!rawRes.ok) {
      if (rawRes.status === 401 && !retry) {
        await this.connect();
        return this.#makeRequest(url, options, true);
      }
      throw new Error(
        `Failed to make request: ${rawRes.statusText} - ${await rawRes.text()}`
      );
    }
    if (rawRes.status === 204) return;
    return await rawRes.json();
  };

  async #generateToken() {
    const body = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: "client_credentials",
    };

    const rawRes = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!rawRes.ok) {
      throw new Error(`Failed to generate token: ${rawRes.statusText}`);
    }
    return await rawRes.json();
  }

  async getSubscriptions() {
    const res = await this.#makeRequest(
      "https://api.twitch.tv/helix/eventsub/subscriptions"
    );
    return res;
  }

  async deleteSubscription(id) {
    await this.#makeRequest(
      `https://api.twitch.tv/helix/eventsub/subscriptions?id=${id}`,
      { method: "DELETE" }
    );
  }

  async createOnlineWebhookSubscription(userId, webhookUrl, secret) {
    const body = {
      type: "stream.online",
      version: "1",
      condition: {
        broadcaster_user_id: userId,
      },
      transport: {
        method: "webhook",
        callback: webhookUrl,
        secret: secret,
      },
    };

    const res = await this.#makeRequest(
      "https://api.twitch.tv/helix/eventsub/subscriptions",
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return res;
  }

  async getUserByName(username) {
    const users = await this.#makeRequest(
      `https://api.twitch.tv/helix/users?login=${username}`
    );
    return users.data[0];
  }

  async getUsersByNames(usernames) {
    const users = await this.#makeRequest(
      `https://api.twitch.tv/helix/users?login=${usernames.join("&login=")}`
    );
    return users.data;
  }

  async getUserById(userId) {
    const users = await this.#makeRequest(
      `https://api.twitch.tv/helix/users?id=${userId}`
    );
    return users.data[0];
  }

  async getUsersByIds(userIds) {
    const users = await this.#makeRequest(
      `https://api.twitch.tv/helix/users?id=${userIds.join("&id=")}`
    );
    return users.data;
  }

  async getStreamByUserId(userId) {
    const streams = await this.#makeRequest(
      `https://api.twitch.tv/helix/streams?user_id=${userId}`
    );
    return streams.data[0];
  }

  async getStreamByName(username) {
    const streams = await this.#makeRequest(
      `https://api.twitch.tv/helix/streams?user_login=${username}`
    );
    return streams.data[0];
  }
}

// const twitchClient = new TwitchClient(

// );

export default TwitchClient;

// await twitchClient.connect();
// const user = await twitchClient.getUserByName("king_kvothe");
// console.log(user);
// const stream = await twitchClient.getStreamByName("king_kvothe");
// console.log(stream);

// const streamInfoJson = {
//   game: stream.game_name,
//   title: stream.title,
//   thumbnailURL: stream.thumbnail_url
//     .replace("{width}", 716)
//     .replace("{height}", 404),
//   streamerName: stream.user_login,
//   streamStart: stream.started_at,
//   profileURL: user.profile_image_url,
//   streamURL: `https://twitch.tv/${stream.user_login}`,
//   //   goingLiveMessage,
// };

// console.log(streamInfoJson);
// console.log(await twitchClient.getUsersByNames(["elisthetic", "king_kvothe"]));
// await twitchClient.getSubscriptions().then(console.log).catch(console.error);
// await twitchClient.deleteSubscription("ac21eb5f-7b16-405b-b816-47d9055e5ace");
// await twitchClient.createOnlineWebhookSubscription(
//   "104889000",
//   "https://a880-23-123-247-200.ngrok-free.app",
//   "bookdub_secret22"
// );
// await twitchClient.getSubscriptions().then(console.log).catch(console.error);
