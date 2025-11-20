# AI Grant Crawler Backend

This is the backend for the AI Grant Crawler, featuring a Dual Mode proposal generation system.

## Features

- **Dual Mode Proposals**:
  - **Fast Track**: Instant proposals using Gemini 2.5 Pro.
  - **Research Track**: Deep research using the AI-Researcher autonomous agent system.
- **Grant Matching**: AI-powered relevance scoring.
- **Automated Scraping**: Cron jobs to keep grant data fresh.
- **Real-time Updates**: SSE for tracking long-running research tasks.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Copy `.env.example` to `.env` and fill in your Supabase and Gemini keys.

3.  **Database**:
    Run the SQL in `schema.sql` in your Supabase SQL editor.

4.  **AI-Researcher**:
    Ensure Python is installed. The `ai-researcher` submodule is located in `backend/ai-researcher`.

## Running

- **Development**: `npm run dev`
- **Production**: `npm start`

## API Documentation

See `frontend-updates/API_CONNECTION.md` for integration details.
