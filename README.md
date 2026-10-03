# PadosiPro onboarding app

A native mobile app (Expo / React Native) with its own API. A new user registers, verifies their email with a one-time code, logs in, fills in a one-time profile and picks the tasks their Lifestyle Manager should handle.

```
backend/   Express + TypeScript API, PostgreSQL, tests
mobile/    Expo app (Android APK via EAS)
docker-compose.yml   Postgres + Mailpit + API in one command
DESIGN.md  Architecture, trade-offs, what's next
```

**Android APK:** [Download PadosiPro.apk](https://expo.dev/artifacts/eas/q566qIYs89RhLDKVnfN5A3xYQ5r0jzRUxr925r4F0CU.apk). If Android warns about an app from an unknown source, choose "Install anyway".

**Hosted API:** https://padosi-pro-api.vercel.app/api (health check: [`/api/health`](https://padosi-pro-api.vercel.app/api/health)). The APK talks to this, and OTP emails are sent for real through Gmail SMTP. Check spam if the code doesn't arrive.

## Prerequisites

- Node.js 20 or newer (built with 24) and npm
- Docker Desktop, for the one-command backend
- To run the app, one of:
  - an Android phone with **Expo Go** (supports Expo SDK 57) on the same Wi-Fi as your computer
  - an Android emulator
  - the built APK

## 1. Start the backend (one command)

```bash
docker compose up --build
```

This starts:

| Service | URL | What it is |
| --- | --- | --- |
| API | http://localhost:4000/api | Runs migrations and seeds 32 tasks on start |
| Mailpit | http://localhost:8025 | Catches every email the API sends. **Open this to read your OTP.** |
| Postgres | localhost:5433 | user / password / db: `padosipro` |

Check it's up: `curl http://localhost:4000/api/health` should return `{"ok":true}`.

**Email:** OTPs are sent with **Nodemailer over SMTP**.
- **Default:** every email goes to **Mailpit**, a local mail catcher, so no real email is sent. Read the code at http://localhost:8025.
- **Real inboxes:** copy `.env.example` to `.env` in the project root and fill in a Gmail address and a Gmail [app password](https://myaccount.google.com/apppasswords). Then run `docker compose up -d` and codes arrive in Gmail.
- **Hosted API:** uses the same Gmail SMTP settings.

## 2. Run the app

```bash
cd mobile
cp .env.example .env
```

Set `EXPO_PUBLIC_API_URL` in `mobile/.env` for where the app runs:

- **Phone with Expo Go:** `http://<your computer's LAN IP>:4000`. Find the IP with `ipconfig` on Windows or `ipconfig getifaddr en0` on macOS.
- **Android emulator:** `http://10.0.2.2:4000`
- **Hosted backend:** its `https://…vercel.app` URL

Then install and start:

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `a` for the emulator. Restart Expo after changing `.env`.

**Try the flow:**
1. Register.
2. Read the 6-digit code at http://localhost:8025 and enter it.
3. Fill in the profile.
4. Pick tasks and confirm.
5. You land on the home screen. Close and reopen the app: you stay logged in.

## 3. Run the tests

```bash
cd backend
npm install
npm test
```

No database or Docker needed: the tests use an in-memory Postgres (PGlite) and a controllable clock. They cover:
- OTP generation and hashing
- the 10-minute expiry
- single use, and only the latest code counting
- the 5-attempt lock
- the 30 s resend cooldown and hourly cap
- email-send failure
- login rules: verified-only, generic errors, the 15-minute lockout, token expiry
- profile validation
- task selection

## Environment variables

### backend/.env

Copy from `backend/.env.example`. Only needed when you run the API without Docker, or when you deploy it.

| Variable | Example | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `postgres://padosipro:padosipro@localhost:5433/padosipro` | Neon's pooled URL in production |
| `JWT_SECRET` | 32+ random chars | Signs session tokens |
| `JWT_EXPIRES_IN` | `7d` | Session length |
| `OTP_SECRET` | 32+ random chars | HMAC key for stored OTP hashes |
| `SMTP_HOST` / `SMTP_PORT` | `localhost` / `1025` | Mailpit locally; `smtp.gmail.com` / `465` for Gmail |
| `SMTP_SECURE` | `false` | `true` for port 465 |
| `SMTP_USER` / `SMTP_PASS` | empty locally | Gmail address and Gmail app password (not the account password) |
| `MAIL_FROM` | `PadosiPro <no-reply@…>` | With Gmail, use the same Gmail address |
| `CORS_ORIGINS` | `*` | Only matters for the web preview |
| `PORT` | `4000` | |

### mobile/.env

| Variable | Notes |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Backend base URL without `/api`. Baked in at build time. |

## Run the backend without Docker

With your own Postgres:

```bash
cd backend
cp .env.example .env   # point DATABASE_URL at your database
npm install
npm run db:setup       # migrations + seed
npm run dev            # http://localhost:4000
```

## Build the APK

The APK is built with EAS (Expo's cloud build), so you don't need an Android SDK locally.

```bash
cd mobile
npm install -g eas-cli
eas login              # free Expo account
eas build:configure    # first time only, links the project
eas build -p android --profile preview
```

- The `preview` profile in `mobile/eas.json` builds an `.apk` pointed at the hosted API (`EXPO_PUBLIC_API_URL`). Change that URL to build against your own backend.
- The build finishes with a download link for the `.apk`.

**Local build instead** (needs Android Studio / SDK and JDK 17):

```bash
npx expo prebuild -p android
cd android
./gradlew assembleRelease
```

The APK lands in `android/app/build/outputs/apk/release/`.

## Deploy the backend (Vercel + Neon + Gmail SMTP)

1. Create a Vercel project for the `backend/` folder. `backend/vercel.json` marks it as an Express app, and Vercel runs `src/app.ts`, whose default export is the app.
2. In Vercel **Storage**, create a Neon Postgres database and connect it to the project with the prefix `DATABASE`. That sets `DATABASE_URL`.
3. Add the other variables from the table above. Use Gmail for `SMTP_*` and `MAIL_FROM`, as in `.env.example`.
4. Deploy. The `vercel-build` script runs the migrations and seeds the task catalogue before each build. Both are idempotent, so redeploys are safe.

## API

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | – | Create an account (or re-claim an unverified one) and email a code |
| POST | `/api/auth/verify-email` | – | Check the code and return `{ token, user }` |
| POST | `/api/auth/resend-code` | – | New code, respecting the 30 s cooldown and 5 per hour |
| POST | `/api/auth/login` | – | Verified users only; unverified gets `403 EMAIL_NOT_VERIFIED` |
| GET | `/api/me` | Bearer | Current user, profile and `profileCompleted` |
| PUT | `/api/me/profile` | Bearer | Save name, mobile (+91), address (line 1, optional line 2, city, state from the 36 states/UTs, 6-digit PIN) and business name (optional) |
| GET | `/api/tasks` | – | Task catalogue grouped by category |
| GET / PUT | `/api/me/tasks` | Bearer | Read / replace the selected tasks |

Every error has the same shape, and `429` responses also include `retryAfterSeconds` and a `Retry-After` header:

```json
{ "error": { "code": "OTP_INCORRECT", "message": "Incorrect code. 3 attempts left.", "attemptsLeft": 3 } }
```

Validation errors add a `fields` map, e.g. `{ "mobile": "Enter a valid 10-digit Indian mobile number." }`.

**Why business name is optional:** most PadosiPro customers are households rather than businesses, so asking every user for one would add friction. It's kept for people who also want help with work errands.
