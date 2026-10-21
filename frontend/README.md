# EstateIQ property valuation

EstateIQ is a React/Vite frontend connected to the FastAPI service in
`../backend`. Sign-in and signup use HttpOnly access/refresh cookies. The
property prediction page and prediction API both require an authenticated
session.

## Start the application

1. Configure PostgreSQL and the API secrets using
   [`../backend/README.md`](../backend/README.md). Do not overwrite an
   existing `.env`; add the required settings to it.
2. Start the FastAPI service on port 8000.
3. From this folder, install the frontend dependencies and start Vite:

   ```powershell
   npm install
   npm run dev
   ```

Open `http://localhost:5173`. The frontend calls `http://localhost:8001` by
default. Set `VITE_API_URL` in a local `.env` file if the API is hosted
elsewhere.

## Authentication flow

- `/signup` creates an account and starts a session.
- `/login` restores access to the requested route after signing in.
- `/auth/me` restores the current user on reload, using `/auth/refresh` when
  the access cookie has expired.
- Signing out clears both cookies.
- The `/prediction` page redirects signed-out users to login, and `/predict`
  rejects requests without a valid session.
