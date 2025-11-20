import express from 'express';
import { supabase } from '../config/database.js';

const router = express.Router();

// GET /api/grants
router.get('/', async (req, res) => {
    const { data, error } = await supabase
        .from('grants')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// GET /api/grants/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('grants')
        .select('*, research_data(*)')
        .eq('id', id)
        .single();

    if (error) return res.status(404).json({ error: 'Grant not found' });
    res.json(data);
});

// GET /api/grants/calendar
router.get('/calendar', async (req, res) => {
    const { data, error } = await supabase
        .from('grants')
        .select('id, name, deadline')
        .not('deadline', 'is', null)
        .order('deadline', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    // Group by month
    const calendar = data.reduce((acc, grant) => {
        const month = new Date(grant.deadline).toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!acc[month]) acc[month] = [];
        acc[month].push(grant);
        return acc;
    }, {});

    res.json(calendar);
});

export default router;
