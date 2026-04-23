---
inclusion: fileMatch
fileMatchPattern: "server/src/routes/**"
---

# Backend Routes Conventions

## Route Structure
- Each route module exports a `Hono` instance (e.g., `const projectRoutes = new Hono()`)
- Routes are registered in `server/src/routes/index.ts` via `app.route(basePath, routeModule)`
- Use `c.req.param("id")` for URL parameters
- Use `c.req.json()` for request body parsing
- Return responses with `c.json(data)` or `c.json(data, statusCode)`

## Error Handling Pattern
```typescript
const project = getProject(projectId);
if (!project) return c.json({ error: "Project not found" }, 404);
```
- Return `404` for missing entities
- Return `400` for invalid input or missing prerequisites
- Return `500` for AI service failures (after retry exhaustion)
- Return `422` for content filter rejections

## AI Generation Routes
- Wrap the entire handler body with `runWithDebug({ projectId }, async () => ...)` for debug logging context
- Use `withStage("stage.name", () => ...)` for each AI call within the handler
- Use repositories to persist results immediately after each generation step
- Return the full updated project via `getProject(projectId)` at the end

## Route Modules
| Module | Base Path | Domain |
|--------|-----------|--------|
| `project-routes` | `/api/projects` | Project CRUD |
| `style-routes` | `/api` | Style presets + project style |
| `character-routes` | `/api/projects/:id/characters` | Character CRUD + portrait/voice generation |
| `location-routes` | `/api/projects/:id/locations` | Location CRUD + image generation |
| `script-routes` | `/api/projects` | Script generation + section editing |
| `audio-routes` | `/api/projects` | Audio generation (narrator, dialogue, music, SFX) |
| `video-routes` | `/api/projects` | Video direction + composition generation |
| `ai-mode-routes` | `/api/projects` | AI Mode pre-production pipeline + progress polling |
| `debug-routes` | `/api/debug` | Debug log retrieval |

## AI Mode Specifics
- Progress tracking via in-memory `Map<string, ProgressState>` with polling endpoint
- Idempotency guards: check `inflight` Set and existing content before starting generation
- Fallback voices array for when ElevenLabs voice design fails
