# ai-grant-crawler-a2a-pro

Production-ready autonomous grant discovery system with MCP scrapers, A2A orchestration, and Google Sheets automation.

## Features

- **Dual Mode Proposal Generation**:
  - **Fast Track**: Instant proposal generation using Gemini 2.5 Pro
  - **Research Track**: Deep autonomous research using AI-Researcher agents (requires Python environment)
- **Real-time Visualization**: Server-Sent Events (SSE) for tracking research progress
- **Grant Matching**: AI-powered relevance scoring
- **Interactive Frontend**: Beautiful SvelteKit interface with dynamic routing

## Quick Start

### Backend Setup

1. **Install Dependencies**

   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   Copy `.env.example` to `.env` and configure:

   - Supabase credentials
   - Gemini API key

   > **Note**: For production deployment, you must set `PUBLIC_API_URL` in your frontend environment (e.g., Vercel) to point to the live public URL of the deployed backend service (e.g., `https://your-backend.up.railway.app/api`).

3. **Database Setup**
   Run `schema.sql` in your Supabase SQL editor.

4. **AI-Researcher Setup (Optional - for Research Track)**

   > **Note**: The Research Track currently uses a mock implementation. For full AI-Researcher integration:

   **Windows Users**: Requires Microsoft Visual C++ 14.0+ Build Tools

   ```bash
   # Install from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   ```

   **Linux/Mac Users**:

   ```bash
   cd backend/ai-researcher
   pip install -e .
   playwright install
   ```

5. **Run Backend**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install Dependencies**

   ```bash
   cd frontend
   npm install
   ```

2. **Run Frontend**
   ```bash
   npm run dev
   ```

## Architecture

```
├── backend/          # Node.js/Express API
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic
│   │   └── utils/    # SSE, helpers
│   └── ai-researcher/ # Python AI research system (submodule)
│
└── frontend/         # SvelteKit app
    ├── src/routes/   # Pages & routing
    └── src/lib/      # Components & utilities
```

## Usage

1. Browse grants on the dashboard (`/`)
2. Click "Apply Now" on any grant
3. Choose between:
   - **Fast Track**: Quick AI-generated proposal (30s)
   - **Research Track**: Deep autonomous research with real-time team visualization (5-15min)\*

\*Research Track currently uses mock implementation. Real AI-Researcher requires additional Python setup.

## API Documentation

See `frontend-updates/API_CONNECTION.md` for detailed API integration guide.
