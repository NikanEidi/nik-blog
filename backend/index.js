// Must run before anything below reads process.env (the cors() setup two
// lines down included) — db/pool.js also calls this, but that happens too
// late here, only once a route file requires it further down this file.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 3001;

// The frontend and backend are different origins (localhost:3000/:3001
// locally, a Vercel domain and a Render domain in production), so the
// browser blocks cross-origin requests by default. `cors()` allows the
// frontend's origin specifically (not '*' — a wildcard origin can't be
// combined with credentials), and `credentials: true` is what lets the
// browser actually send/receive the HTTP-only auth cookie cross-origin.
// FRONTEND_URL must be set in production (Render) to the real deployed
// frontend URL, or every request from it gets blocked by CORS.
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));

// Lets Express read JSON request bodies (needed for POST /auth/login).
app.use(express.json());
// Lets Express read cookies sent by the browser (needed so requireAuth can
// find the auth token in req.cookies instead of only an Authorization header).
app.use(cookieParser());

app.use('/health', require('./routes/health'));
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/projects', require('./routes/projects'));
app.use('/notes', require('./routes/notes'));
app.use('/chat', require('./routes/chat'));

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
