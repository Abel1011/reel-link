# 🎬 Reel&Ink — Animated Story Studio

**Turn a single prompt into a fully animated video story** — built with spec-driven development in **Kiro** and powered by **ElevenLabs** audio AI.

> 🏆 Submission for [LiveHack #5: Kiro Challenge](https://hacks.elevenlabs.io/hackathons/4) — Build an AI-powered app using Kiro's spec-driven development and ElevenLabs APIs.

---

## How Kiro Drove the Development

Reel&Ink was built entirely inside **Kiro**, the AI-first IDE. The project started with a spec-driven first iteration — requirements, design, and tasks defined upfront — then evolved through vibecoding for UI polish, responsive design, and feature refinement. The specs stayed in place throughout to keep the codebase structured and consistent.

### Specs — The Foundation

The full spec lives in `.kiro/specs/animated-story-creator/` with three documents:

- **requirements.md** — 11 requirements covering project management, AI mode, style configuration, character/location generation, script writing, audio production, video composition, presets, backend API, and UI design. Each requirement has testable acceptance criteria.
- **design.md** — Technical architecture: component diagram, database schema (SQLite with 8 tables), API endpoints (20+ routes), AI service interfaces (`TextImageProvider`, `ElevenLabsServiceInterface`), video pipeline stages, error handling matrix, and correctness properties.
- **tasks.md** — 15 ordered implementation tasks broken into subtasks, each referencing specific requirements. Kiro's agent worked through these systematically: data layer → services → API routes → frontend → video pipeline.

This spec-first approach meant the AI agent had full context of the system architecture when implementing any piece — it knew the database schema when writing routes, knew the API shape when building frontend pages, and knew the asset pipeline when composing video.

### Steering Files — Keeping Code Consistent

Five steering files in `.kiro/steering/` encode project conventions that Kiro loads automatically based on context:

| File | Inclusion | What it does |
|------|-----------|-------------|
| `project-conventions.md` | Always | Tech stack, project structure, coding patterns (use `uuid` for IDs, `withAiRetries` for AI calls, `generateStructured<T>()` for JSON output), UI conventions, database rules |
| `backend-routes.md` | When editing `server/src/routes/**` | Route structure patterns, error handling (404/400/500/422), debug logging wrapping, AI Mode specifics |
| `backend-services.md` | When editing `server/src/services/**` | AI provider call patterns, ElevenLabs usage, asset storage conventions, creative prompt templates, video pipeline functions |
| `frontend-pages.md` | When editing `client/src/pages/**` | Page structure, data fetching with `api.ts`, state management (useState/useEffect only), loading/error patterns |
| `hyperframes-reference.md` | Manual inclusion | Full HyperFrames composition reference: data attributes, GSAP timelines, nested compositions, caption system, Story Motion Kit API |

These steering files meant that whether Kiro was writing a new route, a new page, or fixing a bug, it always followed the same patterns — consistent error handling, consistent state management, consistent AI call wrapping.

### Hooks — Automated Quality Gates

Three agent hooks in `.kiro/hooks/` run automatically on file changes:

- **Sync Shared Types** — When `server/src/types.ts` is edited, the agent automatically compares shared interfaces with `client/src/lib/types.ts` and syncs changes. This kept frontend and backend types aligned without manual copy-paste.
- **TypeCheck Server on Save** — Runs `tsc --noEmit` on the server codebase when any server source file is edited, catching type errors immediately.
- **Lint HyperFrames Compositions** — Runs `npx hyperframes lint` when HTML composition files are edited, catching structural errors (missing data attributes, overlapping tracks).

### MCP Servers — Extended Agent Capabilities

Three MCP servers configured in `.kiro/settings/mcp.json` gave the agent additional tools:

- **SQLite MCP** — Direct database access to `server/data/stories.db` for inspecting schema, querying data, and debugging persistence issues during development.
- **Fetch MCP** — URL fetching for reading documentation and API references when the agent needed to verify SDK usage or check endpoint specs.
- **Firecrawl MCP** — Web scraping and search capabilities that gave the agent access to the web during development — used to look up ElevenLabs API docs, HyperFrames documentation, GSAP animation references, and Hono middleware patterns.

### Kiro Powers

- **ElevenLabs Power** — Gave the agent working knowledge of all ElevenLabs APIs (TTS, Voice Design, Music, Sound Effects, Conversational AI) without manually reading docs. Context loaded dynamically based on what was being built.
- **HyperFrames Power** — Composition authoring reference, GSAP animation patterns, and CLI commands for the video pipeline.

---

## How ElevenLabs Powers the Audio

Every sound in Reel&Ink comes from ElevenLabs. The integration lives in `server/src/services/elevenlabs-service.ts` using the `@elevenlabs/elevenlabs-js` SDK.

### Voice Design — Unique Voices from Text

Instead of picking from stock voices, the system creates a unique voice for each character. The AI generates a voice description (e.g., "A warm, gravelly male voice with a slight rasp, mid-40s, confident but gentle"), and ElevenLabs' Voice Design API creates a custom voice from that description. If voice design fails, the system falls back to preset voices (Rachel, Domi, Bella, Antoni, Elli, Josh).

### Text-to-Speech — Narration and Dialogue

Uses the `eleven_v3` model for expressive speech with word-level timestamps. Each dialogue line includes `previousText` and `nextText` context so the voice flows naturally across lines. The word-level timestamps (`{ word, startMs, endMs }`) drive subtitle synchronization and animation timing in the video composition.

### Music Generation

Each scene gets original background music composed via the ElevenLabs music endpoint. The script's music cue (e.g., "Tense orchestral build with pizzicato strings") is sent as a prompt with a duration matching the scene length.

### Sound Effects

Contextual sound effects generated from text cues in the script (e.g., "Heavy rain on a tin roof", "Footsteps on gravel"). Each scene can have its own ambient sound effect layer.

---

## How HyperFrames Composes the Video

The video pipeline turns a script + audio + images into a playable animated video, all rendered as HTML with GSAP timelines.

### Three-Stage Pipeline

1. **Video Direction** — An AI agent (Azure OpenAI multi-agent pipeline, or Gemini fallback) plans every shot: which scene preset to use, which animation effects, camera angles, and how to layer images. The agents include a preset reviewer, section planner, critic, and director.

2. **Agentic Composition** — A second multi-agent pipeline (playbook → blueprint → HTML author → repair agent) generates the actual HyperFrames HTML. The composition includes `data-start`, `data-duration`, and `data-track-index` attributes for timing, plus a GSAP timeline registered on `window.__timelines` for animations.

3. **Deterministic Fallback** — If the agentic pipeline fails, a code-driven generator (`buildDeterministicComposition`) produces valid HyperFrames HTML programmatically — scene plans, timeline sections, overlay/caption rendering, all without AI. Video generation always succeeds.

### Audio-Visual Sync

Word-level timestamps from ElevenLabs drive the synchronization:
- Subtitle captions appear and disappear in sync with spoken words
- Character animations (speaking effects, emphasis) are timed to dialogue
- Scene transitions align with narration breaks
- Music and SFX layers are positioned on separate audio tracks with proper timing

The final composition is previewed in-browser using `@hyperframes/player`.

---

## What it Does

You type a story idea. The AI does the rest:

1. **Generates a visual style** — color palette, artistic medium, lighting, mood
2. **Creates characters** — names, descriptions, AI portraits, custom-designed voices
3. **Builds locations** — background matte paintings matching the visual direction
4. **Writes a structured script** — narrator text, dialogue, music cues, sound effects
5. **Produces all audio** — narration, dialogue, music, SFX (all ElevenLabs)
6. **Composes an animated video** — HyperFrames HTML with GSAP animations synced to audio

### Two Creation Modes

| Mode | How it works |
|------|-------------|
| **AI Mode** | One prompt → full pre-production in ~60s (style, 2 characters, 2 locations, brief). Then generate script, audio, and video step by step. |
| **Manual Mode** | Build everything yourself: pick a style, define characters, create locations, write the script, produce audio, compose video. |

---

## Tech Stack

- **Frontend**: React 19, React Router 7, Tailwind CSS v4, Lucide React, GSAP, @hyperframes/player
- **Backend**: Hono on Node.js, SQLite (better-sqlite3, WAL mode), TypeScript (ESM)
- **AI**: Google Gemini (`@google/genai`), Azure OpenAI (Agents SDK), ElevenLabs (`@elevenlabs/elevenlabs-js`)
- **Video**: HyperFrames HTML compositions with GSAP timelines
- **Development**: Kiro (specs, steering, hooks, powers, MCP servers)

---

## Getting Started

### Prerequisites

- **Node.js 22+** (use `nvm use` — `.nvmrc` included)
- API keys: **Gemini**, **ElevenLabs**, optionally **Azure OpenAI**

### Install and Run

```bash
git clone https://github.com/Abel1011/reel-link.git
cd reel-link
npm install
cp .env.example server/.env
# Edit server/.env with your API keys
```

Start backend and frontend in separate terminals:
```bash
npm run dev --workspace=server    # http://localhost:3001
npm run dev --workspace=client    # http://localhost:5173
```

### Docker

```bash
docker build -t reel-ink .
docker run -p 3001:3001 \
  -e GEMINI_API_KEY=your_key \
  -e ELEVENLABS_API_KEY=your_key \
  -v story-data:/app/server/data \
  -v story-assets:/app/server/assets \
  reel-ink
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key |
| `AZURE_OPENAI_API_KEY` | No | Azure OpenAI (multi-agent video pipelines) |
| `AZURE_OPENAI_ENDPOINT` | No | Azure OpenAI endpoint URL |
| `TEXT_IMAGE_PROVIDER` | No | `gemini` (default) or `azure` |
| `PORT` | No | Server port (default: `3001`) |

---

## Project Structure

```
reel-ink/
├── .kiro/
│   ├── specs/                 # Requirements, design, tasks
│   ├── steering/              # Project conventions, route/service/page patterns
│   ├── hooks/                 # Type sync, typecheck, HyperFrames lint
│   └── settings/mcp.json     # SQLite, Fetch, Firecrawl MCP servers
├── client/                    # React frontend (Vite)
│   ├── src/pages/             # Landing, AI Mode, Style, Characters,
│   │                          #   Locations, Script, Video
│   └── public/hyperframes/    # HyperFrames player + Story Motion Kit
├── server/                    # Hono backend
│   ├── src/routes/            # 9 API route modules
│   ├── src/services/          # AI providers, ElevenLabs, video pipeline
│   ├── src/repositories/      # SQLite data access (6 repositories)
│   └── src/data/              # Style, scene, effect presets
├── powers/                    # Kiro Powers (HyperFrames)
└── Dockerfile                 # Multi-stage build (Node 22)
```
