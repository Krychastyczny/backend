require('dotenv').config();
const { initSentry, Sentry } = require('../monitoring/sentry');

initSentry();

const express = require('express');

const authRoutes = require('../routes/auth');
const authMiddleware = require('../middleware/auth');
const tasksRoutes = require('../routes/tasks');

const helmet = require('helmet');

const { globalLimiter, authLimiter } = require('../middleware/rateLimit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(globalLimiter);

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});
app.get('/debug-sentry', (req, res) => {
  throw new Error('Testowy blad Sentry!');
});

app.use('/auth', authLimiter, authRoutes);
app.use('/tasks', authMiddleware, tasksRoutes);

Sentry.setupExpressErrorHandler(app);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(err.details ? { details: err.details } : {}),
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
