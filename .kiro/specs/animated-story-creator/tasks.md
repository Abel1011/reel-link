# Implementation Plan: Animated Story Creator

## Overview

Build a full-stack web application for creating AI-powered animated video stories. The implementation follows an incremental approach: project scaffolding → data layer → backend API → AI service integrations → frontend components → video composition pipeline. Each task builds on the previous, ensuring no orphaned code.

## Tasks

- [x] 1. Scaffold project structure and install dependencies
  - Initialize a monorepo with `client/` (React + Vite + Tailwind CSS v4) and `server/` (Hono + Node.js) directories
  - Install shared dependencies: `uuid`, `better-sqlite3`, `@google/genai`, `@elevenlabs/elevenlabs-js`, `@hyperframes/player`, `openai` (for Azure agents)
  - Install server dependencies: `hono`, `@hono/node-server`, `better-sqlite3`, `dotenv`
  - Install client dependencies: `react`, `react-dom`, `react-router-dom`, `tailwindcss`, `lucide-react`, `gsap`
  - Configure Tailwind CSS v4 with the custom color palette and distinctive typography per Requirement 11.1, 11.2
  - Create a `.env.example` with placeholders for `GEMINI_API_KEY`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `ELEVENLABS_API_KEY`, `TEXT_IMAGE_PROVIDER`, and model override env vars
  - Set up Vite proxy to forward `/api` and `/assets` requests to the Hono backend during development
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 11.1, 11.2_

- [x] 2. Implement database layer and shared types
  - [x] 2.1 Define shared TypeScript types
    - Create `server/src/types.ts` with all interfaces: `StoryProject`, `StoryBrief`, `StyleConfig`, `Character`, `Location`, `StoryScript`, `ScriptSection`, `DialogueLine`, `ImageLayer`, `WordTimestamp`, `AssetManifest`, `EffectPreset`, `TextImageProvider`, `ElevenLabsServiceInterface`, `GenerateStructuredOptions`, `GenerateImageOptions`, `SpeechGenerationOptions`
    - Create `client/src/lib/types.ts` with frontend-facing types mirroring the server types plus `StylePreset` and `StyleGenre`
    - _Requirements: 1.3, 3.4, 4.2, 5.2, 6.4_
  - [x] 2.2 Create SQLite database initialization and schema
    - Create `server/src/db.ts` that initializes SQLite using `better-sqlite3` with WAL mode and foreign keys enabled
    - Run the full schema (projects with brief columns, styles, characters with image_prompt/voice_prompt/voice_preview_url, locations with image_prompt, scripts, script_sections with narrator_timestamps_json, dialogue_lines, image_layers, compositions)
    - Include non-destructive ALTER TABLE migrations for adding new columns to existing databases
    - Store the database file at `server/data/stories.db`
    - _Requirements: 10.6_
  - [x] 2.3 Implement Project repository
    - Create `server/src/repositories/project-repository.ts` with functions: `createProject`, `getProject` (with full nested loading of brief, style, characters, locations, script, sections, dialogue lines, image layers), `listProjects`, `updateProject`
    - `getProject` must return the complete `StoryProject` object with all associations and brief fields loaded
    - _Requirements: 1.3, 1.4_
  - [x] 2.4 Implement Style, Character, Location repositories
    - Create `server/src/repositories/style-repository.ts` with `saveStyle`, `getStyleByProjectId`
    - Create `server/src/repositories/character-repository.ts` with `addCharacter` (supporting optional imagePrompt, voicePrompt), `updateCharacter`, `deleteCharacter`, `getCharactersByProjectId`
    - Create `server/src/repositories/location-repository.ts` with `addLocation` (supporting optional imagePrompt), `updateLocation`, `deleteLocation`, `getLocationsByProjectId`
    - _Requirements: 3.4, 4.2, 5.2_
  - [x] 2.5 Implement Script and Composition repositories
    - Create `server/src/repositories/script-repository.ts` with `saveScript` (with sections, dialogue lines, image layers), `getScriptByProjectId`, `updateScriptSection`
    - Create `server/src/repositories/composition-repository.ts` with `saveComposition`, `getCompositionByProjectId`
    - _Requirements: 6.4, 6.5_

