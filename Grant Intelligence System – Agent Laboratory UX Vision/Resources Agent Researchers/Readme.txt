###Agent Laboratory Research Track & Real-Time Visualization


###Context

The current application distinguishes between two paths:

1.Fast track – quick AI-generated proposal in ≈30 seconds.
2.Research track – deep autonomous research with real-time multi-agent visualisations.

At the moment, the research track relies on a mock implementation rather than real LLM researchers, because the full Agent Laboratory Python pipeline has not been wired in. This is unacceptable given that the LLM researcher is a critical success factor for the entire system. This repository aims to replace the mock path with a faithful integration of Agent Laboratory: Using LLM Agents as Research Assistants.​-https://agentlaboratory.github.io/

###Upstream Specification & Resources

Agent Laboratory is an autonomous LLM-based framework that takes a human research idea and produces a research report plus a code repository by progressing through three main phases: (1) Literature Review, (2) Experimentation, and (3) Report Writing - https://github.com/SamuelSchmidgall/AgentLaboratory

###Authoritative resources:

##Website: https://agentlaboratory.github.io/ – high-level overview of workflow, phases, and agent roles.​

##Code (reference implementation): https://github.com/SamuelSchmidgall/AgentLaboratory.git – Python framework and CLI for running the full pipeline.​ - https://github.com/SamuelSchmidgall/AgentLaboratory

##Installation guide: (mirrored in resources/agent-research/installation-guide.txt) – step-by-step environment setup, dependencies, and commands.

##Paper: Schmidgall et al., Agent Laboratory: Using LLM Agents as Research Assistants, arXiv:2501.04227. - https://arxiv.org/pdf/2501.04227

This project treats the above implementation and paper as the source of truth for the research workflow and agent behavior.

##Goal for This Repository
Implement the full research track by correctly installing and invoking the upstream Agent Laboratory Python workflow (three phases, mle-solver, paper-solver) from this application.​

Provide a real-time, low-fidelity visualization of the agent team and research stages, so humans can see and grant lab workers in the process as it runs.

The LLM researcher path must be fully functional (no mocks) for the overall system to be considered production-ready.

### Agent Laboratory Real-Time Visualization

Vision
Low-fidelity pixel-art game view showing the multi-agent research team working in real time, with a breadcrumb trail that demonstrates progress through the 7 research stages. The breadcrumb mockup is stored in the breadcrumb/ folder. The visual goal is to resemble a real academic lab monitoring screen.

Technical Stack
Engine: Litecanvas (~4KB HTML5 canvas engine) – minimal game-dev complexity.​ - https://github.com/litecanvas/game-engine.git

Game logic: Driven by an SSE stream using the standard EventSource API; each character reflects backend state so users can see how data flows through the system.​

Alternative: Plain Canvas loop (~100 lines of code) if Litecanvas is not desired.

Data source: SSE stream from `/api/research/:id/stream` (emits Agent Laboratory stage and agent updates).

Visual Elements
Base tiles and props from the Land of Pixels laboratory tileset (included in this repo), plus custom character sprites.

1. Horizontal breadcrumb timeline (7 stages across the top) styled to match the tileset.

2. Agent sprites below the timeline (4–5 researcher characters representing key Agent Laboratory roles).

3. Real-time state updates driven by SSE events.

4. Clicking a stage opens a panel with logs and artefacts for that stage (e.g., retrieved papers, experiment runs, report drafts).

5. There is a section on the side that brings the text following to the visual UI/UX so the user can follow what is happening not only visually.

SSE Event Schema
json

{
  "type": "stage_started",        // stage_started | stage_completed | agent_active | agent_idle
  "stage": "Literature Review",   // one of the 7 research stages
  "agent": "lit_reviewer",        // agent identifier
  "message": "Found 12 relevant papers..."
}

All visualisation logic consumes events in this format, independent of the upstream Python implementation.

## Implementation Priority
Phase 3 (stretch goal) within the broader roadmap.

Non-blocking for Phase 1 (Discovery) and Phase 2 (Research), but required for a complete research-track experience. During discovery and guidelines, documents, topics, and guidelines must be passed to the agent lab team.

Target outcome: approximately 5× faster innovation of new business models and significantly better and more original answers to the questions the research grants are trying to solve.

## Why This Approach Works
Plug-and-play: Litecanvas is a tiny (~4KB gzipped) drop-in HTML5 canvas engine, so no full game engine is required.​

Real-time by design: SSE is a natural fit for streaming agent events into the viewer without polling, keeping the implementation simple and efficient.​

Debuggable: Agent visualisation and trace tools (such as AgentPrism) show that timeline-style views of agent behaviour can cut debugging time dramatically, motivating this design choice.​

Reusable: The viewer and SSE schema are generic; other Agent Lab–style projects can reuse this component with minimal changes.

## Overview

The top-down game view gives you a live dashboard showing which agents are active, what stage they're in, and lets users drill into artefacts at each stage - turning the "black box" AI research into a transparent, engaging process that builds trust and makes debugging 80% faster. To facilitate this you will create  

