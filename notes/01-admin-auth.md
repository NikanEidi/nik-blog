# 01: Admin auth — JWT login and protected routes

## What this does

A single admin account (Nikan only, created once by a script — no public signup) can log in with email/password and receive a JWT. That JWT then has to be sent on every request to a protected route, proving the caller is really the logged-in admin.

```
POST /auth/login  { email, password }  →  { token }
GET  /admin/me     Authorization: Bearer <token>  →  { admin identity }
```

## Why no public signup route

A signup endpoint lets anyone create an account. This blog has exactly one admin — Nikan — so a signup route would just be an unused attack surface: one more endpoint that has to be secured, rate-limited, and defended against abuse, for a feature nobody legitimately needs. Instead, `scripts/create-admin.js` is a one-time, run-by-hand script that inserts the single admin row directly. If the admin password ever needs to change, a similar script (or a direct query) does it — there's no "forgot password" flow either, for the same reason.

## Layered architecture, and why it was worth restructuring for

Before auth was added, everything lived in one `index.js`. Once real logic (password hashing, token handling, database lookups, HTTP responses) started piling up, that stops being manageable. The restructure:

```
routes/        → "which URL maps to which controller" — no logic
controllers/   → handles req/res, calls services, decides status codes
services/      → the actual business logic (hashing, JWT) — no HTTP knowledge
middleware/    → cross-cutting checks (auth) that run before a route's own code
db/            → the connection pool and schema, used by controllers
```

Each layer only talks to its neighbor. `authService.js` has never heard of Express — it has no idea it's being used inside a web server, which means it could be reused in a CLI script or a test without any HTTP mocking. That separation is the actual payoff, not just tidiness.

## `authService.js` — hashing and tokens

```js
const SALT_ROUNDS = 10;
function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}
```

Passwords are never stored as plain text. `bcrypt.hash` is a one-way function — there's no `unhash`. `SALT_ROUNDS = 10` controls how many times the hashing algorithm iterates internally; higher is slower but more resistant to brute-force attacks. 10 is a widely-used default that balances security and login-speed.

```js
function generateToken(adminUser) {
  return jwt.sign(
    { id: adminUser.id, email: adminUser.email },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
}
```

A JWT has three parts (header, payload, signature). The payload here deliberately contains only non-sensitive identifiers — never the password hash, which would be a serious leak since JWT payloads are **base64-encoded, not encrypted**; anyone holding the token can decode and read the payload. What actually makes the token trustworthy is the signature, computed with `JWT_SECRET` — a value only the server knows. Without that secret, nobody can forge a token that `jwt.verify` will accept. `expiresIn: '2h'` limits the damage window if a token is ever stolen.

## `authController.js` — the same-error trick

```js
if (!adminUser) {
  return res.status(401).json({ message: 'Invalid email or password' });
}
const passwordMatches = await comparePassword(password, adminUser.password_hash);
if (!passwordMatches) {
  return res.status(401).json({ message: 'Invalid email or password' });
}
```

Both failure paths — "this email doesn't exist" and "this email exists but the password is wrong" — return the exact same status code and message. If they were different, an attacker could send a list of guessed emails and learn which ones have real accounts just from the response, without ever guessing a correct password (a user-enumeration attack). Returning an identical response closes that leak. The same query also uses a parameterized value (`$1`, not string concatenation) specifically to prevent SQL injection — accepting raw user input directly into a SQL string is one of the most common real-world vulnerabilities.

## `requireAuth.js` — middleware and the role of `next()`

```js
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(...);
  }
  const token = authHeader.split(' ')[1];
  try {
    req.admin = verifyToken(token);
    next();
  } catch (err) {
    res.status(401).json(...);
  }
}
```

Express middleware functions take a third argument, `next`, that regular route handlers don't. Calling `next()` is the only way execution continues to the actual route; not calling it stops the request right there. `jwt.verify` throws (rather than returning `false`) on an invalid or expired token, so the valid/invalid paths are handled with `try`/`catch`, not an `if`. Attaching the decoded payload to `req.admin` is how the protected route downstream finds out who's calling it, without re-verifying the token itself.

## Wiring it together in `index.js`

```js
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
```

`app.use(prefix, router)` means every path defined inside that router is prefixed automatically. `routes/auth.js` defines `router.post('/login', ...)`, so the real, callable URL becomes `POST /auth/login`. Same logic gives `routes/admin.js`'s `/me` the real path `GET /admin/me`. This is why route files never hardcode the full path — the prefix is decided once, in one place.

## Verified live

```
POST /auth/login  → { "status": "ok", "token": "eyJhbGc..." }
GET  /admin/me (with that token) → { "status": "ok", "admin": { "id": 1, "email": "...", "iat": ..., "exp": ... } }
```

`iat` (issued-at) and `exp` (expiry) show up automatically in the decoded payload — `jsonwebtoken` adds them based on the `expiresIn` option, on top of the `id`/`email` that were explicitly set.

## One-line interview answer

> "Login returns a signed JWT after a bcrypt password check that gives an identical error for a wrong email or a wrong password, to prevent user enumeration. Protected routes run through a middleware that verifies the token's signature and expiry before calling `next()` — if verification fails, the request never reaches the route handler at all."
