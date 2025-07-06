import { createServer } from "http";
import app from "./app.js";
import { config } from "./config/index.js";
import TwitchClient from "./services/twitch.js";
import { readFileSync } from "fs";

const server = createServer(app);
const twitchClient = new TwitchClient();

async function setupTwitchSubscriptions() {
  const streamersData = JSON.parse(
    readFileSync("./data/streamers.json", "utf-8")
  );

  await twitchClient.connect();
  console.log("Twitch client connected");

  const currentSubs = await twitchClient.getSubscriptions();
  console.log("Fetched Current Subscriptions");

  for (const streamer of streamersData) {
    const streamerFetch = await twitchClient.getUserByName(
      streamer.streamer_name
    );
    if (!streamerFetch) {
      console.warn(`Could not get streamer by name: ${streamer.streamer_name}`);
      continue;
    }
    const streamerID = streamerFetch.id;
    const currentSub = currentSubs.data.findIndex(
      (sub) => sub.condition.broadcaster_user_id === streamerID
    );

    if (currentSub === -1) {
      console.log("Creating Subscription for", streamer.streamer_name);
      await twitchClient.createOnlineWebhookSubscription(streamerID);
    } else {
      const paddedStreamerName = streamer.streamer_name.padEnd(20, " ");
      console.log(
        "Subscription already exists for",
        paddedStreamerName,
        " | Status: ",
        currentSubs.data[currentSub].status
      );
    }

    currentSubs.data.splice(currentSub, 1);
  }

  for (const sub of currentSubs.data) {
    console.log(
      "Deleting Subscription for",
      (await twitchClient.getUserById(sub.condition.broadcaster_user_id))
        .display_name
    );
    await twitchClient.deleteSubscription(sub.id);
  }

  console.log("Finished Subscription Setup");
}

server.listen(config.port, async () => {
  console.log("Server raised on", config.port);
  await setupTwitchSubscriptions();
  console.log("\nListening for Twitch Hooks...");
  console.log("-----------------------------");
});
