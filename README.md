The local backend and PostgreSQL run in Docker. The frontend runs with npm on your computer, so no local Python installation is needed.

1. Copy .env.example to .env The example values are suitable for a disposable local database.
2. Start the backend and database from the repository root:
   docker compose -f compose.dev.yaml up --build
3. In a second terminal, start the frontend:
   cd frontend
   npm ci
   npm run dev

Open http://localhost:3000 to register a user. All routes behind /app (where the actual app will live) are protected by needing to be signed in

Before pushing a frontend change, run: 
npm run lint
npm run test
Before pushing a backend change, run:
python -m pytest -q

