import express from 'express';
const router = express.Router();

router.post('/start', (req, res) => {
    res.json({ message: 'Crawler start placeholder' });
});

export default router;
