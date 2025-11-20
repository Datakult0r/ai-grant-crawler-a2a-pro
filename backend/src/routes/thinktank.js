import express from 'express';
const router = express.Router();

router.post('/start', (req, res) => {
    res.json({ message: 'Thinktank start placeholder' });
});

export default router;
