import express from 'express';
import session from 'express-session';
import { json } from 'express';
import { config } from './config/index.js';
import { verifyTwitchWebhook } from './middleware/twitch-verify.js';
import { requireAuth } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import streamersRoutes from './routes/streamers.js';
import webhookRoutes from './routes/webhook.js';

const app = express();

// Session middleware
app.use(session({
  secret: config.hook_secret || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// JSON body parser with Twitch webhook verification
app.use(json({
  verify: verifyTwitchWebhook
}));

// Routes
app.use('/', authRoutes);
app.use('/api/streamers', streamersRoutes);
app.use('/webhook', webhookRoutes);

// Protected static files
app.get('/', requireAuth, (req, res) => {
  res.sendFile('index.html', { root: './public' });
});

// Public static files
app.use(express.static('public', {
  index: false
}));

export default app;