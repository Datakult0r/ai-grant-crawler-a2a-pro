import express from 'express';
import { supabase } from '../config/database.js';

const router = express.Router();

// GET /api/research/:grantId
router.get('/:grantId', async (req, res) => {
    const { grantId } = req.params;

    const { data, error } = await supabase
        .from('research_data')
        .select('*')
        .eq('grant_id', grantId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which might be valid if no research done yet
        return res.status(500).json({ error: error.message });
    }

    res.json(data || { status: 'not_started' });
});

export default router;
