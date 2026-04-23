# Requirements Document

## Introduction

The Animated Story Creator is a hackathon project that enables users to create animated video stories powered by multiple AI services. The application provides two creation modes: an automatic AI mode that generates a complete story end-to-end (pre-production: style, characters, locations, brief), and a manual setup mode that gives users granular control over every aspect of the story — styles, characters, locations, script, and final video output. The app uses React with Tailwind CSS v4 for the frontend, Hono for the backend, SQLite for persistence, Gemini via Vertex AI (primary) and Azure OpenAI (secondary) for text/image generation, ElevenLabs for voice design/synthesis/music/sound effects, and HyperFrames for video composition and rendering. The video pipeline uses a multi-stage approach: AI-driven video direction planning followed by agentic HTML composition with a deterministic fallback.

## Glossary

- **App**: The Animated Story Creator web application consisting of a React frontend and a Hono backend
- **Story_Project**: A single story creation session containing all styles, characters, locations, script, brief, and generated assets
- **AI_Mode**: The automatic creation mode where the AI generates pre-production elements (style, characters with portraits and designed voices, locations with images, and a story brief) end-to-end from a single prompt
- **Manual_Mode**: The creation mode where the user defines and controls each story element individually
- **Story_Brief**: A structured summary of the story containing premise, tone, length preset, orientation, and toggles for subtitles and narrator — used to guide script and video generation
- **Style_Config**: A set of visual creative direction parameters including visual style, artistic medium, color palette, lighting, and mood
- **Character**: A named entity in the story with a description, AI-generated image prompt, generated portrait image, AI-generated voice prompt, and a custom-designed voice via ElevenLabs
- **Location**: A named place in the story with a description, AI-generated image prompt, and generated background image
- **Story_Script**: The complete structured script containing narrator text, character dialogue, location assignments, interactions, music cues, sound effects, and image composition instructions per section
- **Script_Section**: A single segment of the Story_Script representing one scene or beat, containing dialogue, narration, location, music, sound effects, and image layers
- **Image_Layer**: A single image element within a Script_Section, such as a background or character image, composited together for the video frame
- **Effect_Preset**: A predefined animation effect for a specific situation type (e.g., character speaking, scene transition) with multiple variants for variability
- **Scene_Preset**: A predefined scene composition template defining camera framing, character placement, and visual layout for different narrative situations
- **Video_Direction**: An AI-generated shot-by-shot plan for the video, specifying camera angles, scene presets, effect presets, and image generation strategies per section
- **Video_Composition**: The HyperFrames-based HTML video composition generated from the Story_Script and Video_Direction, combining all visual and audio assets with animation effects
- **Agentic_Composition**: The multi-agent Azure OpenAI pipeline that generates the HTML composition through playbook → blueprint → authoring → validation stages
- **Deterministic_Composition**: The fallback code-driven composition generator that produces HyperFrames HTML without AI, used when the agentic pipeline fails
- **Gemini_Service**: The Gemini model accessed through the Google GenAI SDK with API key authentication for text (pro and flash models) and image generation, including structured JSON output
- **Azure_OpenAI_Service**: Azure OpenAI accessed using API key authentication for text and image generation, and as the backbone for the multi-agent video direction and composition pipelines
- **ElevenLabs_Service**: The ElevenLabs API used for custom voice design, voice synthesis with word-level timestamps, music composition, and sound effect generation
- **HyperFrames_Engine**: The HyperFrames framework used for composing, previewing, and rendering HTML-based video
- **Video_Preview**: The in-browser preview of the Video_Composition rendered using @hyperframes/player
- **Database**: SQLite with WAL mode used for persisting Story_Projects and their assets
- **Debug_Logger**: An async-context-aware logging system that records all AI service calls (prompts, responses, timing) to per-project JSONL files for debugging

## Requirements

### Requirement 1: Story Project Management

**User Story:** As a user, I want to create and manage story projects, so that I can work on animated stories and return to them later.

#### Acceptance Criteria

1. WHEN the user opens the App, THE App SHALL display a landing page with options to create a new Story_Project or open an existing Story_Project
2. WHEN the user creates a new Story_Project, THE App SHALL prompt the user to choose between AI_Mode and Manual_Mode
3. WHEN a Story_Project is created, THE Database SHALL persist the Story_Project with a unique identifier, creation timestamp, selected mode, and optional Story_Brief fields (premise, tone, length preset, orientation, subtitles enabled, narrator enabled)
4. WHEN the user selects an existing Story_Project, THE App SHALL load all associated styles, characters, locations, Story_Script, Story_Brief, and generated assets

### Requirement 2: AI Mode — Automatic Pre-Production

**User Story:** As a user, I want the AI to automatically generate all pre-production elements from a single prompt, so that I can quickly set up a story without manual configuration.

#### Acceptance Criteria

