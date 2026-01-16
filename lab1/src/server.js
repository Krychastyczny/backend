require('dotenv').config();
const { initSentry, Sentry } = require('../monitoring/sentry');

initSentry();

const express = require('express');
const cors = require('cors');

const authRoutes = require('../routes/auth');
const authMiddleware = require('../middleware/auth');
const tasksRoutes = require('../routes/tasks');
const adminRoutes = require('../routes/admin');

const helmet = require('helmet');

const { globalLimiter, authLimiter, healthLimiter } = require('../middleware/rateLimit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '100kb' }));

app.use(helmet());
app.use(globalLimiter);
app.use(cors());

app.get('/health', healthLimiter, (req, res) => {
  res.json({
    status: 'OK',
    validationMode: 'full',
    timestamp: new Date().toISOString(),
  });
});
app.get('/debug-sentry', (req, res) => {
  throw new Error('Testowy blad Sentry!');
});

app.use('/auth', authLimiter, authRoutes);
app.use('/tasks', authMiddleware, tasksRoutes);
app.use('/admin', authMiddleware, adminRoutes);

Sentry.setupExpressErrorHandler(app);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload Too Large' });
  }
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(err.details ? { details: err.details } : {}),
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
