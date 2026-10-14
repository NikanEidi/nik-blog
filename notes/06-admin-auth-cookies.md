# 06: Admin panel auth — HTTP-only cookies instead of localStorage

## What this does

The admin panel (`/admin/login`, `/admin`) authenticates with an **HTTP-only cookie** instead of manually attaching a `Bearer` token — the browser handles sending it automatically on every request, and client-side JavaScript can never read it.

```
backend/index.js                      — cors() + cookie-parser wired in
backend/controllers/authController.js — login sets the cookie, new logout clears it
backend/middleware/requireAuth.js     — reads the cookie first, falls back to a Bearer header
frontend/app/admin/login/page.tsx     — login form (Client Component)
frontend/app/admin/page.tsx           — dashboard, confirms auth via a real API call
```

## Why a cookie instead of `localStorage` (the more common tutorial approach)

Storing a JWT in `localStorage` is simpler to wire up, but any JavaScript running on the page — including an attacker's, if an XSS bug ever gets introduced — can read `localStorage` directly and steal the token. An **HTTP-only** cookie is invisible to JavaScript entirely (`document.cookie` can't see it); only the browser and the server can touch it. For a single-admin panel where losing that token means someone else can edit/delete real content, that tradeoff is worth the extra setup.

## CORS has to explicitly allow credentials

```js
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
```

The frontend (`:3000`) and backend (`:3001`) are different origins as far as the browser is concerned — by default it blocks cross-origin requests, and even when CORS allows the request, it won't send or store cookies cross-origin unless the server explicitly opts in with `credentials: true`. The `origin` also has to be a specific URL here, not `'*'` — browsers refuse to combine a wildcard origin with credentials, for the same reason you wouldn't want a cookie-carrying request to be allowed from literally anywhere.

## Setting and reading the cookie

```js
// authController.js — login
res.cookie('token', token, {
  httpOnly: true,
  sameSite: 'lax',
  secure: false, // dev only — must be true once this is served over HTTPS
  maxAge: 2 * 60 * 60 * 1000,
});
```

- `httpOnly` — the core protection described above.
- `sameSite: 'lax'` — a basic CSRF defense: the cookie won't be sent on cross-site requests initiated by some other website, only on normal navigation/requests to this site.
- `secure: false` — a cookie marked `secure` is only ever sent over HTTPS. Correct to leave `false` on `localhost` (plain HTTP), but this has to flip to `true` before this ever gets deployed for real — a TODO worth not forgetting.
- `maxAge` matches the JWT's own 2-hour expiry, so the cookie doesn't outlive the token it's carrying.

```js
// requireAuth.js
const token = req.cookies.token || bearerToken;
```

Checks the cookie first (how the browser/admin panel authenticates) and falls back to an `Authorization: Bearer` header (how `curl` or a future non-browser client would authenticate) — one middleware serves both cases instead of needing two.

## Why the login/dashboard pages are Client Components, not Server Components

The public pages (`notes/05-frontend-pages.md`) are Server Components because they're read-only and SEO matters. The admin panel is the opposite on both counts: it needs real interactivity (a form, a submit handler, redirecting after login) which only runs in the browser, and SEO is irrelevant — nobody needs Google to index the admin login page. `'use client'` at the top of both files marks them as Client Components, enabling `useState`/`useRouter`/`onSubmit`.

```ts
const res = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  credentials: 'include',
  ...
});
```

`credentials: 'include'` is the fetch-level equivalent of the backend's CORS `credentials: true` — it tells the browser "send/accept cookies on this cross-origin request." Without it on *both* sides, the cookie silently never gets stored.

## Checking "am I logged in?" from the client — `useEffect`, not direct cookie reads

```tsx
useEffect(() => {
  async function checkAuth() {
    const res = await fetch(`${API_URL}/admin/me`, { credentials: 'include' });
    if (!res.ok) { router.push('/admin/login'); return; }
    setAdmin((await res.json()).admin);
  }
  checkAuth();
}, [router]);
```

Because the cookie is `httpOnly`, the dashboard page itself has no way to directly check "is there a valid token?" — that's the whole point of `httpOnly`. The only way to know is to ask the server: call a protected endpoint (`/admin/me`) and see whether it accepts or rejects the request. A `401` means redirect to login; success means render the dashboard with the real admin identity the server just confirmed.

This also explains why this fetch lives in a `useEffect` rather than directly in the component body like the Server Components did: a Client Component can't be `async` itself, so data fetching after mount goes through `useEffect` + a separate async function.

## Verified live

- Logged in through the real `/admin/login` form — redirected to `/admin` with no error.
- `/admin` dashboard correctly showed "Logged in as nikaneydi1984@gmail.com" — proving the cookie was set by `/auth/login`, stored by the browser, sent automatically on the `/admin/me` request, and verified server-side, with zero manual token handling in the frontend code.

## One-line interview answer

> "The admin panel uses an HTTP-only cookie instead of localStorage specifically so client-side JavaScript can never read the token, even if an XSS bug ever got introduced — the browser sends it automatically, and the backend validates it via `requireAuth`, which checks the cookie first and falls back to a Bearer header for non-browser clients like curl."
