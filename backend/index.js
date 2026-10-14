const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 3001;

// The frontend (localhost:3000) and backend (localhost:3001) are different
// origins, so the browser blocks cross-origin requests by default. `cors()`
// allows the frontend's origin specifically (not '*' — a wildcard origin
// can't be combined with credentials), and `credentials: true` is what lets
// the browser actually send/receive the HTTP-only auth cookie cross-origin.
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

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

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
