# Codex Task Prompts — AI Grant Crawler A2A Pro

Copy each section below into a **separate Codex instance**. Run all 5 in parallel.

---

## SHARED CONTEXT (paste at the top of EVERY instance)

```
## Project Context

Repository: https://github.com/Datakult0r/ai-grant-crawler-a2a-pro
Branch: main

Tech stack:
- Backend: Node.js + Express (ES Modules), Supabase, Google Gemini API, Firecrawl
- Frontend: SvelteKit 2 + Svelte 5 ($state/$derived/$effect runes), TailwindCSS 4, bits-ui, lucide-svelte
- Python: Agent Laboratory research pipeline (spawned as subprocess from Node)
- Database: Supabase (PostgreSQL)

Conventions:
- Frontend uses Svelte 5 runes syntax ($state, $derived, $effect, $props) — NOT stores or reactive declarations
- UI components live in frontend/src/lib/components/ui/ (shadcn-svelte style)
- API client functions are in frontend/src/lib/api.ts
- Backend routes are in backend/src/routes/, services in backend/src/services/
- All imports use ES module syntax (import/export), not CommonJS
- Environment variables are configured in backend/.env (see backend/.env.example)

Rules:
- Create a single PR for your task
- Do NOT modify files outside your task scope
- Run `npm run check` in the frontend/ directory before committing
- Follow existing code patterns — read neighboring files before writing
- Use Svelte 5 runes ($state, $derived, $effect), NOT legacy Svelte 4 syntax
```

---

## INSTANCE 1 — Replace mock backend services

```
## Task: Replace three mock backend services with real implementations

### 1. scraper.js — Real web scraping

File: `backend/src/services/scraper.js`

Current code (entire file):
```js
export const scrapeGrantSource = async (url) => {
    console.log(`Scraping ${url}...`);
    // TODO: Implement Firecrawl or Puppeteer scraping
    return "Mock scraped content";
};
```

Replace with a real implementation using the existing Firecrawl client.
Reference: `backend/src/services/firecrawl.js` already has the Firecrawl SDK configured.

The function should:
- Accept a URL string
- Use Firecrawl to scrape the page and return markdown content
- Handle errors gracefully (return null or throw with useful message)
- Log the URL being scraped

### 2. grantFeatures.js — Real feature extraction

File: `backend/src/services/grantFeatures.js`

Current code (entire file):
```js
export const extractFeatures = (grantData) => {
    // TODO: Implement 43 Hinchilla features extraction
    return { feature1: true, feature2: false };
};
```

Replace with a Gemini-powered feature extractor.
Reference: `backend/src/config/gemini.js` has the Gemini model configured.

The function should:
- Accept grant text/data as input
- Use Gemini to extract structured features: funding_amount, eligibility_criteria, deadline, topic_areas, geographic_restrictions, trl_level, consortium_required, cofunding_percentage
- Return a structured object with these fields
- Handle missing/unclear fields gracefully (return null for unknowns)

### 3. thinktankAgents.js — Wire startThinktankSession to real pipeline

File: `backend/src/services/thinktankAgents.js`

The `startThinktankSession` function (line 3-7) is stubbed:
```js
export const startThinktankSession = async (grantId) => {
    console.log(`Starting thinktank session for grant ${grantId}`);
    // TODO: Implement multi-agent conversation
    return { sessionId: 1, status: 'started' };
};
```

Wire this to the existing research pipeline.
Reference: `backend/src/services/researchService.js` has the full 8-phase Agent Laboratory implementation that spawns the Python subprocess.

The function should:
- Create a new research session record in Supabase
- Trigger the research pipeline from researchService.js
- Return the real session ID and initial status
- Do NOT duplicate the research logic — reuse what exists in researchService.js

Leave the `JulesAgent` class and `jules` export in this file untouched (Task 5 handles that).

### PR title: "Replace mock services with real Firecrawl, Gemini, and research pipeline implementations"
```

---

## INSTANCE 2 — Improve grant search with source filters and real-time fallback

