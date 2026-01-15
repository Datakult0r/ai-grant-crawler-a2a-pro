# Quick Start Guide - AI Grant Crawler with Auto-Accept

This guide will get you up and running with the AI Grant Crawler system including the auto-accept feature that keeps research running continuously.

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Git

## Setup

### 1. Verify Configuration

Run the setup verification script to check your configuration:

```bash
npm run verify
```

This will check for:
- Backend .env configuration
- Python AI-Researcher files
- Frontend configuration
- Required dependencies

### 2. Install Dependencies

Install all dependencies for root, backend, and frontend:

```bash
npm run setup
```

Or manually:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 3. Python Dependencies

Install Python packages for the AI-Researcher:

```bash
cd backend/ai-researcher
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy the example .env file:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and add your API keys:

```env
# Required - Supabase
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-key"

# At least ONE of these AI APIs is required
OPENROUTER_API_KEY="your-openrouter-key"  # Recommended
# OR
OPENAI_API_KEY="your-openai-key"
# OR
GEMINI_API_KEY="your-gemini-key"

# Enable AI-Researcher
AI_RESEARCHER_ENABLED="true"
```

## Running the System

### Standard Mode

Start both backend and frontend dev servers:

```bash
npm run dev
```

This starts:
- Backend API on http://localhost:3000
- Frontend on http://localhost:5173

### Auto-Accept Mode (Recommended)

Start with auto-accept bot to automatically click "START AGENT LAB":

```bash
npm run dev:with-auto
```

This starts:
- Backend API on http://localhost:3000
- Frontend on http://localhost:5173
- Auto-accept bot (browser automation)

The auto-accept bot will:
- Open a browser window
- Monitor for the "START AGENT LAB" button
- Automatically click it to keep research running
- Prevent interruptions requiring manual clicks

## How It Works

### Research Flow

1. **Frontend** ([ResearchProgress.svelte](frontend/src/lib/components/ResearchProgress.svelte))
   - Displays research status and logs
   - Connects to backend SSE stream
   - Shows "START AGENT LAB" button

2. **Backend** ([research.js](backend/src/routes/research.js) → [researchService.js](backend/src/services/researchService.js))
   - Receives grant ID from frontend
   - Spawns Python AI-Researcher process
   - Streams output via Server-Sent Events (SSE)

3. **Python AI-Researcher** ([grant_research_bridge.py](backend/ai-researcher/grant_research_bridge.py))
   - Creates research configuration from grant data
   - Runs multi-agent laboratory workflow
   - Streams progress updates as JSON events
   - Uses `except_if_fail=True` to continue through errors

4. **Auto-Accept Bot** ([auto-accept.js](auto-accept.js))
   - Uses Puppeteer to control browser
   - Monitors for start button every 1 second
   - Auto-clicks to eliminate manual intervention

### Visualization

The system includes a pixel-art visualization showing:
- 7 research stages as a breadcrumb timeline
- 5 AI agents moving between stages
- Real-time activity logs
- Interactive stage details

See [ResearchVisualization.svelte](frontend/src/lib/components/ResearchVisualization.svelte)

## Configuration

### Adjust Auto-Accept Behavior

Edit [auto-accept.js](auto-accept.js):

```javascript
// Run in background (no browser window)
headless: true

// Check for button more/less frequently
const CHECK_INTERVAL = 500; // milliseconds
```

### Research Parameters

Edit [grant_research_bridge.py:41-47](backend/ai-researcher/grant_research_bridge.py#L41-L47):

```python
"num-papers-lit-review": 3,    # Papers to review
"papersolver-max-steps": 3,     # Max problem-solving steps
"mlesolver-max-steps": 2,       # Max ML experiment steps
"except-if-fail": True,         # Continue on errors
```

### Agent Models

The system uses optimal models per agent role:
- PhD Student: Claude Opus 4.5 (best reasoning)
- Postdoc: Gemini 3 Pro (top reasoning, FREE)
- Professor: Claude Sonnet 4.5 (writing + reasoning)
- ML Engineer: GPT-5 Codex (best coding)
- Reviewers: Gemini 3 Pro (rigorous, FREE)

See [agent_models.py](backend/ai-researcher/agent_models.py) for details.

## Troubleshooting

### Research Stops Unexpectedly

The system is now configured to continue through errors:
- `except_if_fail=True` prevents early termination
- Auto-accept bot ensures continuous operation
- Check logs in frontend for specific errors

### Auto-Accept Not Working

1. Ensure Puppeteer is installed: `npm install`
2. Check that frontend is running on port 5173
3. Verify button text is "START AGENT LAB"

### Python Process Fails

1. Check Python dependencies: `pip install -r requirements.txt`
2. Verify API keys in `backend/.env`
3. Check logs in backend console
4. Ensure `AI_RESEARCHER_ENABLED="true"`

### SSE Connection Issues

1. Verify backend is running on port 3000
2. Check CORS is enabled in backend
3. Look for errors in browser console
4. Verify grant ID is valid

## Architecture

```
┌─────────────────┐
│   Frontend      │  SvelteKit on :5173
│  ResearchUI     │  - Progress display
│  Visualization  │  - Pixel-art lab
└────────┬────────┘
         │ SSE
         ▼
┌─────────────────┐
│   Backend       │  Express on :3000
│  API Server     │  - Research routes
│  ResearchSvc    │  - SSE streaming
└────────┬────────┘
         │ spawn
         ▼
┌─────────────────┐
│  AI-Researcher  │  Python
│  Laboratory     │  - Multi-agent workflow
│  Bridge Script  │  - 7 research stages
└─────────────────┘

┌─────────────────┐
│  Auto-Accept    │  Puppeteer
│  Browser Bot    │  - Monitors button
│                 │  - Auto-clicks
└─────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| [auto-accept.js](auto-accept.js) | Browser automation for auto-clicking |
| [verify-setup.js](verify-setup.js) | Setup verification script |
| [backend/src/routes/research.js](backend/src/routes/research.js) | Research API endpoint |
| [backend/src/services/researchService.js](backend/src/services/researchService.js) | Research orchestration + SSE |
| [backend/ai-researcher/grant_research_bridge.py](backend/ai-researcher/grant_research_bridge.py) | Python ↔ Node.js bridge |
| [backend/ai-researcher/agent_models.py](backend/ai-researcher/agent_models.py) | AI model configuration |
| [frontend/src/lib/components/ResearchProgress.svelte](frontend/src/lib/components/ResearchProgress.svelte) | Research UI |
| [frontend/src/lib/components/ResearchVisualization.svelte](frontend/src/lib/components/ResearchVisualization.svelte) | Pixel-art visualization |

## Support

For issues:
1. Run `npm run verify` to check configuration
2. Check logs in terminal and browser console
3. Review this guide's troubleshooting section
4. See [AUTO-ACCEPT.md](AUTO-ACCEPT.md) for auto-accept details

## Next Steps

1. ✅ Run verification: `npm run verify`
2. ✅ Start with auto-accept: `npm run dev:with-auto`
3. Navigate to http://localhost:5173
4. Select a grant and watch it run continuously!