- [x] 3. Implement AI service providers and supporting services
  - [x] 3.1 Create TextImageProvider interface and Gemini implementation
    - Create `server/src/services/text-image-provider.ts` re-exporting the `TextImageProvider` interface from types
    - Create `server/src/services/gemini-provider.ts` implementing the interface using `@google/genai` SDK with configurable model names via env vars (`gemini-3.1-pro-preview` for pro text, `gemini-3-flash-preview` for fast text, `gemini-3.1-flash-image-preview` for images)
    - Implement `generateText`, `generateTextFast`, `generateStructured` (with JSON schema and response MIME type), and `generateImage` (with aspect ratio mapping and reference image support)
    - Integrate with debug logger and AI retry wrapper
    - _Requirements: 10.2_
  - [x] 3.2 Create Azure OpenAI provider implementation
    - Create `server/src/services/azure-openai-provider.ts` implementing `TextImageProvider` using REST API with `api-key` header
    - _Requirements: 10.3_
  - [x] 3.3 Create ElevenLabs service
    - Create `server/src/services/elevenlabs-service.ts` implementing the `ElevenLabsServiceInterface`
    - `generateSpeech`: uses `eleven_v3` model with word-level timestamps and contextual previous/next text
    - `generateMusic`: uses the music/compose endpoint
    - `generateSoundEffect`: uses `/v1/sound-generation` endpoint
    - `listVoices`: returns available voices
    - `designVoice`: creates custom voices from text descriptions via ElevenLabs voice design API
    - Integrate with debug logger
    - _Requirements: 10.4, 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 3.4 Create asset storage service
    - Create `server/src/services/asset-storage.ts` with functions to save image, audio, and HTML buffers to `server/assets/` directory
    - Generate unique filenames using UUID, return the relative path for database storage
    - _Requirements: 10.5_
  - [x] 3.5 Create AI retry service
    - Create `server/src/services/ai-retry.ts` with `withAiRetries` function: configurable max attempts, exponential backoff delays, non-retryable error detection (auth failures, invalid keys, 401/403)
    - _Requirements: 10.7_
  - [x] 3.6 Create debug logger service
    - Create `server/src/services/debug-logger.ts` with `AsyncLocalStorage`-based context propagation, `runWithDebug`, `withStage`, `logAiCall`, and `readAiLog` functions
    - Log all AI calls (text, textFast, image, speech, music, soundEffect, voiceDesign) with prompts, responses, timing, and errors to per-project JSONL files
    - _Requirements: 10.8_
  - [x] 3.7 Create story language detection service
    - Create `server/src/services/story-language.ts` with Spanish/English marker-based detection and language instruction builder for AI prompts
    - _Requirements: 10.9_
  - [x] 3.8 Create creative prompts service
    - Create `server/src/services/creative-prompts.ts` with centralized prompt templates, JSON schemas for structured output (style, characters, locations, brief, voice prompts), and fallback prompt builders for portraits, voices, and location images
    - _Requirements: 3.5, 4.3, 4.4, 5.3_
  - [x] 3.9 Create provider factory
    - Create `server/src/services/providers.ts` with `createTextImageProvider` factory function that selects Gemini or Azure OpenAI based on environment configuration
    - Export singleton instances of `textImageProvider` and `elevenLabsService`
    - _Requirements: 10.1_
  - [x] 3.10 Create audio duration service
    - Create `server/src/services/audio-duration.ts` with pure-JS MP3 duration calculator by scanning frame headers, and asset path resolution utility
    - _Requirements: 8.4_