1. WHEN the user selects AI_Mode and provides a story prompt, THE App SHALL generate a complete Style_Config, set of Characters (exactly 2), set of Locations (exactly 2), and a Story_Brief using the Gemini_Service with structured JSON output
2. WHEN AI_Mode generates Characters, THE App SHALL generate an AI-crafted image prompt per character, generate a portrait image using the Gemini_Service, and design a custom voice using the ElevenLabs_Service voice design API (with preset fallback voices if design fails)
3. WHEN AI_Mode generates Locations, THE App SHALL generate an AI-crafted image prompt per location and generate a background image using the Gemini_Service
4. WHEN AI_Mode is running, THE App SHALL expose a progress polling endpoint that reports the current step, total steps, and a creative label for each stage
5. WHEN AI_Mode completes pre-production, THE App SHALL present all generated elements to the user for review and editing, with the project ready for script generation
6. THE App SHALL enforce idempotency: duplicate AI_Mode requests for the same project SHALL be ignored if generation is in-flight or if pre-production content already exists

### Requirement 3: Style Configuration

**User Story:** As a user, I want to define the visual style of my story, so that all generated images and videos follow a consistent creative direction.

#### Acceptance Criteria

1. THE App SHALL provide a styles section where the user defines visual style, artistic medium, color palette, lighting, and mood for the Story_Project
2. THE App SHALL provide predefined Style_Configs organized by genre (Comic, Anime, Painterly, 3D, Retro, Minimal) that the user can select as a starting point, each including color swatches and a preview prompt
3. WHEN the user selects a predefined Style_Config, THE App SHALL populate all style fields with the predefined values
4. WHEN the user modifies any style field, THE App SHALL save the custom Style_Config to the Story_Project
5. WHEN generating images for Characters or Locations, THE Gemini_Service or Azure_OpenAI_Service SHALL incorporate the active Style_Config parameters into the image generation prompt

### Requirement 4: Character Definition and Asset Generation

**User Story:** As a user, I want to define characters with names and descriptions and have the AI generate their portraits and voices, so that my story has consistent visual and audio character representations.

#### Acceptance Criteria

1. THE App SHALL provide a characters section where the user can add, edit, and remove Characters from the Story_Project
2. WHEN the user defines a Character with a name and description, THE App SHALL store the Character in the Database along with optional AI-generated image prompt and voice prompt fields
3. WHEN the user requests image generation for a Character, THE Gemini_Service or Azure_OpenAI_Service SHALL generate a portrait image incorporating the Character's image prompt (or a fallback prompt built from description and style)
4. WHEN the user requests voice assignment for a Character, THE ElevenLabs_Service SHALL design a custom voice using the Character's voice prompt (or a fallback prompt), returning a voice ID, name, and audio preview
5. WHEN a Character portrait image is generated, THE App SHALL display the image and allow the user to regenerate the image

### Requirement 5: Location Definition and Asset Generation

**User Story:** As a user, I want to define story locations with names and descriptions and have the AI generate background images, so that my story has consistent visual settings.

#### Acceptance Criteria

1. THE App SHALL provide a locations section where the user can add, edit, and remove Locations from the Story_Project
2. WHEN the user defines a Location with a place name and description, THE App SHALL store the Location in the Database along with an optional AI-generated image prompt field
3. WHEN the user requests image generation for a Location, THE Gemini_Service or Azure_OpenAI_Service SHALL generate a background image incorporating the Location's image prompt (or a fallback prompt built from description and style), depicting only the environment without characters
4. WHEN a Location background image is generated, THE App SHALL display the image and allow the user to regenerate the image

### Requirement 6: Story Script Generation

**User Story:** As a user, I want the AI to generate a complete story script from my defined elements, so that I have a structured narrative ready for video production.

#### Acceptance Criteria

1. WHEN the user has defined at least one Character, one Location, and a Style_Config, THE App SHALL enable the story script generation action
2. WHEN the user triggers script generation, THE Gemini_Service or Azure_OpenAI_Service SHALL generate a Story_Script containing narrator text, character dialogue, location assignments, interaction descriptions, music cues, sound effect cues, and image composition instructions for each Script_Section, respecting the Story_Brief's language, tone, and length preset
3. WHEN a Story_Script is generated, THE App SHALL display each Script_Section with its narrator text, dialogue lines (with character names), assigned Location, music cue, sound effects, and Image_Layers
4. WHEN the user edits any field within a Script_Section, THE App SHALL save the modification to the Database
5. WHEN a Script_Section specifies multiple Image_Layers, THE Story_Script SHALL define the layering order and positioning of each image element (background, character images)

### Requirement 7: Audio Asset Generation via ElevenLabs

**User Story:** As a user, I want the AI to generate voice narration, character dialogue audio, background music, and sound effects, so that my animated story has a complete audio experience.

#### Acceptance Criteria

