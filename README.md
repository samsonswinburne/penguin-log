The local backend and PostgreSQL run in Docker. The frontend runs with npm on your computer, so no local Python installation is needed.

1. Copy .env.example to .env The example values are suitable for a disposable local database.
2. Start the backend and database from the repository root:
   docker compose -f compose.dev.yaml up --build
3. In a second terminal, start the frontend:
   cd frontend
   npm ci
   npm run dev

Open http://localhost:3000. Register a disposable test user, then log in. The browser keeps a random login token in sessionStorage for that tab. It expires after one day; logging in again replaces the previous token. Log out to invalidate it immediately.

The backend creates the auth_tokens table on startup. The existing users table is unchanged. These are test-only accounts: passwords are stored as plain text, so do not reuse a real password.