- [x] 4. Implement backend API routes
  - [x] 4.1 Set up Hono app with middleware and static serving
    - Create `server/src/index.ts` with Hono app, CORS middleware, static file serving from `server/assets/` at `/assets/*`, health check endpoint, and request timeout configuration for long video generation
    - Create `server/src/routes/index.ts` to register all route modules
    - Load environment variables from `.env` using `dotenv`
    - _Requirements: 10.1_
  - [x] 4.2 Implement project CRUD routes
    - `GET /api/projects` — list all projects
    - `POST /api/projects` — create project (name, mode, optional prompt and brief fields)
    - `GET /api/projects/:id` — get full project with all nested data
    - `PUT /api/projects/:id` — update project metadata and brief
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 4.3 Implement style routes
    - `GET /api/style-presets` — list all predefined style presets organized by genre
    - `POST /api/projects/:id/style` — save or update style configuration
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 4.4 Implement character routes
    - `POST /api/projects/:id/characters` — add character (with optional imagePrompt, voicePrompt)
    - `PUT /api/projects/:id/characters/:charId` — update character
    - `DELETE /api/projects/:id/characters/:charId` — delete character
    - `POST /api/projects/:id/characters/:charId/generate-portrait` — generate portrait using character's imagePrompt or fallback prompt with style
    - `POST /api/projects/:id/characters/:charId/generate-voice` — design custom voice using character's voicePrompt or fallback prompt
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 3.5_
  - [x] 4.5 Implement location routes
    - `POST /api/projects/:id/locations` — add location (with optional imagePrompt)
    - `PUT /api/projects/:id/locations/:locId` — update location
    - `DELETE /api/projects/:id/locations/:locId` — delete location
    - `POST /api/projects/:id/locations/:locId/generate-image` — generate background using location's imagePrompt or fallback prompt with style
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 3.5_
  - [x] 4.6 Implement script generation and editing routes
    - `POST /api/projects/:id/generate-script` — generate structured Story_Script using AI with story language detection and brief-aware prompting
    - `PUT /api/projects/:id/script/sections/:sectionId` — update a script section's fields
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 4.7 Implement audio generation route
    - `POST /api/projects/:id/generate-audio` — iterate over all script sections, generate narrator audio (if enabled), dialogue audio with contextual previous/next text, music, and sound effects via ElevenLabs; save all audio files; update database records with file paths and word-level timestamps
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 4.8 Implement video composition generation route
    - `POST /api/projects/:id/generate-video` — validate all assets, build asset manifest with real MP3 durations, run video direction pipeline, run agentic HTML composition (with deterministic fallback on failure), save HTML file, persist composition record
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  - [x] 4.9 Implement AI Mode routes
    - `POST /api/projects/:id/ai-generate` — orchestrate full pre-production pipeline with progress tracking: generate style (flash) → generate characters with structured output (pro) → generate portraits (parallel) → design custom voices with fallback (parallel) → generate locations with structured output (flash) → generate location images (parallel) → generate story brief (pro) → return updated project
    - `GET /api/projects/:id/ai-generate/progress` — poll generation progress with creative stage labels
    - Include idempotency guards (in-flight detection and existing content detection)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 4.10 Implement debug routes
    - `GET /api/debug/...` — debug log retrieval for AI call inspection
    - _Requirements: 10.8_

- [x] 5. Create effect preset and scene preset libraries
  - Create `server/src/data/effect-presets.ts` with predefined GSAP animation presets — at least 2 variants for each situation type: `speaking`, `scene-transition`, `character-entrance`, `character-exit`, `emphasis`, `idle`
  - Create `server/src/data/scene-presets.ts` with predefined scene composition templates for camera framing and character placement
  - Create `server/src/data/style-presets.ts` with predefined style presets organized by genre (Comic, Anime, Painterly, 3D, Retro, Minimal) including swatches and preview prompts
  - _Requirements: 9.1, 9.2, 9.3, 3.2_

- [x] 6. Implement video direction pipeline
  - Create `server/src/services/video-direction.ts` with single-prompt Gemini-based video direction planner: shot-by-shot planning with scene presets, effect presets, camera directions, and image generation strategies
  - Create `server/src/services/video-direction-agents.ts` with multi-agent Azure OpenAI pipeline (preset reviewer → section planner → critic → director) for enhanced video direction when Azure is configured
  - _Requirements: 8.2, 9.4_

