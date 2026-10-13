const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

// Lets Express read JSON request bodies (needed for POST /auth/login).
app.use(express.json());

app.use('/health', require('./routes/health'));
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/projects', require('./routes/projects'));

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