```
## Task: Add source filtering and real-time web search fallback to the grant discovery dashboard

File to modify: `frontend/src/routes/+page.svelte`
API client: `frontend/src/lib/api.ts`

### Current state

The dashboard has a search bar that calls `searchGrants()` from api.ts, which hits the `/api/realtime-search` endpoint. But there are no source filters, and no way to fall back to web search when database results are empty.

### What to implement

1. **Source filter chips** below the search bar:
   - Add clickable filter chips for: "All Sources", "Horizon EU", "EIC", "NSF", "ANI", "IAPMEI", "COMPETE"
   - Use the existing `sourceColors` object (already in the file at line 66-105) for chip styling
   - Filter the displayed grants client-side when a source is selected
   - Track the selected source in a `$state` variable

2. **Real-time web search fallback**:
   - When a DB keyword search returns 0 results, show a prompt: "No grants found in database. Search the web for '[query]'?"
   - Add a "Search Web" button that calls the existing `searchGrants(query)` function from api.ts (this already hits `/api/realtime-search` which uses Firecrawl)
   - Show a distinct loading state for web search (different from DB search): "Crawling the web for grants..."
   - Display web results in the same grant card grid
   - Add a "Save to Database" button on each web result card that calls the existing `saveGrant()` function from api.ts

3. **Load database grants on mount**:
   - Currently `onMount` does nothing (line 168-170). Change it to call `fetchGrants()` and populate `rawGrants` so users see existing grants before searching.

### Implementation notes
- Use Svelte 5 runes: `$state`, `$derived`, `$effect`
- Reuse existing UI components: Button, Badge, Card from `$lib/components/ui/`
- Match the existing glass-card styling pattern used throughout the file
- The `searchGrants` and `saveGrant` functions already exist in `frontend/src/lib/api.ts` — do not recreate them

### PR title: "Add source filter chips and real-time web search fallback to discovery dashboard"
```

---

## INSTANCE 3 — Replace hardcoded company profiles with user settings

```
## Task: Replace mock company profiles with real user data from settings

### Problem

Two pages have hardcoded company profiles that should come from user settings:

1. `frontend/src/routes/writer/[grantId]/+page.svelte` (line 41-46):
```ts
const companyProfile = {
    name: "TechVision AI",
    description: "A startup focused on AI-powered healthcare diagnostics.",
    mission: "To democratize access to early disease detection.",
};
```

2. `frontend/src/routes/thinktank/[grantId]/+page.svelte` (line 68-72):
```ts
const companyProfile = {
    name: "TechVision AI",
    description: "A startup focused on AI-powered healthcare diagnostics.",
    mission: "To democratize access to early disease detection.",
};
```

### What to implement

1. **Backend — Company profile endpoints**

   Check `backend/src/routes/settings.js` for existing settings endpoints. Add or extend:
   - `GET /api/settings/company-profile` — returns the company profile
   - `PATCH /api/settings/company-profile` — updates the company profile
   - Store in Supabase `settings` or `company_profiles` table (check what exists first)

2. **Frontend — Settings page for company profile**

   Check if `frontend/src/routes/settings/+page.svelte` already has a company profile section.
   If not, add a form section with fields:
   - Company Name (text input)
   - Description (textarea)
   - Mission (textarea)
   - Industry/Sector (text input)
   - Company Size (select: startup / SME / enterprise)
   - Country (text input)

3. **Frontend — Replace hardcoded profiles**

   In both `writer/[grantId]/+page.svelte` and `thinktank/[grantId]/+page.svelte`:
   - Add an API call to fetch the company profile on mount
   - Replace the hardcoded `companyProfile` const with the fetched data
   - Show a helpful message if no company profile is set yet, with a link to /settings
   - Add the API function to `frontend/src/lib/api.ts`

### Implementation notes
- Use Svelte 5 runes ($state, $derived, $effect)
- Match existing UI patterns in the settings page
- The company profile data is sent to `generateProposal()` in api.ts — make sure the shape matches

### PR title: "Replace hardcoded company profiles with user-configurable settings"
```

---

## INSTANCE 4 — Enhance pixel art Agent Lab visualization

