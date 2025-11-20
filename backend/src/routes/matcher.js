import express from 'express';
import { geminiModel } from '../config/gemini.js';

const router = express.Router();

router.post('/analyze', async (req, res) => {
    const { grantDescription, companyProfile } = req.body;

    if (!grantDescription || !companyProfile) {
        return res.status(400).json({ error: 'Missing grantDescription or companyProfile' });
    }

    const prompt = `
    Analyze the relevance of this grant for the company.
    
    Grant: ${grantDescription}
    Company: ${JSON.stringify(companyProfile)}
    
    Output JSON:
    {
      "score": 0-100,
      "reasoning": "string",
      "key_matches": ["string"],
      "missing_requirements": ["string"]
    }
  `;

    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '');
        res.json(JSON.parse(jsonStr));
    } catch (error) {
        console.error('Matcher Error:', error);
        res.status(500).json({ error: 'Failed to analyze match' });
    }
});

export default router;
