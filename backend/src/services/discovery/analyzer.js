import { geminiProModel } from "../../config/gemini.js";

export class GrantAnalyzerService {
  /**
   * Analyzes raw text to extract grant details and score relevance.
   * @param {string} rawText
   * @returns {Promise<Object>} Structured grant object with score
   */
  static async analyzeAndScore(rawText) {
    try {
      const prompt = `
                Analyze the following text which is suspected to be a grant opportunity.
                Extract the following fields in JSON format:
                - name: Title of the grant
                - description: Brief summary
                - amount: Funding amount usually mentioned
                - deadline: Application deadline (YYYY-MM-DD)
                - category: Best fit category (AI, Web3, Green, etc.)
                - relevance_score: Integer 0-100 based on fit for an AI software startup.
                - keywords: Array of keywords.
                
                Text to analyze:
                ${rawText.substring(0, 10000)} -- Truncate to avoid token limits
            `;

      const result = await geminiProModel.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Basic JSON cleanup
      const jsonStr = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Grant analysis failed:", error);
      return { relevance_score: 0, error: true };
    }
  }
}
