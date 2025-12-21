const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// POST /auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ message: 'User created', user: data.user });
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password
  });
  if (error) return res.status(401).json({ error: error.message });
  res.json({ token: data.session.access_token, user: data.user });
});

module.exports = router;