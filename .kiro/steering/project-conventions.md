---
inclusion: always
---

# Animated Story Creator — Project Conventions

## Tech Stack
- Frontend: React 19, React Router 7, Tailwind CSS v4, Lucide React (icons), GSAP, @hyperframes/player
- Backend: Hono on Node.js, SQLite via better-sqlite3 (WAL mode), TypeScript (ESM)
- AI Services: Google Gemini (`@google/genai` SDK), Azure OpenAI (REST + Agents SDK), ElevenLabs (`@elevenlabs/elevenlabs-js`)
- Video: HyperFrames HTML compositions with GSAP timelines

## Project Structure
- `client/` — React SPA (Vite)
- `server/` — Hono API server
- `server/src/repositories/` — SQLite data access layer (one file per entity)
- `server/src/services/` — AI providers, asset storage, video pipeline, supporting utilities
- `server/src/routes/` — Hono route modules (one file per domain)
- `server/src/data/` — Static data: effect presets, scene presets, style presets
- `client/src/pages/` — One page component per workflow step
- `client/src/components/ui/` — Shared reusable UI components
- `client/src/lib/` — API client (`api.ts`) and TypeScript types (`types.ts`)

## Coding Patterns
- Use `uuid` for all entity IDs
- Use Hono's `c.json()` for all API responses
- Use the shared `fetchApi` utility in `client/src/lib/api.ts` for all frontend API calls
- Use `withAiRetries` from `server/src/services/ai-retry.ts` for all AI service calls
- Use `runWithDebug` / `withStage` from `server/src/services/debug-logger.ts` to wrap AI operations for logging
- Use `generateStructured<T>()` with JSON schemas for structured AI output — avoid parsing free-text AI responses
- Use the provider factory in `server/src/services/providers.ts` — never instantiate providers directly
- Use `saveImage`, `saveAudio`, `saveHtml` from `server/src/services/asset-storage.ts` for all generated files
- Use `inferProjectStoryLanguage` from `server/src/services/story-language.ts` to detect story language and build same-language instructions for AI prompts

## UI Conventions
- Use Lucide React icons — no emoji characters
- Use the shared UI components (`Button`, `Input`, `Card`, `LoadingSpinner`, `ErrorToast`, `AudioPlayer`, `PageHeader`)
- Show loading states during all AI generation operations
- Show error toasts for API failures using `ApiError`
- Workflow navigation follows: Style → Characters → Locations → Script → Video

## Database
- SQLite with WAL mode and foreign keys enabled
- Non-destructive migrations via ALTER TABLE with try/catch for adding columns
- All timestamps stored as ISO strings via `datetime('now')`
- Asset paths stored as relative paths (e.g., `images/uuid.png`), served at `/assets/`

## Environment Variables
- All AI API keys are server-side only — the frontend never touches API keys
- Provider selection via `TEXT_IMAGE_PROVIDER` env var (`gemini` default, `azure` optional)
- Gemini model names configurable via `GEMINI_TEXT_MODEL`, `GEMINI_TEXT_FAST_MODEL`, `GEMINI_IMAGE_MODEL`
