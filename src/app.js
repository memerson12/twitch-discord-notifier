import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { json } from "express";
import { config } from "./config/index.js";
import { verifyTwitchWebhook } from "./middleware/twitch-verify.js";
import { requireAuth } from "./middleware/auth.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import authRoutes from "./routes/auth.js";
import streamersRoutes from "./routes/streamers.js";
import webhookRoutes from "./routes/webhook.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Create MemoryStore instance
const MemoryStoreSession = MemoryStore(session);

// Session middleware with MemoryStore
app.use(
  session({
    cookie: {
      maxAge: 86400000, // 24 hours
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
    },
    store: new MemoryStoreSession({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    secret: config.hook_secret || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === "production", // trust the reverse proxy
  })
);

// JSON body parser with Twitch webhook verification
app.use(
  json({
    verify: verifyTwitchWebhook,
  })
);

// Routes
app.use("/", authRoutes);
app.use("/api/streamers", streamersRoutes);
app.use("/webhook", webhookRoutes);

// Protected assets
app.get("/css/*", requireAuth, (req, res) => {
  const filePath = join(__dirname, "assets", req.path);
  res.sendFile(filePath);
});

app.get("/js/*", requireAuth, (req, res) => {
  const filePath = join(__dirname, "assets", req.path);
  res.sendFile(filePath);
});

// Protected index route
app.get("/", requireAuth, (req, res) => {
  res.sendFile("index.html", { root: "./public" });
});

// Public static files (only for login.html)
app.use(
  express.static("public", {
    index: false,
  })
);

export default app;
