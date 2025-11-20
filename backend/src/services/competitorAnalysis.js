import { geminiModel } from '../config/gemini.js';

export const analyzeCompetitors = async (grantCategory, region) => {
    const prompt = `
    Identify potential competitors for a grant in the "${grantCategory}" sector in "${region}".
    List 3-5 potential companies or types of organizations that usually apply.
    Provide a brief SWOT analysis for a generic new entrant vs these incumbents.
  `;

    try {
        const result = await geminiModel.generateContent(prompt);
        return (await result.response).text();
    } catch (error) {
        console.error('Competitor Analysis Error:', error);
        throw error;
    }
};
