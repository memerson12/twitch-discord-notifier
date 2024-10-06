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

  async getStreamByName(username, retries = 3, backoff = 1000) {
    try {
      const streams = await this.#makeRequest(
        `https://api.twitch.tv/helix/streams?user_login=${username}`
      );
      return streams.data[0];
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying in ${backoff}ms... (${retries} retries left)`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        return this.getStreamByName(username, retries - 1, backoff * 2); // Exponential backoff
      } else {
        throw new Error(`Failed after multiple attempts: ${error.message}`);
      }
    }
  }
}

export default TwitchClient;

