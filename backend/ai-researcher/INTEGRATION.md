# Agent Laboratory Integration

This directory contains the [Agent Laboratory](https://github.com/SamuelSchmidgall/AgentLaboratory) research system, integrated with the Grant Crawler backend to provide AI-powered grant proposal research.

## How It Works

When a user clicks **"START AGENT LAB"** on a grant page:

1. **Frontend** → Establishes SSE connection to `/api/research/:grantId/research`
2. **Backend** → Spawns Python bridge script with grant data
3. **Bridge Script** (`grant_research_bridge.py`) → Creates YAML config and runs Agent Laboratory
4. **Agent Laboratory** → Performs autonomous research workflow:
   - Literature Review
   - Plan Formulation
   - Data Preparation
   - Running Experiments
   - Results Interpretation
   - Report Writing
   - Report Refinement
5. **SSE Stream** → Real-time progress updates sent to frontend
6. **Results** → Research output saved to `grant_research_output/` directory

## Setup

### 1. Install Python Dependencies

```bash
cd backend/ai-researcher
pip install -r requirements.txt
```

### 2. Set Environment Variables

Add to your `backend/.env` file:

```bash
# RECOMMENDED (for best quality models)
OPENROUTER_API_KEY=your-openrouter-key

# FREE fallback
GEMINI_API_KEY=your-gemini-key

# Optional alternatives
OPENAI_API_KEY=your-openai-key
DEEPSEEK_API_KEY=your-deepseek-key
```

**Note**: The system will use OpenRouter first (for Claude Opus 4.5, Claude Sonnet 4.5, GPT-5 Codex), then fall back to OpenAI or Gemini if OpenRouter is not available.

### 3. Test the Integration

```bash
# From backend/ai-researcher directory
python grant_research_bridge.py --grant-data '{"title":"Test Grant","description":"Test research topic"}'
```

## Configuration

The bridge script creates a YAML configuration optimized for grant proposals:

- **Models**: Uses best-in-class models via OpenRouter:
  - Literature Review: Claude Opus 4.5 (best reasoning)
  - Plan Formulation: Claude Sonnet 4.5 (great writing)
  - Data Preparation: Gemini 3 Pro (FREE)
  - Experiments: GPT-5 Codex (98.67% math accuracy)
  - Results: Claude Opus 4.5 (best reasoning)
  - Writing: Claude Sonnet 4.5 (excellent prose)
  - Refinement: Gemini 3 Pro (FREE)
- **Literature Review**: 3 papers (reduced for speed)
- **Research Steps**: Optimized for quick turnaround
- **Output**: Generates LaTeX research report aligned with grant requirements

You can modify these defaults in `grant_research_bridge.py` > `create_grant_yaml_config()` or in `agent_models.py`

## Cost Estimates

Using OpenRouter with premium models:
- **Literature Review**: ~$2-3 (Claude Opus 4.5)
- **Plan Formulation**: ~$1-2 (Claude Sonnet 4.5)
- **Experiments**: ~$1-2 (GPT-5 Codex)
- **Writing**: ~$2-3 (Claude Sonnet 4.5)
- **Free stages**: Gemini 3 Pro (Data Prep, Refinement)
- **Full Research Workflow**: ~$7-15 per grant

With Gemini API fallbacks: ~$0-5 per grant (mostly free)

## Output Structure

Research outputs are saved to:
```
backend/ai-researcher/grant_research_output/
└── research_dir_0_lab_0/
    ├── src/          # Python code generated during research
    ├── tex/          # LaTeX research paper
    └── results/      # Experimental results (if applicable)
```

## Event Types

The bridge script outputs JSON events via stdout for SSE streaming:

```json
{"type": "stage_started", "stage": "Literature Review", "message": "..."}
{"type": "log", "level": "info", "message": "..."}
{"type": "status", "status": "completed|failed"}
{"type": "result", "output_dir": "grant_research_output/..."}
{"type": "error", "message": "..."}
```

## Troubleshooting

### "API key required" error
- Ensure `.env` file exists in `backend/` directory
- Add at least one API key: OPENROUTER_API_KEY (recommended), OPENAI_API_KEY, or GEMINI_API_KEY
- Verify the key is valid at https://openrouter.ai/keys

### "Module not found" errors
- Run `pip install -r requirements.txt` in `backend/ai-researcher/`
- Ensure Python 3.8+ is installed

### SSE connection drops
- Check Python process didn't crash (view backend logs)
- Verify firewall isn't blocking port 3000
- Check CORS settings in `backend/src/server.js`

### Long processing times
- Normal for full research workflow (10-30 minutes)
- Monitor progress via SSE events in browser console
- Consider reducing `num-papers-lit-review` in bridge script for faster runs

## Development

To modify the research workflow:

1. **Change Agent Models**: Edit `backend/ai-researcher/agent_models.py`
2. **Adjust Research Steps**: Modify YAML config in `grant_research_bridge.py`
3. **Custom Prompts**: Update task notes in `create_grant_yaml_config()`
4. **Add New Agents**: Extend `backend/ai-researcher/agents.py`

## Architecture

```
Frontend (Svelte)
    ↓ SSE Connection
Backend (Node.js/Express)
    ↓ spawn()
Bridge Script (Python)
    ↓ LaboratoryWorkflow
Agent Laboratory (Multi-Agent System)
    ↓ Research Pipeline
LaTeX Output + SSE Events
```

## References

- [Agent Laboratory Repository](https://github.com/SamuelSchmidgall/AgentLaboratory)
- [Original Paper](https://arxiv.org/abs/2501.04217)
- [SSE Specification](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
