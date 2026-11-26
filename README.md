# CleanCity IoT

## MySQL-backed development setup

1. Install Node.js and MySQL. Create a database and a MySQL user with access to it:

   ```sql
   CREATE DATABASE cleancity CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'cleancity_app'@'127.0.0.1' IDENTIFIED BY 'use-a-strong-password';
   GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, REFERENCES ON cleancity.* TO 'cleancity_app'@'127.0.0.1';
   FLUSH PRIVILEGES;
   ```

2. Copy `.env.example` to `.env` and set your database credentials, a random `SESSION_SECRET` (at least 32 characters), a private `REGISTRATION_CODE`, and a unique bootstrap admin email/password (at least 12 characters). The first startup creates that Super Admin only when the users table is empty. Keep `.env` private.
3. Install dependencies, build the frontend, and start the Node server:

   ```sh
   npm install
   npm run build
   npm run dev
   ```

   Open `http://127.0.0.1:3001`. The Node API serves the built website from `dist/` and creates its tables on startup. Users register with the private registration code and require Super Admin approval before signing in. The app's dashboard data is stored in the MySQL `app_state` table; account credentials are stored separately as bcrypt hashes.

`npm run dev` and `npm start` run the Node API and serve the built frontend. Use `npm run dev:frontend` for Vite hot reload during UI development; it proxies API requests to port 3001. In production, serve the frontend and API on the same origin over HTTPS and set `NODE_ENV=production`.

The Android app can sign in with `POST /api/auth/login` and read bin status from `GET /api/bins` using the returned Bearer session token. Store that token in Android secure storage.

## Mobile WebSocket connection

Set `API_HOST=0.0.0.0` in `.env` when the API is reached by a phone or mobile app on the local network. Restart the API after changing it.

Sign in with `POST /api/auth/login`. The response includes `session_token`; keep this token in secure mobile storage.

Connect to `ws://SERVER_ADDRESS:3001/ws?token=SESSION_TOKEN` in development, or `wss://YOUR_DOMAIN/ws` in production when the API is served behind TLS.

Protocol:

- Send `{"type":"subscribe"}` or `{"type":"state.request"}` to receive the current application state.
- The server sends `{"type":"connected","user":...}` after authentication.
- State changes are sent as `{"type":"state.updated","state":...,"timestamp":...}`.
- Account changes are sent as `{"type":"user.updated","user":...,"timestamp":...}`.
- Send `{"type":"ping"}` for a heartbeat; the server replies with `{"type":"pong",...}`.

WebSocket connections reject missing or expired session tokens. Mobile apps must not expose `SESSION_SECRET` or database credentials.
