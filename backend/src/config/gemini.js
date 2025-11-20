import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn('⚠️ Gemini API Key missing in .env file');
}

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
export const geminiProModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }); // Fallback or specific use cases
