const express = require('express');
const supabase = require('../supabase');

const router = express.Router();

// GET /admin/users
router.get('/users', async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('id,email,role,created_at')
        .order('created_at');

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
});

module.exports = router;