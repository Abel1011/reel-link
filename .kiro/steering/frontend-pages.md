---
inclusion: fileMatch
fileMatchPattern: "client/src/pages/**"
---

# Frontend Pages Conventions

## Page Structure
- Each page is a React functional component exported as default
- Pages live in `client/src/pages/` — one per workflow step
- Pages within the project workflow are rendered inside `ProjectLayout` via React Router nested routes
- `AiModePage` is a standalone route at `/project/:id/ai-generate`

## Data Fetching
- Use `api.get<T>()`, `api.post<T>()`, `api.put<T>()`, `api.delete<T>()` from `client/src/lib/api.ts`
- Types are imported from `client/src/lib/types.ts`
- Fetch project data on mount, re-fetch after mutations
- Handle errors with try/catch and display via `ErrorToast`

## State Management
- Use React `useState` and `useEffect` — no external state library
- Use `useParams()` from React Router for project ID
- Use `useNavigate()` for programmatic navigation

## Loading & Error States
- Show `LoadingSpinner` during API calls and AI generation
- Disable action buttons while generation is in progress to prevent duplicate submissions
- Each generation step is independently retryable

## Page Inventory
| Page | Route | Purpose |
|------|-------|---------|
| `LandingPage` | `/` | Project list, create new project (AI/Manual mode) |
| `AiModePage` | `/project/:id/ai-generate` | Prompt input, progress polling, redirect on completion |
| `StylePage` | `/project/:id/style` | Style presets by genre, custom style editing |
| `CharactersPage` | `/project/:id/characters` | Character CRUD, portrait generation, voice design |
| `LocationsPage` | `/project/:id/locations` | Location CRUD, background image generation |
| `ScriptPage` | `/project/:id/script` | Script generation, section editing, audio generation |
| `VideoPage` | `/project/:id/video` | Video composition generation, HyperFrames preview |
