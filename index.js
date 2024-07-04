import { readFileSync } from "fs";
import { createServer } from "https";
import TwitchClient from "./twitch.js";
import DiscordNotifier from "./discord.js";
import "dotenv/config";

// Load configuation
const config = {
  port: process.env.PORT || 8000,
  hook_secret: process.env.HOOK_SECRET,
  sslKeyPath: process.env.SSL_KEY_PATH,
  sslCertPath: process.env.SSL_CERT_PATH,
};

// Require depedancies
// express is used for handling incoming HTTP requests "like a webserver"
import express, { json } from "express";
// cypto handles Crpytographic functions, sorta like passwords (for a bad example)
import { createHmac } from "crypto";
import tsscmp from "tsscmp";

const notifier = new DiscordNotifier();

const twitchClient = new TwitchClient(
  process.env.TWITCH_CLIENT_ID,
  process.env.TWITCH_CLIENT_SECRET
);

const streamersData = JSON.parse(readFileSync("./streamers.json", "utf-8"));

// Express basics
const app = express();

const sslOptions = {
  key: readFileSync(config.sslKeyPath),
  cert: readFileSync(config.sslCertPath),
};

const http = createServer(sslOptions, app);

http.listen(config.port, async function () {
  console.log("Server raised on", config.port);
  twitchClient.connect();
  console.log("Twitch client connected");
  console.log("Loaded Streamer Alerts");
  const currentSubs = await twitchClient.getSubscriptions();
  console.log("Fetched Current Subscriptions");

  // Check if we have a subscription for each streamer
  for (const streamer of streamersData) {
    const streamerID = (
      await twitchClient.getUserByName(streamer.streamer_name)
    ).id;

    const currentSub = currentSubs.data.findIndex(
      (sub) => sub.condition.broadcaster_user_id === streamerID
    );
    if (currentSub === -1) {
      console.log("Creating Subscription for", streamer.streamer_name);
      await twitchClient.createOnlineWebhookSubscription(
        streamerID,
        process.env.CALLBACK_URL,
        "bookdub_secret22"
      );
    } else {
      console.log("Subscription already exists for", streamer.streamer_name);
    }

    currentSubs.data.splice(currentSub, 1);
  }

  // Clean up any subscriptions that are no longer needed
  for (const sub of currentSubs.data) {
    console.log(
      "Deleting Subscription for",
      (await twitchClient.getUserById(sub.condition.broadcaster_user_id))
        .display_name
    );
    await twitchClient.deleteSubscription(sub.id);
  }
  console.log("Finished Subscription Setup");
  console.log("\nListening for Twitch Hooks...");
  console.log("-----------------------------");
});

// Middleware
app.use(
  json({
    verify: function (req, res, buf, encoding) {
      // is there a hub to verify against
      req.twitch_eventsub = false;
      if (
        req.headers &&
        req.headers.hasOwnProperty("twitch-eventsub-message-signature")
      ) {
        req.twitch_eventsub = true;

        // id for dedupe
        let message_id = req.headers["twitch-eventsub-message-id"];
        // check age
        let timestamp = req.headers["twitch-eventsub-message-timestamp"];
        // extract algo and signature for comparison
        let [signatureAlgo, signatureHash] =
          req.headers["twitch-eventsub-message-signature"].split("=");

        if (signatureAlgo !== "sha256") {
          console.log("Signature algo not matched");
          res.status(500).send("Invalid signature algo");
          return;
        }

        const ourSignatureHash = createHmac("sha256", config.hook_secret)
          .update(`${message_id}${timestamp}${buf}`)
          .digest("hex");

        if (!signatureHash || !tsscmp(signatureHash, ourSignatureHash)) {
          console.log("Signature not matched");
          res.status(500).send("Signature not matched");
          return;
        }

        res.set("Content-Type", "text/plain");
        console.log("Signature matched");
      }
    },
  })
);

// Routes
app
  .route("/")
  .get((req, res) => {
    console.log("Incoming Get request on /");
    res.send("There is no GET Handler");
  })
  .post(async (req, res) => {
    console.log("Incoming Post request on /", req.body);

    if (res.headersSent) return;

    if (req.twitch_eventsub) {
      // is it a verification request
      if (
        req.headers["twitch-eventsub-message-type"] ==
        "webhook_callback_verification"
      ) {
        // it's a another check for if it's a challenge request
        if (req.body.hasOwnProperty("challenge")) {
          console.log("Got a challenge, return the challenge");
          res.send(encodeURIComponent(req.body.challenge));
          return;
        }
        // unexpected hook request
        res.status(403).send("Denied");
      } else if (req.headers["twitch-eventsub-message-type"] == "revocation") {
        // the webhook was revoked
        // you should probably do something more useful here
        // than this example does
        res.send("Ok");
      } else if (
        req.headers["twitch-eventsub-message-type"] == "notification"
      ) {
        console.log("The signature matched");
        // the signature passed so it should be a valid payload from Twitch
        // we ok as quickly as possible
        res.send("Ok");

        // you can do whatever you want with the data
        // it's in req.body

        try {
          const event = req.body.event;
          const streamer = event.broadcaster_user_name;

          const user = await twitchClient.getUserByName(streamer);
          const stream = await twitchClient.getStreamByName(streamer);

          const goingLiveMessage = streamersData.find(
            (streamerInfo) =>
              streamerInfo.streamer_name === event.broadcaster_user_login
          ).going_live_message;

          const streamInfoJson = {
            game: stream.game_name,
            title: stream.title,
            thumbnailURL: stream.thumbnail_url
              .replace("{width}", 716)
              .replace("{height}", 404),
            streamerName: stream.user_login,
            streamStart: stream.started_at,
            profileURL: user.profile_image_url,
            streamURL: `https://twitch.tv/${stream.user_login}`,
            goingLiveMessage,
          };

          notifier.notify(streamInfoJson);
        } catch (error) {
          console.error("Error:", error);
          // Handle the error here
        }
      } else {
        console.log("Invalid hook sent to me");
        // probably should error here as an invalid hook payload
        res.send("Ok");
      }
    } else {
      console.log("It didn't seem to be a Twitch Hook");
      // again, not normally called
      // but dump out a OK
      res.send("Ok");
    }
  });
