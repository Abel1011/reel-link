# 🎬 Animated Story Creator

**Turn a single prompt into a fully animated video story** — powered by Gemini, Azure OpenAI, ElevenLabs, and HyperFrames.

Built for the [AWS Hackathon](https://aws.amazon.com) using **Kiro** as the AI-assisted development environment.

---

## What it does

You type a story idea. The AI does the rest:

1. **Generates a visual style** — color palette, artistic medium, lighting, mood
2. **Creates characters** — names, descriptions, AI-generated portraits, custom-designed voices
3. **Builds locations** — background matte paintings matching the story's visual direction
4. **Writes a structured script** — narrator text, character dialogue, music cues, sound effects
5. **Produces all audio** — narrated voiceover, character dialogue with word-level timestamps, background music, sound effects
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
- **Tailwind CSS v4** — custom color palette, distinctive typography, motion effects
- **Lucide React** — icon system (no emoji)
- **GSAP** — animation engine for video compositions
- **@hyperframes/player** — in-browser video preview and rendering

### Backend
- **Hono** — lightweight, fast HTTP framework on Node.js
- **SQLite** (better-sqlite3) — embedded database with WAL mode, zero config
- **TypeScript** — end-to-end type safety

### AI Services
- **Google Gemini** (via `@google/genai` SDK)
  - `gemini-3.1-pro-preview` — deep reasoning for characters, scripts, story briefs
  - `gemini-3-flash-preview` — fast generation for styles, locations
  - `gemini-3.1-flash-image-preview` — portrait and background image generation
  - Structured JSON output via response schemas (no fragile text parsing)
- **Azure OpenAI** (via OpenAI Agents SDK)
  - Multi-agent video direction pipeline (preset reviewer → section planner → critic → director)
  - Multi-agent HTML composition pipeline (playbook → blueprint → authoring → validation/repair)
- **ElevenLabs**
  - `eleven_v3` — expressive TTS with word-level timestamps
  - Voice Design API — custom voices per character from text descriptions
  - Music composition and sound effect generation

### Video Pipeline
- **HyperFrames** — HTML-based video composition format with `data-*` timing attributes
- **Three-stage generation**: AI video direction → agentic HTML composition → deterministic fallback
- **Predefined presets**: effect presets (GSAP animations) + scene presets (camera framing templates)

### Development Tools
- **Kiro** — AI-assisted IDE used throughout development for spec-driven design, code generation, and iteration
- **Vite** — dev server with HMR and API proxy to backend

---

## Project Structure

```
animated-story-creator/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/ui/     # Shared UI components
│   │   ├── layouts/           # ProjectLayout (step navigation)
│   │   ├── lib/               # API client, TypeScript types
│   │   └── pages/             # Landing, AI Mode, Style, Characters,
│   │                          #   Locations, Script, Video
│   └── public/hyperframes/    # HyperFrames player + vendor assets
├── server/                    # Hono backend
│   ├── src/
│   │   ├── data/              # Effect presets, scene presets, style presets
│   │   ├── repositories/      # SQLite data access (project, style,
│   │   │                      #   character, location, script, composition)
│   │   ├── routes/            # API route modules (project, style,
│   │   │                      #   character, location, script, audio,
│   │   │                      #   video, ai-mode, debug)
│   │   └── services/          # AI providers, ElevenLabs, asset storage,
│   │                          #   video composer, video direction,
│   │                          #   retry, debug logger, language detection
│   ├── assets/                # Generated images, audio, HTML (gitignored)
│   ├── data/                  # SQLite database (gitignored)
│   └── logs/                  # AI debug logs (gitignored)
├── Dockerfile                 # Multi-stage build (single container)
└── .env.example               # Required environment variables
```

---

## Getting Started

### Prerequisites

- **Node.js 22+**
- API keys for: **Gemini**, **ElevenLabs**, and optionally **Azure OpenAI**

### 1. Clone and install

```bash
git clone <repo-url>
cd animated-story-creator
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example server/.env
```

Edit `server/.env` with your API keys:

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
cd server
npm run dev
```

In a separate terminal, start the frontend:
```bash
cd client
npm run dev
```

Open **http://localhost:5173** — the Vite dev server proxies `/api` and `/assets` to the backend on port 3001.

---

## Docker

Build and run everything in a single container:

```bash
# Build
docker build -t animated-story-creator .

# Run
docker run -p 3001:3001 \
  -e GEMINI_API_KEY=your_key \
  -e ELEVENLABS_API_KEY=your_key \
  -v story-data:/app/server/data \
  -v story-assets:/app/server/assets \
  animated-story-creator
```

Open **http://localhost:3001**.

The volumes persist your SQLite database and generated assets across container restarts.

### Optional Azure OpenAI (for enhanced video generation)

```bash
docker run -p 3001:3001 \
  -e GEMINI_API_KEY=your_key \
  -e ELEVENLABS_API_KEY=your_key \
  -e AZURE_OPENAI_API_KEY=your_key \
  -e AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com \
  -v story-data:/app/server/data \
  -v story-assets:/app/server/assets \
  animated-story-creator
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key |
| `AZURE_OPENAI_API_KEY` | No | Azure OpenAI key (enables multi-agent video pipelines) |
| `AZURE_OPENAI_ENDPOINT` | No | Azure OpenAI endpoint URL |
| `TEXT_IMAGE_PROVIDER` | No | `gemini` (default) or `azure` |
| `GEMINI_TEXT_MODEL` | No | Override pro text model (default: `gemini-3.1-pro-preview`) |
| `GEMINI_TEXT_FAST_MODEL` | No | Override flash text model (default: `gemini-3-flash-preview`) |
| `GEMINI_IMAGE_MODEL` | No | Override image model (default: `gemini-3.1-flash-image-preview`) |
| `PORT` | No | Server port (default: `3001`) |

---

## How the Video Pipeline Works

```
Story Script + Assets
        │
        ▼
┌─────────────────────┐
│  Video Direction     │  AI plans shots: scene presets, effects,
│  (Azure agents or   │  camera angles, image strategies
│   Gemini fallback)   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Agentic Composition │  Azure agents generate HyperFrames HTML
│  (playbook → blueprint│  through 4 specialized stages
│   → author → repair) │
└────────┬────────────┘
         │ fails?
         ▼
┌─────────────────────┐
│  Deterministic       │  Code-driven fallback: always produces
│  Composition         │  valid HTML, no AI needed
└────────┬────────────┘
         │
         ▼
   @hyperframes/player
   (in-browser preview)
```

---

## Built with Kiro

This project was developed using **Kiro**, an AI-assisted IDE. The entire development lifecycle — from requirements gathering and technical design to implementation — was guided by Kiro's spec-driven development workflow. The specs live in `.kiro/specs/animated-story-creator/`.
