import express from "express";
import { readFileSync } from "fs";
import TwitchClient from "../services/twitch.js";
import DiscordNotifier from "../services/discord.js";

const router = express.Router();
const twitchClient = new TwitchClient();
const notifier = new DiscordNotifier();

router.post("/", async (req, res) => {
  if (res.headersSent) return;

  if (req.twitch_eventsub) {
    if (
      req.headers["twitch-eventsub-message-type"] ==
      "webhook_callback_verification"
    ) {
      if (req.body.hasOwnProperty("challenge")) {
        console.log("Got a challenge, return the challenge");
        res.send(encodeURIComponent(req.body.challenge));
        return;
      }
      res.status(403).send("Denied");
    } else if (req.headers["twitch-eventsub-message-type"] == "revocation") {
      res.send("Ok");
    } else if (req.headers["twitch-eventsub-message-type"] == "notification") {
      res.send("Ok");

      try {
        const event = req.body.event;
        const streamer = event.broadcaster_user_name;

        console.log(`--------\nIncoming event for ${streamer}`);

        const user = await twitchClient.getUserByName(streamer);
        const stream = await twitchClient.getStreamByName(streamer);

        const streamersData = JSON.parse(
          readFileSync("./data/streamers.json", "utf-8")
        );
        console.log(streamersData);
        const goingLiveMessage = streamersData.find(
          (streamerInfo) =>
            streamerInfo.streamer_name === event.broadcaster_user_login
        ).going_live_message;

        if (stream) {
          const streamInfoJson = {
            game: stream.game_name,
            title: stream.title,
            thumbnailURL: stream.thumbnail_url
              .replace("{width}", 800)
              .replace("{height}", 500),
            streamerName: stream.user_login ?? streamer,
            streamStart: stream.started_at ?? new Date().toISOString(),
            profileURL:
              user.profile_image_url ??
              "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_300x300.png",
            streamURL: `https://twitch.tv/${stream.user_login ?? streamer}`,
            goingLiveMessage,
          };
          console.log(`Sending notification for ${streamer}`);
          notifier.notify(streamInfoJson);
        } else {
          console.warn("Was not able to fetch stream info");
          notifier.sendMessage(
            `${goingLiveMessage}: https://twitch.tv/${streamer}`
          );
        }
      } catch (error) {
        console.error("Error:", error);
      }
    } else {
      console.log("Invalid hook sent to me");
      res.send("Ok");
    }
  } else {
    console.log("It didn't seem to be a Twitch Hook");
    res.send("Ok");
  }
});

export default router;
