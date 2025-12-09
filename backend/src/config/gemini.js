import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("⚠️ Gemini API Key missing in .env file");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Using Gemini 3 Thinking Pro (gemini-exp-1206) - best reasoning, free for Ultra users
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-exp-1206",
});
export const geminiProModel = genAI.getGenerativeModel({
  model: "gemini-exp-1206",
}); // Primary model for grant analysis
