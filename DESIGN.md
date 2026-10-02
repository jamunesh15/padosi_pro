# Design

## Architecture

```
mobile/  Expo (React Native) app ──HTTPS/JSON──▶  backend/  Express API ──▶ PostgreSQL
                                                     └──Nodemailer/SMTP──▶ Mailpit (local) / Gmail (real inboxes)
```

- **backend/**: Express 5 + TypeScript, Drizzle ORM on PostgreSQL, zod validation. Modules: `auth` (register, OTP, login), `account` (`/me`, profile, task selection) and `tasks` (catalogue). `createApp(deps)` takes the database, mailer, clock and config, so tests can pass an in-memory Postgres (PGlite), a fake mailer and a controllable clock.
- **mobile/**: Expo SDK 57, expo-router, React Native Reusables (shadcn/ui for React Native) on NativeWind. TanStack Query handles server state, react-hook-form + zod handle forms. The session token lives in SecureStore (Keystore/Keychain). Routing is guard-based: `Stack.Protected` exposes only the screens that fit the session state (signed out → auth screens, no profile → profile, otherwise tasks/home), and `index.tsx` sends each user to the right one.

**Data model:** `users` (email, password hash, verified-at, failed logins, locked-until) · `email_otps` (code hash, attempts, expires-at, used-at) · `profiles` (1:1 with users) · `task_categories` · `tasks` · `user_tasks` (composite primary key).

## Security decisions

- **Passwords** are hashed with bcrypt at cost 12. Passwords over 72 bytes are rejected, because bcrypt would otherwise truncate them silently.
- **OTP**
  - A 6-digit code from `crypto.randomInt`, stored only as `HMAC-SHA256(secret, userId:code)`. A leaked table can't be brute-forced offline without the server secret.
  - Codes are compared in constant time.
  - Only the newest code for a user is valid: sending a new code retires the old one.
  - Wrong guesses are counted with an atomic `attempts = attempts + 1 WHERE attempts < 5`, and the code is marked used with `WHERE used_at IS NULL`. Parallel requests can't beat the attempt limit or use a code twice.
- **Resend limits:** a 30 s cooldown and at most 5 codes per hour per account. Both are enforced in the database, not in memory, because the hosted API runs as serverless functions.
- **Login**
  - Unknown email and wrong password return the same 401, and the unknown-email path still runs a bcrypt compare so timing doesn't reveal which emails exist.
  - "Email not verified" (403) is only returned after the password matches.
  - 5 failed attempts lock the account for 15 minutes.
- **Re-registering an unverified email** replaces its password. Whoever proves they own the inbox owns the account, so nobody can squat an address they can't read.
- **Sessions** use a JWT (HS256, 7-day expiry). Every request checks that the user still exists.

## Trade-offs

- **JWT without refresh tokens.** Stateless and simple, but a token can't be revoked before it expires. A server-side session table (or refresh-token rotation) is the fix.
- **Clear errors vs. account enumeration.** Register and resend say "account exists / already verified" because the brief asks for clear messages. Login stays generic, since that's where guessing is cheapest.
- **Business name is optional.** Most PadosiPro customers are households, not businesses. It's there for people who also want work errands handled.
- **Guard-based navigation** means an unverified or profile-less user physically can't reach later screens, rather than relying on each screen to check.

## Left out

Refresh tokens and logout-everywhere · forgot/change password · editing the profile after onboarding · rate limiting by IP (per-account limits exist) · i18n · analytics · end-to-end UI tests.

## With another week

1. Refresh-token rotation and a sessions table, so logout revokes the token.
2. Forgot-password using the same OTP service.
3. Profile editing and an account screen.
4. Detox/Maestro end-to-end tests for the full flow, run in CI with the API tests.
5. Per-IP rate limiting at the edge and structured request logging.
