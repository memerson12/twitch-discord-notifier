import { createHmac } from "crypto";
import tsscmp from "tsscmp";
import { config } from "../config/index.js";

export function verifyTwitchWebhook(req, res, buf, encoding) {
  req.twitch_eventsub = false;
  if (
    req.headers &&
    req.headers.hasOwnProperty("twitch-eventsub-message-signature")
  ) {
    req.twitch_eventsub = true;

    let message_id = req.headers["twitch-eventsub-message-id"];
    let timestamp = req.headers["twitch-eventsub-message-timestamp"];
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
}