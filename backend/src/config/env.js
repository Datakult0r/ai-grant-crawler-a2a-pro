import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load .env file
dotenv.config();

const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  // 'OPENROUTER_API_KEY' - Optional if using others, but recommended
  // 'FIRECRAWL_API_KEY' - Required for discovery
];

const optionalEnvVars = [
  "OPENROUTER_API_KEY",
  "GEMINI_API_KEY",
  "OPENAI_API_KEY",
  "DEEPSEEK_API_KEY",
  "AI_RESEARCHER_ENABLED",
  "PORT",
  "NODE_ENV",
];

function validateEnv() {
  const missing = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error("❌ Critical Error: Missing required environment variables:");
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error(
      "Please check your .env file. See .env.example for reference."
    );
    process.exit(1);
  }

  // Warn about missing recommended but optional
  if (
    !process.env.OPENROUTER_API_KEY &&
    !process.env.OPENAI_API_KEY &&
    !process.env.GEMINI_API_KEY
  ) {
    console.warn(
      "⚠️  Warning: No AI API keys found (OPENROUTER, OPENAI, or GEMINI). AI features will fail."
    );
  }

  // Set defaults
  if (!process.env.PORT) process.env.PORT = "3000";
  if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";

  console.log("✅ Environment configuration validated.");
}

export const env = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  openRouterKey: process.env.OPENROUTER_API_KEY,
  geminiKey: process.env.GEMINI_API_KEY,
  openAiKey: process.env.OPENAI_API_KEY,
  deepSeekKey: process.env.DEEPSEEK_API_KEY,
  fireCrawlKey: process.env.FIRECRAWL_API_KEY,
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  aiResearcherEnabled: process.env.AI_RESEARCHER_ENABLED === "true",
};

// Validate on load
validateEnv();
