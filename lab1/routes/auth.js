const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// POST /auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  const { data: profile } = await supabase.admin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  res.status(201).json({
    token: data.session.access_token,
    user: {
        id: data.user.id,
        email: data.user.email,
        role: profile.role
    }
  });
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password
  });
  if (error) return res.status(401).json({ error: error.message });

  const { data: profile } = await supabase.admin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  res.json({
    token: data.session.access_token,
    user: {
        id: data.user.id,
        email: data.user.email,
        role: profile.role
    }
  });
});

module.exports = router;