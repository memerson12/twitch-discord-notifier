# Twitch EventSub Webhook Integration

This repository contains a Node.js application designed to integrate with Twitch's EventSub system for receiving real-time notifications about Twitch events, such as when a streamer goes live. It uses Twitch API to manage subscriptions and notifies a Discord channel using webhooks when a streamer starts broadcasting.

## Features

- Twitch OAuth2 authentication for secure API requests.
- Subscription management to Twitch EventSub for receiving streamer events.
- Real-time notifications to a Discord channel when a streamer goes live.
- Secure handling of Twitch webhook callbacks with signature verification.
- HTTPS server setup for receiving Twitch webhook callbacks.

## Prerequisites

Before you start, ensure you have the following:

- Node.js installed on your machine.
- A Twitch account with a registered application to obtain your `Client ID` and `Client Secret`.
- A Discord account with a server and channel where you want to receive notifications, and the ability to create a webhook in that channel.

## Configuration

1. **Environment Variables**: Set up your `.env` file with the necessary credentials and paths:

   ```properties
   DISCORD_WEBHOOK=<Your Discord Webhook URL>
   TWITCH_CLIENT_ID=<Your Twitch Client ID>
   TWITCH_CLIENT_SECRET=<Your Twitch Client Secret>
   PORT=<Server Port, default is 443>
   HOOK_SECRET=<Your Secret for Twitch Hook Verification>
   SSL_KEY_PATH=<Path to SSL Key>
   SSL_CERT_PATH=<Path to SSL Certificate>
   CALLBACK_URL=<Your Public Callback URL for Twitch Webhooks>
   ```

2. **SSL Certificate**: For local development, you can use tools like `mkcert` to generate a local SSL certificate and key.

3. **Streamers List**: Add the streamers you want to follow in the `streamers.json` file in the following format:

   ```json
   [
     {
       "streamer_name": "example_streamer",
       "going_live_message": "Example Streamer is now live!"
     }
   ]
   ```

## Running the Application

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server:

   ```bash
   npm start
   ```

The server will start, and it will automatically create subscriptions for the streamers listed in `streamers.json`. When one of these streamers goes live, a notification will be sent to the configured Discord channel.

## Handling Webhook Callbacks

The application listens for POST requests on the root path (`/`). It verifies the signature of incoming requests to ensure they are from Twitch, handles subscription verification challenges, and processes notifications about stream events.

## Security

- Always keep your Twitch `Client Secret` and Discord `Webhook URL` private.
- Use a secure `HOOK_SECRET` for verifying the integrity of incoming webhook events.
- Ensure your `CALLBACK_URL` is served over HTTPS.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or create an issue for any bugs or feature requests.

## License

This project is open-source and available under the MIT License.
