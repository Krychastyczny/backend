const express = require('express');

const authRoutes = require('../routes/auth');
const authMiddleware = require('../middleware/auth');
const tasksRoutes = require('../routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth', authRoutes);
app.use('/tasks', authMiddleware, tasksRoutes); 

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
