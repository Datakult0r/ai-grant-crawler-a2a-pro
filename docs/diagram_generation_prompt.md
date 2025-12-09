# 🎨 Ultimate Architecture Diagram Prompt

Here is the scientifically accurate, visually optimized prompt to generate the **Agent Laboratory System Architecture** diagram in the style of ByteByteGo.

## 📋 The Prompt (Copy & Paste This)

```text
Create a high-fidelity technical system architecture diagram in the style of ByteByteGo (System Design Interview).

**STYLE GUIDE:**
- **Perspective**: FLAT 2D (No isometric, no 3D).
- **Background**: Pure White (#FFFFFF).
- **Line Work**: Thin, crisp dark grey outlines (#333333).
- **Shapes**: Simple rectangles with rounded corners, pill-shaped labels.
- **Palette**: Pastel Blue (UI), Pastel Orange (Discovery), Pastel Green (Backend), Pastel Purple (AI Agents).
- **Typography**: Clean, professional Sans-Serif (Inter/Helvetica). High contrast.

**LAYOUT**:
Divide the image into 4 sequential vertical sections flowing LEFT to RIGHT:

**SECTION 1: DISCOVERY ENGINE (Pastel Orange Theme)**
- **Header**: "PHASE 1: DISCOVERY"
- **Input**: 3 Icons labeled "European Union", "Grants.gov", "Foundations".
- **Process**: Arrow pointing to a box labeled "Firecrawl Scraper" -> Arrow to a Diamond Shape labeled "AI Relevance Filter".
- **Decision Logic**:
  - Arrow going DOWN labeled "Score < 50 (Discard)" pointing to a trash icon.
  - Arrow going RIGHT labeled "Score > 50 (Match)" pointing to Section 2.
- **Model Label**: "Gemini 2.5 Pro"

**SECTION 2: FRONTEND PLATFORM (Pastel Blue Theme)**
- **Header**: "PHASE 2: INTERFACE"
- **Visual**: A simplified "Browser Window" Frame containing a list of grant cards.
- **Action**: A prominent button labeled "APPLY NOW".
- **Connection**: Double-headed arrow labeled "Real-time SSE" connecting to Section 3.
- **Framework Label**: "SvelteKit"

**SECTION 3: ORCHESTRATION (Pastel Green Theme)**
- **Header**: "PHASE 3: BACKEND"
- **Container**: A box labeled "Node.js API".
- **Components**:
  - Cylinder icon labeled "Supabase DB".
  - Logic Box labeled "Strategy Router".
- **Splitting Paths**:
  - Path A (Up): "Fast Track (30s)" -> icon of Lightning Bolt.
  - Path B (Right): "Research Track (15m)" -> pointing to Section 4.

**SECTION 4: AGENT LABORATORY (Pastel Purple Theme)**
- **Header**: "PHASE 4: AI RESEARCH LAB"
- **Structure**: A sequential Flowchart of 6 Agent Nodes connected by arrows:
  1. **PhD Student** [Icon: Book] - Label: "Claude Opus 4.5"
     ↓
  2. **Postdoc** [Icon: Clipboard] - Label: "Gemini 3 Pro (FREE)"
     ↓
  3. **ML + SW Engineer** [Icon: Gear] - Label: "GPT-5 Codex"
     ↓
  4. **Professor** [Icon: Quill] - Label: "Claude Sonnet 4.5 (Writing)"
     ↓
  5. **Reviewers** [Icon: Shield] - Label: "Gemini 3 Pro (Quality)"
- **Output**: Arrow pointing to a Final Document icon labeled "RESEARCH PROPOSAL".

**FOOTER LEGEND**:
"Maximum Quality Mode Cost: $7-15 | Gemini Models: FREE"
```

---

## 💡 Why This Prompt Works

1.  **Explicit Sectioning**: By defining "Section 1..4", we force the model to render the _Linear Flow_ you requested.
2.  **Phase 1 Detail**: The "Discovery" section explicitly describes the "Score > 50" logic, visualizing the filtering process.
3.  **Model Specifics**: It forces the inclusion of exact model names (Claude Opus 4.5, GPT-5) which adds the "Scientific Basis" credibility.
4.  **ByteByteGo Aesthetic**: The "Flat 2D", "Pastel", and "Dark Grey Outlines" keywords trigger the specific clean, educational style you wanted.
