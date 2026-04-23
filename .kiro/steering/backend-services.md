---
inclusion: fileMatch
fileMatchPattern: "server/src/services/**"
---

# Backend Services Conventions

## AI Provider Calls
- Always wrap AI calls with `withAiRetries("operation label", async () => ...)` from `ai-retry.ts`
- Always wrap AI operations with `withStage("stage.name", () => ...)` from `debug-logger.ts` for per-project JSONL logging
- Use `textImageProvider` and `elevenLabsService` singletons from `providers.ts`
- Use `generateStructured<T>(prompt, schema, options)` with a `Schema` from `@google/genai` for typed JSON output
- Use `generateTextFast()` for lightweight tasks (style, locations), `generateText()` for deep reasoning (characters, scripts, briefs)
- Use `generateImage()` with `ImageSize` for aspect ratio control: `"1024x1024"` (portraits), `"1792x1024"` (landscapes), `"1024x1792"` (vertical)

## ElevenLabs
- Speech uses `eleven_v3` model with word-level timestamps
- `generateSpeech` accepts `SpeechGenerationOptions` with `previousText`/`nextText` for contextual flow
- `designVoice` creates custom voices from text descriptions — always provide fallback to preset voices on failure
- Music uses the compose endpoint, sound effects use `/v1/sound-generation`

## Asset Storage
- `saveImage(buffer, "png")` → returns relative path like `images/uuid.png`
- `saveAudio(buffer, "mp3")` → returns relative path like `audio/uuid.mp3`
- `saveHtml(htmlString)` → returns relative path like `compositions/uuid.html`
- Assets are served at `/assets/{relative_path}` by the Hono static middleware

## Creative Prompts (`creative-prompts.ts`)
- Centralized JSON schemas: `styleConfigSchema`, `characterPlanListSchema`, `locationPlanListSchema`, `storyBriefSchema`, `voicePromptSchema`
- Fallback prompt builders: `buildCharacterPortraitFallbackPrompt`, `buildCharacterVoiceFallbackPrompt`, `buildLocationImageFallbackPrompt`
- Style reference builders: `buildStyleReference` (for image prompts), `buildVoiceStyleReference` (for voice prompts)

## Story Language (`story-language.ts`)
- `inferStoryLanguageLabel(...samples)` — detects Spanish/English from text samples
- `inferProjectStoryLanguage(project)` — detects from project prompt and brief
- `buildSameLanguageInstruction(language, scope)` — builds instruction string for AI prompts

## Audio Duration (`audio-duration.ts`)
- `mp3DurationForAsset(relPath)` — returns duration in seconds for a stored MP3 asset
- Pure JS implementation, no native dependencies

## Video Pipeline
- `buildVideoDirection(project, manifest)` — generates shot-by-shot plan (uses Azure agents when configured, Gemini fallback)
- `buildAgenticHtmlComposition(project, manifest, size, options)` — Azure agents generate HyperFrames HTML
- `buildDeterministicComposition(project, manifest, size, options)` — code-driven fallback, always succeeds