1. WHEN a Story_Script contains narrator text for a Script_Section and the narrator is enabled in the Story_Brief, THE ElevenLabs_Service SHALL generate voice audio for the narrator using a designated narrator voice
2. WHEN a Story_Script contains dialogue for a Character in a Script_Section, THE ElevenLabs_Service SHALL generate voice audio using the custom-designed voice assigned to that Character, with contextual previous/next text for natural flow
3. WHEN a Story_Script specifies a music cue for a Script_Section, THE ElevenLabs_Service SHALL generate background music matching the cue description
4. WHEN a Story_Script specifies a sound effect cue for a Script_Section, THE ElevenLabs_Service SHALL generate a sound effect matching the cue description
5. WHEN voice audio is generated with word-level timestamp data, THE App SHALL store the timestamps alongside the audio asset for use in driving animation effects and subtitle synchronization

### Requirement 8: Video Composition Generation

**User Story:** As a user, I want the AI to generate an animated video from my story script and assets, so that I can preview and export a complete animated story.

#### Acceptance Criteria

1. WHEN all audio and image assets for a Story_Script are generated, THE App SHALL enable the video composition generation action
2. WHEN the user triggers video composition generation, THE App SHALL first generate a Video_Direction plan using AI (shot-by-shot planning with scene presets, effect presets, and camera directions), then generate HyperFrames-compatible HTML composition code via the Agentic_Composition pipeline
3. WHEN the Agentic_Composition pipeline fails, THE App SHALL fall back to the Deterministic_Composition generator to produce the HTML
4. WHEN audio timestamps are available, THE Video_Composition SHALL synchronize animation effects, subtitle captions, and visual transitions to the audio timestamps
5. THE App SHALL support configurable video orientation (landscape, portrait, square) based on the Story_Brief
6. WHEN subtitles are enabled in the Story_Brief, THE Video_Composition SHALL include synchronized caption overlays derived from word-level timestamps
7. WHEN a Video_Composition is generated, THE App SHALL render a Video_Preview using the @hyperframes/player component within the application UI

### Requirement 9: Predefined Animation and Scene Presets

**User Story:** As a user, I want the video to use varied and expressive animation effects and scene compositions, so that the animated story feels dynamic and engaging.

#### Acceptance Criteria

1. THE App SHALL include predefined Effect_Presets for at least the following situation types: character speaking, scene transition, character entrance, character exit, emphasis moment, and idle state
2. THE App SHALL provide at least two Effect_Preset variants per situation type to enable variability across Script_Sections
3. THE App SHALL include predefined Scene_Presets defining camera framing and character placement templates for different narrative situations
4. WHEN the AI generates Video_Direction, THE AI SHALL select appropriate Effect_Presets and Scene_Presets from the predefined catalogs based on the Script_Section context
5. THE Effect_Presets SHALL use GSAP-compatible animation definitions compatible with the HyperFrames_Engine

### Requirement 10: Backend API and AI Service Integration

**User Story:** As a user, I want the backend to securely manage AI service calls and data persistence, so that the application functions reliably.

#### Acceptance Criteria

1. THE Hono backend SHALL expose RESTful API endpoints for all Story_Project operations (create, read, update) and all AI generation actions, organized into modular route files (project, style, character, location, script, audio, video, ai-mode, debug)
2. THE Hono backend SHALL authenticate with the Gemini_Service using a Google GenAI API key stored in server-side environment variables, supporting configurable model names for text (pro/flash) and image generation
3. THE Hono backend SHALL authenticate with the Azure_OpenAI_Service using an Azure API key stored in server-side environment variables, used for the multi-agent video direction and composition pipelines
4. THE Hono backend SHALL authenticate with the ElevenLabs_Service using an ElevenLabs API key stored in server-side environment variables
5. THE Hono backend SHALL store all generated assets (images, audio files, HTML compositions) in the local filesystem and reference them in the Database
6. THE Database SHALL use SQLite with WAL mode as the storage engine for Story_Projects and all associated metadata
7. THE Hono backend SHALL implement automatic retry logic with configurable attempts and exponential backoff for all AI service calls, with non-retryable error detection (auth failures, invalid keys)
8. THE Hono backend SHALL implement a Debug_Logger that records all AI service calls (text, image, speech, music, sound effects, voice design) with prompts, responses, timing, and errors to per-project JSONL log files using async local storage for context propagation
9. THE Hono backend SHALL detect the story language from the user's prompt (Spanish/English detection with fallback) and instruct AI services to generate content in the same language

### Requirement 11: User Interface Design

**User Story:** As a user, I want a visually unique and expressive interface, so that the app feels creative and engaging to use.

#### Acceptance Criteria

1. THE App SHALL use a custom color palette defined in Tailwind CSS v4 that avoids standard indigo or blue gradient schemes
2. THE App SHALL use distinctive typography that avoids common fonts such as Poppins and Inter
3. THE App SHALL use icon components (lucide-react) instead of emoji characters for all UI indicators and actions
4. THE App SHALL include CSS animations and motion effects on interactive elements to create an expressive, alive-feeling interface
5. THE App SHALL present the creation workflow as a clear step-by-step flow: Style → Characters → Locations → Script → Video
