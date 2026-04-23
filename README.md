# 🎬 Reel&Ink — Animated Story Studio

**Turn a single prompt into a fully animated video story** — built with spec-driven development in **Kiro** and powered by **ElevenLabs** audio AI.

> 🏆 Submission for [LiveHack #5: Kiro Challenge](https://elevenlabs.io) — Build an AI-powered app using Kiro's spec-driven development and ElevenLabs APIs.

---

## Built with Kiro — Spec-Driven Development

This entire project was designed and implemented using **Kiro**, the AI-first IDE that uses spec-driven development. Instead of ad-hoc prompting, every feature followed a structured workflow:

1. **Requirements** — defined what the app should do in clear, testable specs
2. **Design** — Kiro's AI agent helped architect the technical approach (database schema, API routes, service layers, component hierarchy)
3. **Tasks** — broke the design into ordered implementation tasks
4. **Implementation** — Kiro's agent executed each task systematically, producing maintainable, well-structured code

The full specs live in `.kiro/specs/animated-story-creator/` — requirements, design, and task breakdown. The steering files in `.kiro/steering/` encode project conventions so every AI-generated file follows the same patterns.

### Kiro Features Used

- **Specs** — structured requirements → design → tasks workflow for the entire app
- **Steering files** — project conventions, backend patterns, frontend patterns, and HyperFrames reference loaded automatically into context
- **Hooks** — automated linting, type-checking, and shared type syncing on file changes
- **ElevenLabs Power** — Kiro Power plugin that gave the AI agent working knowledge of all ElevenLabs APIs without reading docs manually
- **HyperFrames Power** — Kiro Power for HTML-based video composition authoring with GSAP animations

---

## Powered by ElevenLabs Audio AI

ElevenLabs is the backbone of all audio in Reel&Ink. Every voice, every sound, every musical note is generated through their APIs:

| ElevenLabs API | What it does in Reel&Ink |
|----------------|--------------------------|
| **Text-to-Speech (v3)** | Narration and character dialogue with expressive, natural voices and word-level timestamps for subtitle sync |
| **Voice Design** | Creates unique custom voices for each character from text descriptions — no voice cloning needed, just describe the personality |
| **Music Generation** | Composes original background music per scene matching the story's mood and tone |
| **Sound Effects** | Generates contextual sound effects (footsteps, wind, doors, ambient) from text cues in the script |

The ElevenLabs integration lives in `server/src/services/elevenlabs-service.ts` and is used across the script generation and audio production pipeline.

---

## What it does

You type a story idea. The AI does the rest:

1. **Generates a visual style** — color palette, artistic medium, lighting, mood
2. **Creates characters** — names, descriptions, AI-generated portraits, custom-designed voices (ElevenLabs Voice Design)
3. **Builds locations** — background matte paintings matching the story's visual direction
4. **Writes a structured script** — narrator text, character dialogue, music cues, sound effects
5. **Produces all audio** — narrated voiceover, character dialogue with word-level timestamps, background music, sound effects (all ElevenLabs)
6. **Composes an animated video** — HyperFrames HTML composition with GSAP animations, synchronized to audio timestamps

The result is a playable animated video preview right in the browser.

## Two creation modes

| Mode | How it works |
|------|-------------|
| **AI Mode** | One prompt → full pre-production in ~60 seconds (style, 2 characters, 2 locations, story brief). Then generate script, audio, and video step by step. |
| **Manual Mode** | Build everything yourself: pick a style preset, define characters, create locations, write/generate the script, produce audio, compose video. |

---

## Tech Stack

### Frontend
- **React 19** + **React Router 7** — SPA with step-by-step workflow navigation
- **Tailwind CSS v4** — custom paper/ink color palette, distinctive typography
- **Lucide React** — icon system
- **GSAP** — animation engine for video compositions
- **@hyperframes/player** — in-browser video preview

### Backend
- **Hono** — lightweight HTTP framework on Node.js
- **SQLite** (better-sqlite3) — embedded database with WAL mode
- **TypeScript** — end-to-end type safety

### AI Services
- **Google Gemini** (`@google/genai` SDK) — text generation, image generation, structured JSON output
- **Azure OpenAI** (Agents SDK) — multi-agent video direction and composition pipelines
- **ElevenLabs** — TTS, voice design, music composition, sound effects

### Video Pipeline
- **HyperFrames** — HTML-based video composition with GSAP timelines
- Three-stage generation: AI direction → agentic composition → deterministic fallback

---

## Getting Started

### Prerequisites

- **Node.js 22+** (use `nvm use` — `.nvmrc` included)
- API keys for: **Gemini**, **ElevenLabs**, and optionally **Azure OpenAI**

### 1. Clone and install

```bash
git clone https://github.com/Abel1011/reel-link.git
cd reel-link
npm install
```

### 2. Configure environment

```bash
cp .env.example server/.env
```

Edit `server/.env`:

```env
GEMINI_API_KEY=your_gemini_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# Optional — enables multi-agent video pipelines
AZURE_OPENAI_API_KEY=your_azure_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
```

### 3. Run in development

Start the backend:
```bash
npm run dev --workspace=server
```

In a separate terminal, start the frontend:
```bash
npm run dev --workspace=client
```

Open **http://localhost:5173**.

---

## Docker

```bash
docker build -t reel-ink .

docker run -p 3001:3001 \
  -e GEMINI_API_KEY=your_key \
  -e ELEVENLABS_API_KEY=your_key \
  -v story-data:/app/server/data \
  -v story-assets:/app/server/assets \
  reel-ink
```

Open **http://localhost:3001**. Volumes persist the database and generated assets.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key |
| `AZURE_OPENAI_API_KEY` | No | Azure OpenAI key (multi-agent video pipelines) |
| `AZURE_OPENAI_ENDPOINT` | No | Azure OpenAI endpoint URL |
| `TEXT_IMAGE_PROVIDER` | No | `gemini` (default) or `azure` |
| `PORT` | No | Server port (default: `3001`) |

---

## Project Structure

```
reel-ink/
├── client/                    # React frontend (Vite)
│   ├── src/pages/             # Landing, AI Mode, Style, Characters,
│   │                          #   Locations, Script, Video
│   ├── src/components/ui/     # Shared UI components
│   ├── src/layouts/           # ProjectLayout (step navigation)
│   └── public/hyperframes/    # HyperFrames player + vendor assets
├── server/                    # Hono backend
│   ├── src/routes/            # API route modules
│   ├── src/services/          # AI providers, ElevenLabs, video pipeline
│   ├── src/repositories/      # SQLite data access layer
│   └── src/data/              # Style, scene, effect presets
├── .kiro/                     # Kiro specs, steering, hooks
├── powers/                    # Kiro Powers (HyperFrames)
├── Dockerfile                 # Multi-stage build
└── .env.example               # Required environment variables
```

---

## How the Video Pipeline Works

```
Story Script + Audio Assets (ElevenLabs)
        │
        ▼
┌─────────────────────┐
│  Video Direction     │  AI plans shots, camera angles,
│  (Azure agents or   │  effects, image strategies
│   Gemini fallback)   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Agentic Composition │  Multi-agent HTML generation:
│  playbook → blueprint│  playbook → blueprint → author → repair
│  → author → repair   │
└────────┬────────────┘
         │ fails?
         ▼
┌─────────────────────┐
│  Deterministic       │  Code-driven fallback:
│  Composition         │  always produces valid HTML
└────────┬────────────┘
         │
         ▼
   @hyperframes/player
   (in-browser preview)
```