- [x] 7. Implement video composition pipeline
  - Create `server/src/services/video-composer.ts` with deterministic composition generator: scene plan building, timeline construction, overlay/caption rendering, GSAP animation integration, orientation-aware sizing, and full HyperFrames HTML output
  - Create `server/src/services/video-composition-agents.ts` with multi-agent Azure OpenAI pipeline (playbook → blueprint → HTML authoring → validation/repair) for AI-generated compositions with deterministic fallback
  - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 8. Build frontend foundation
  - [x] 8.1 Set up React app with routing and layout
    - Configure React Router with routes: `/` (landing), `/project/:id/ai-generate` (AI mode), `/project/:id` (project layout with nested step routes for style, characters, locations, script, video)
    - Create `ProjectLayout` component with step-by-step navigation sidebar: Style → Characters → Locations → Script → Video
    - Apply custom Tailwind theme: distinctive color palette, custom typography, CSS animations on interactive elements
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [x] 8.2 Create shared API client and UI utilities
    - Create `client/src/lib/api.ts` with a typed `fetchApi` utility, `ApiError` class, and convenience methods (get, post, put, delete)
    - Create reusable UI components: `Button`, `Input`, `Card`, `LoadingSpinner`, `ErrorToast`, `AudioPlayer`, `PageHeader` using Tailwind CSS and `lucide-react` icons
    - _Requirements: 11.3_

- [x] 9. Implement Landing Page
  - Create `LandingPage` component that fetches and displays existing projects as cards
  - Add "Create New Project" button with project name and mode selection (AI Mode / Manual Mode)
  - On project creation, POST to `/api/projects` and navigate to `/project/:id/ai-generate` (AI mode) or `/project/:id` (manual mode)
  - On project selection, navigate to `/project/:id`
  - _Requirements: 1.1, 1.2_

- [x] 10. Implement AI Mode Page
  - Create `AiModePage` component with prompt input screen
  - On submission, call `POST /api/projects/:id/ai-generate` and poll progress via `GET /api/projects/:id/ai-generate/progress`
  - Display multi-step progress indicator with creative stage labels
  - Once complete, navigate to the project layout with all generated data loaded for review
  - _Requirements: 2.1, 2.4, 2.5_

- [x] 11. Implement Style Page
  - Create `StylePage` component within the project layout
  - Display predefined style presets organized by genre with color swatches and visual previews
  - When a preset is selected, populate all style fields
  - Allow editing each field individually
  - Save style config via `POST /api/projects/:id/style` on changes
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 12. Implement Characters Page
  - Create `CharactersPage` component within the project layout
  - Display list of characters with name, description, portrait thumbnail, voice assignment status, and audio preview
  - Add form to create new characters (name + description), edit existing, and delete
  - Add "Generate Portrait" button per character that calls the generate-portrait endpoint and displays the result with a "Regenerate" option
  - Add "Assign Voice" button per character that calls the generate-voice endpoint
  - Show loading states during generation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 13. Implement Locations Page
  - Create `LocationsPage` component within the project layout
  - Display list of locations with name, description, and background image thumbnail
  - Add form to create new locations (name + description), edit existing, and delete
  - Add "Generate Image" button per location that calls the generate-image endpoint and displays the result with a "Regenerate" option
  - Show loading states during generation
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 14. Implement Script Page
  - Create `ScriptPage` component within the project layout
  - Add "Generate Script" button (enabled only when at least 1 character, 1 location, and style config exist)
  - Display generated script sections with: narrator text, dialogue lines (with character names), assigned location, music cue, SFX cue, and image layer descriptions
  - Allow inline editing of any script section field, saving changes via PUT endpoint
  - Add "Generate Audio" button that triggers audio generation for all sections, showing progress
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

- [x] 15. Implement Video Page
  - Create `VideoPage` component within the project layout
  - Add "Generate Video" button (enabled only when all script section assets are generated)
  - Show generation progress/loading state
  - Embed `@hyperframes/player` to render the generated HyperFrames HTML composition as a video preview
  - Display the video preview once composition is generated
  - _Requirements: 8.1, 8.7_

## Notes

- This is a hackathon project — no tests, no authentication, no alternative error flows
- Tasks are ordered for incremental buildability: data layer → services → API → frontend → video pipeline
- Each task references specific requirements for traceability
- The design document's Correctness Properties are documented for post-hackathon hardening but are not implemented as tests in this plan
- The video pipeline uses a multi-stage approach: direction planning → agentic composition → deterministic fallback
- AI Mode generates pre-production only (style, characters, locations, brief); script, audio, and video generation are triggered separately by the user
