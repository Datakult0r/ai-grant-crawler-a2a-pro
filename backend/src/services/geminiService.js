import { geminiModel } from '../config/gemini.js';

export const generateProposalFast = async (grantData, companyProfile) => {
    const prompt = `
    Generate a grant proposal for the following grant:
    Grant Name: ${grantData.name}
    Description: ${grantData.description}
    
    Company Profile:
    ${JSON.stringify(companyProfile)}
    
    Requirements:
    - Executive Summary
    - Methodology
    - Budget Estimate
    - Timeline
  `;

    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw error;
    }
};

export const analyzeGrant = async (grantText) => {
    const prompt = `
        Analyze the following grant text and extract key information:
        - Name
        - Amount
        - Deadline
        - Eligibility
        - Category (AI, Web3, etc.)
        
        Text: ${grantText}
    `;

    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini Analysis Error:', error);
        throw error;
    }
};
