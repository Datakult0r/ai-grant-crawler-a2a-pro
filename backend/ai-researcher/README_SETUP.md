# AI Agent Laboratory Setup

## Prerequisites

- Python 3.10+
- Node.js 18+ (for Backend)

## Installation

1. Navigate to the AI Researcher directory:

   ```bash
   cd backend/ai-researcher
   ```

2. Create a virtual environment (Recommended):

   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```

3. Install Dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

Ensure your `backend/.env` file contains at least one of the following API keys:

- `OPENROUTER_API_KEY` (Recommended for best performance)
- `GEMINI_API_KEY` (Free tier available)
- `OPENAI_API_KEY`

## Testing

Run the bridge script manually to verify setup:

```bash
python grant_research_bridge.py --grant-data '{"title": "Test Grant", "description": "Test"}'
```
