const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const supabaseClient = supabase.admin || supabase;

// GET /tasks - pobierz wszystkie
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user?.role === 'admin';

  let query = supabaseClient
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });
  if (!isAdmin) {
      query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message })
  res.json(data);
});

// POST /tasks - utwórz nowy
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { title } = req.body;

  if (!title) return res.status(400).json({ error: 'Title is required' });
  if (title.length > 255) return res.status(400).json({ error: 'Title too long' });

  const { data, error } = await supabaseClient
    .from('tasks')
    .insert({ title, user_id: userId })
    .select('*')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /tasks/:id - oznacz jako wykonane
router.patch('/:id', async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { title, completed } = req.body;
  const isAdmin = req.user?.role === 'admin';

  let query = supabaseClient
    .from('tasks')
    .update({ title, completed })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (!isAdmin) {
      query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Task not found' });
  res.json(data);
});

// DELETE /tasks/:id - usuń
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const isAdmin = req.user?.role === 'admin';

  let query = supabaseClient
    .from('tasks')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (!isAdmin) {
      query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Task not found' });
  res.status(204).send();
});

module.exports = router;