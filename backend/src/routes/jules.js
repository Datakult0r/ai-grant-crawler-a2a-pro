import express from 'express';
import { jules } from '../services/thinktankAgents.js';

const router = express.Router();

router.post('/chat', async (req, res) => {
    const { message, context } = req.body;
    try {
        const response = await jules.chat(message, context);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: 'Jules failed to respond' });
    }
});

router.get('/health', async (req, res) => {
    try {
        const health = await jules.checkHealth();
        res.json(health);
    } catch (error) {
        res.status(500).json({ error: 'Jules health check failed' });
    }
});

export default router;