```
## Task: Add side panel log and click-to-view to the pixel art research visualization

### Context

Read these files for the full vision:
- `Grant Intelligence System – Agent Laboratory UX Vision/Agent Real-Time Visualization.txt`
- `Grant Intelligence System – Agent Laboratory UX Vision/Resources Agent Researchers/Readme.txt`

The pixel-art canvas component already exists and works:
`frontend/src/lib/components/PixelLabVisualization.svelte` (607 lines)

It already has:
- Canvas rendering with lab floor, equipment, whiteboard
- 6 agent sprites (PhD Student, Postdoc, Professor, ML Engineer, SW Engineer, Auditor)
- Breadcrumb timeline showing 8 research phases
- Agent movement based on active phase
- Speech bubbles for agent messages
- SSE-driven props: currentPhase, activeAgent, agentMessage, isRunning

The parent page that uses it: `frontend/src/routes/thinktank/[grantId]/+page.svelte`

### What to add

1. **Real-time activity log side panel**

   The vision doc specifies: "There is a section on the side that brings the text following to the visual UI/UX so the user can follow what is happening not only visually."

   Add a side panel next to the canvas that shows:
   - Scrolling log of agent activity messages (from SSE events)
   - Each entry shows: timestamp, agent name (color-coded), message text
   - Auto-scrolls to newest entry
   - Visual distinction between phase changes and regular messages

   This should be part of the PixelLabVisualization component or a sibling component composed alongside it in the thinktank page.

2. **Clickable phases on the breadcrumb timeline**

   The vision doc specifies: "Clicking a stage opens a panel with logs and artifacts for that stage"

   When a user clicks on a completed phase circle in the breadcrumb:
   - Show a small overlay/modal with that phase's collected messages
   - Show the phase name, which agent ran it, and all logged messages
   - Allow closing the overlay

   This requires:
   - Adding click detection on the canvas (map click coordinates to phase circles)
   - Storing messages per-phase (not just the latest message)
   - A small overlay UI component

3. **Widen the canvas container**

   Currently max-width is 600px. Make the overall layout a two-column grid:
   - Left: canvas (keep at 600px)
   - Right: activity log panel (flex-grow, min 300px)

### Implementation notes
- Use Svelte 5 runes ($state, $derived, $effect)
- The thinktank page already passes SSE data to PixelLabVisualization via props
- Match the dark theme / glass-card styling of the rest of the app
- The canvas click detection should use addEventListener on the canvas element + coordinate math against the breadcrumb circle positions

### PR title: "Add activity log side panel and clickable phase details to Agent Lab visualization"
```

---

## INSTANCE 5 — Build out Jules AI assistant

```
## Task: Make Jules a context-aware grant assistant

### Current state

Backend (`backend/src/routes/jules.js`, 25 lines):
- POST `/api/jules/chat` — forwards message to JulesAgent.chat()
- GET `/api/jules/health` — returns mock health status

Service (`backend/src/services/thinktankAgents.js`, JulesAgent class starting line 9):
- Has a basic persona prompt
- Calls Gemini with user message + generic context
- Health check returns hardcoded values

Frontend (`frontend/src/routes/jules/+page.svelte`):
- Has a chat UI (check what exists)

API client (`frontend/src/lib/api.ts`):
- `askJules(message, context)` and `checkJulesHealth()` already exist

### What to implement

1. **Backend — Context-aware Jules**

   Modify the `JulesAgent` class in `backend/src/services/thinktankAgents.js`:

   a. Update the `chat` method to accept richer context and query Supabase:
   - Fetch the user's grants from Supabase (top 10 by relevance_score)
   - Fetch any active research sessions
   - Fetch the user's company profile (if it exists in settings)
   - Include this data in the Gemini prompt so Jules can answer questions like:
     - "Which grants should I apply for?"
     - "What's the status of my research?"
     - "How does [grant X] match my company?"

   b. Update the persona prompt to be a grant strategy advisor:
   - Jules should know about grant application strategies
   - Jules should reference specific grants by name when advising
   - Jules should be able to compare grants and recommend priorities

   c. Implement real health checks:
   - Ping Supabase connection
   - Check if Gemini API key is configured
   - Return real status values

2. **Backend — Chat history**

   Add conversation memory so Jules remembers context within a session:
   - Store recent messages (last 10) in memory or Supabase
   - Include conversation history in the Gemini prompt
   - Add a POST `/api/jules/clear` endpoint to reset conversation

3. **Frontend — Verify and improve chat UI**

   Check `frontend/src/routes/jules/+page.svelte` and ensure:
   - Messages display in a scrollable chat format
   - User messages are right-aligned, Jules messages left-aligned
   - There's a text input with send button
   - Loading state while Jules is thinking
   - Error handling if Jules fails to respond
   - A "Clear conversation" button

   If the page is mostly stubbed, build it out following the glass-card dark theme pattern used across the app.

### Implementation notes
- Use the existing `geminiModel` from `backend/src/config/gemini.js`
- Use the existing Supabase client from `backend/src/config/supabase.js` (or wherever it's configured)
- The frontend should use `askJules()` from `frontend/src/lib/api.ts` — it already exists
- Use Svelte 5 runes ($state, $derived, $effect)

### PR title: "Build context-aware Jules AI assistant with grant knowledge and chat history"
```
