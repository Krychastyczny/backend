import express from 'express';
import { readTasks, writeTasks } from './tasksRepository.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.get(
  '/tasks',
  asyncHandler(async (req, res) => {
    const allTasks = await readTasks();
    let tasks = [...allTasks];
    const { completed, sort, page, limit } = req.query;

    if (typeof completed !== 'undefined') {
      if (completed !== 'true' && completed !== 'false') {
        return res
          .status(400)
          .json({ error: 'completed must be either "true" or "false"' });
      }
      const completedValue = completed === 'true';
      tasks = tasks.filter((task) => task.completed === completedValue);
    }

    if (sort) {
      const allowed = ['createdAt', 'title'];
      if (!allowed.includes(sort)) {
        return res
          .status(400)
          .json({ error: `sort must be one of: ${allowed.join(', ')}` });
      }
      tasks.sort((a, b) => {
        if (sort === 'createdAt') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return (a[sort] || '').localeCompare(b[sort] || '');
      });
    }

    if (page || limit) {
      const pageNumber = parseInt(page ?? '1', 10);
      const limitNumber = parseInt(limit ?? '10', 10);

      if (Number.isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({ error: 'page must be a positive number' });
      }
      if (Number.isNaN(limitNumber) || limitNumber < 1) {
        return res.status(400).json({ error: 'limit must be a positive number' });
      }

      const start = (pageNumber - 1) * limitNumber;
      tasks = tasks.slice(start, start + limitNumber);
    }

    res.json(tasks);
  }),
);

app.get(
  '/tasks/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Task id must be a positive integer' });
    }
    const tasks = await readTasks();
    const task = tasks.find((t) => Number(t.id) === id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found', id });
    }
    res.json(task);
  }),
);

app.post(
  '/tasks',
  asyncHandler(async (req, res) => {
    const { title, description = '' } = req.body ?? {};
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (description !== undefined && typeof description !== 'string') {
      return res.status(400).json({ error: 'description must be a string' });
    }

    const tasks = await readTasks();
    const nextId =
      tasks.reduce((max, task) => Math.max(max, Number(task.id) || 0), 0) + 1;
    const now = new Date().toISOString();

    const newTask = {
      id: nextId,
      title: title.trim(),
      description: description?.trim() ?? '',
      completed: false,
      createdAt: now,
    };

    tasks.push(newTask);
    await writeTasks(tasks);
    res.status(201).json(newTask);
  }),
);

app.put(
  '/tasks/:id',
  asyncHandler(async (req, res) => {
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({ error: 'Task id must be a positive integer' });
    }

    const { title, description, completed } = req.body ?? {};
    if (
      typeof title === 'undefined' &&
      typeof description === 'undefined' &&
      typeof completed === 'undefined'
    ) {
      return res
        .status(400)
        .json({ error: 'Provide at least one field: title, description, completed' });
    }

    if (typeof title !== 'undefined' && (typeof title !== 'string' || !title.trim())) {
      return res.status(400).json({ error: 'title must be a non-empty string' });
    }

    if (
      typeof description !== 'undefined' &&
      typeof description !== 'string'
    ) {
      return res.status(400).json({ error: 'description must be a string' });
    }

    if (
      typeof completed !== 'undefined' &&
      typeof completed !== 'boolean'
    ) {
      return res.status(400).json({ error: 'completed must be a boolean' });
    }

    const tasks = await readTasks();
    const index = tasks.findIndex((task) => Number(task.id) === taskId);
    if (index === -1) {
      return res.status(404).json({ error: 'Task not found', id: taskId });
    }

    const updatedTask = {
      ...tasks[index],
      title: typeof title !== 'undefined' ? title.trim() : tasks[index].title,
      description:
        typeof description !== 'undefined'
          ? description.trim()
          : tasks[index].description,
      completed:
        typeof completed !== 'undefined' ? completed : tasks[index].completed,
      updatedAt: new Date().toISOString(),
    };

    tasks[index] = updatedTask;
    await writeTasks(tasks);
    res.json(updatedTask);
  }),
);

app.delete(
  '/tasks/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Task id must be a positive integer' });
    }
    const tasks = await readTasks();
    const index = tasks.findIndex((task) => Number(task.id) === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Task not found', id });
    }
    const [removed] = tasks.splice(index, 1);
    await writeTasks(tasks);
    res.json({ deleted: true, task: removed });
  }),
);

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
