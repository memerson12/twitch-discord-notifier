import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { requireAuth } from '../middleware/auth.js';
import TwitchClient from '../services/twitch.js';

const router = express.Router();
const twitchClient = new TwitchClient();
let streamersData = JSON.parse(readFileSync("./data/streamers.json", "utf-8"));

router.get('/', requireAuth, (req, res) => {
  res.json(streamersData);
});

router.post('/', requireAuth, async (req, res) => {
  const { streamer_name, going_live_message } = req.body;
  
  if (!streamer_name || !going_live_message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (streamersData.some(s => s.streamer_name === streamer_name)) {
    return res.status(400).json({ error: 'Streamer already exists' });
  }

  streamersData.push({ streamer_name, going_live_message });
  writeFileSync('./data/streamers.json', JSON.stringify(streamersData, null, 2));

  try {
    const user = await twitchClient.getUserByName(streamer_name);
    await twitchClient.createOnlineWebhookSubscription(user.id);
  } catch (error) {
    console.error('Error creating subscription:', error);
    streamersData = streamersData.filter(s => s.streamer_name !== streamer_name);
    writeFileSync('./data/streamers.json', JSON.stringify(streamersData, null, 2));
    return res.status(400).json({ error: 'Invalid Twitch username' });
  }

  res.json({ success: true });
});

router.put('/', requireAuth, async (req, res) => {
  const { oldName, newName, newMessage } = req.body;
  
  const streamerIndex = streamersData.findIndex(s => s.streamer_name === oldName);
  if (streamerIndex === -1) {
    return res.status(404).json({ error: 'Streamer not found' });
  }

  streamersData[streamerIndex] = {
    streamer_name: newName,
    going_live_message: newMessage
  };

  writeFileSync('./data/streamers.json', JSON.stringify(streamersData, null, 2));

  if (oldName !== newName) {
    try {
      const oldUser = await twitchClient.getUserByName(oldName);
      const subs = await twitchClient.getSubscriptions();
      const oldSub = subs.data.find(sub => 
        sub.condition.broadcaster_user_id === oldUser.id
      );

      if (oldSub) {
        await twitchClient.deleteSubscription(oldSub.id);
      }

      const newUser = await twitchClient.getUserByName(newName);
      await twitchClient.createOnlineWebhookSubscription(newUser.id);
    } catch (error) {
      console.error('Error updating subscription:', error);
      streamersData[streamerIndex] = { streamer_name: oldName, going_live_message: newMessage };
      writeFileSync('./data/streamers.json', JSON.stringify(streamersData, null, 2));
      return res.status(400).json({ error: 'Invalid Twitch username' });
    }
  }

  res.json({ success: true });
});

router.delete('/', requireAuth, async (req, res) => {
  const { streamerName } = req.body;
  
  const streamerIndex = streamersData.findIndex(s => s.streamer_name === streamerName);
  if (streamerIndex === -1) {
    return res.status(404).json({ error: 'Streamer not found' });
  }

  try {
    const user = await twitchClient.getUserByName(streamerName);
    const subs = await twitchClient.getSubscriptions();
    const sub = subs.data.find(sub => 
      sub.condition.broadcaster_user_id === user.id
    );

    if (sub) {
      await twitchClient.deleteSubscription(sub.id);
    }
  } catch (error) {
    console.error('Error removing subscription:', error);
  }

  streamersData.splice(streamerIndex, 1);
  writeFileSync('./data/streamers.json', JSON.stringify(streamersData, null, 2));

  res.json({ success: true });
});

export default router;