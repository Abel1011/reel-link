import {
  Agent,
  OpenAIChatCompletionsModel,
  run,
  setTracingDisabled,
} from "@openai/agents";
import { AzureOpenAI } from "openai";
import { z } from "zod";
import { effectPresets } from "../data/effect-presets.js";
import { motionScenePresets } from "../data/scene-presets.js";
import { stylePresets } from "../data/style-presets.js";
import type {
  AssetManifest,
  Character,
  EffectPreset,
  Location,
  ScriptSection,
  StoryProject,
} from "../types.js";
import { withAiRetries } from "./ai-retry.js";
import { currentDebug, logAiCall, withStage } from "./debug-logger.js";
import { buildSameLanguageInstruction, inferProjectStoryLanguage } from "./story-language.js";

setTracingDisabled(true);

const DEFAULT_AZURE_API_VERSION = "2024-12-01-preview";
const VIDEO_DIRECTION_RUNTIME_MODE: "auto" | "agents" | "classic" = (() => {
  const runtime = (process.env.VIDEO_DIRECTION_RUNTIME_MODE ?? "auto").trim().toLowerCase();
  if (runtime === "agents" || runtime === "classic") return runtime;
  return "auto";
})();
const VIDEO_DIRECTION_AZURE_DEPLOYMENT = "gpt-5.4";
const VIDEO_DIRECTION_VERBOSITY: "low" | "medium" | "high" = "medium";
const PRESET_REVIEW_REASONING_EFFORT: "minimal" | "low" | "medium" | "high" | "xhigh" = "medium";
const SECTION_PLANNER_REASONING_EFFORT: "minimal" | "low" | "medium" | "high" | "xhigh" = "medium";
const CRITIQUE_REASONING_EFFORT: "minimal" | "low" | "medium" | "high" | "xhigh" = "medium";
const FINAL_DIRECTOR_REASONING_EFFORT: "minimal" | "low" | "medium" | "high" | "xhigh" = "medium";
const SECTION_PLANNER_CONCURRENCY = 2;
const MAX_GENERATED_IMAGES = Math.max(
  0,
  Number.parseInt(process.env.VIDEO_MAX_GENERATED_IMAGES ?? "6", 10) || 6,
);

const directedShotKindSchema = z.enum(["kenBurns", "dialogue", "heroPose"]);
const directedImageStrategySchema = z.enum([
  "reuse-background",
  "reuse-lead",
  "reuse-secondary",
  "generate",
]);

const shotPlanSchema = z.object({
  kind: directedShotKindSchema,
  emphasis: z.number().int().min(1).max(3),
  imageStrategy: directedImageStrategySchema,
  imagePrompt: z.string().nullable(),
  leftCharacterId: z.string().nullable(),
  rightCharacterId: z.string().nullable(),
  headline: z.string().nullable(),
  caption: z.string().nullable(),
  sfxLabel: z.string().nullable(),
  rationale: z.string().nullable(),
});

const sectionPlanSchema = z.object({
  sectionId: z.string(),
  shots: z.array(shotPlanSchema).min(1).max(4),
});

const videoPlanSchema = z.object({
  sections: z.array(sectionPlanSchema).min(1),
});

const presetReviewSchema = z.object({
  globalRules: z.array(z.string()).min(4).max(10),
  antiPatterns: z.array(z.string()).min(3).max(8),
  scenePresetGuidance: z.array(
    z.object({
      presetId: directedShotKindSchema,
      strongestUses: z.array(z.string()).min(2).max(5),
      avoidUses: z.array(z.string()).min(2).max(5),
      imageBias: z.string(),
      motionBias: z.string(),
    }),
  ).length(3),
  runtimeInspirationGuidance: z.array(
    z.object({
      inspirationId: z.string(),
      adaptInto: directedShotKindSchema,
      strongestUses: z.array(z.string()).min(1).max(4),
      borrowMotion: z.string(),
    }),
  ).min(4).max(12),
  effectGuidance: z.array(
    z.object({
      situationType: z.string(),
      recommendedPresetIds: z.array(z.string()).min(1).max(3),
      usageNote: z.string(),
    }),
  ).min(3).max(6),
});

const planCritiqueSchema = z.object({
  globalNotes: z.array(z.string()).max(8),
  issues: z.array(
    z.object({
      sectionId: z.string(),
      severity: z.enum(["high", "medium", "low"]),
      problem: z.string(),
      fix: z.string(),
    }),
  ).max(12),
});

type DirectedShotKind = z.infer<typeof directedShotKindSchema>;
type DirectedImageStrategy = z.infer<typeof directedImageStrategySchema>;
type RawAgentShotPlanOutput = z.infer<typeof shotPlanSchema>;
type RawAgentSectionPlanOutput = z.infer<typeof sectionPlanSchema>;
type RawAgentVideoPlanOutput = z.infer<typeof videoPlanSchema>;
type PresetReviewOutput = z.infer<typeof presetReviewSchema>;
type PlanCritiqueOutput = z.infer<typeof planCritiqueSchema>;

export interface AgentShotPlanOutput {
  kind: DirectedShotKind;
  emphasis: number;
  imageStrategy: DirectedImageStrategy;
  imagePrompt?: string;
  leftCharacterId?: string;
  rightCharacterId?: string;
  headline?: string;
  caption?: string;
  sfxLabel?: string;
  rationale?: string;
}

export interface AgentSectionPlanOutput {
  sectionId: string;
  shots: AgentShotPlanOutput[];
}

export interface AgentVideoPlanOutput {
  sections: AgentSectionPlanOutput[];
}

interface PlanningScenePreset {
  presetId: DirectedShotKind;
  role: string;
  bestFor: string[];
  avoidWhen: string[];
  motionLanguage: string;
}

interface PlanningEffectPresetGroup {
  situationType: EffectPreset["situationType"];
  bestUseCases: string[];
  presets: Array<{
    id: string;
    variant: number;
    description: string;
    exampleGsapCode: string;
  }>;
}

interface PlanningRuntimeSceneInspiration {
  id: string;
  title: string;
  description: string;
  useWhen: string;
}

interface PlanningSectionSummary {
  sectionId: string;
  sectionOrder: number;
  durationSeconds: number;
  location: {
    id: string;
    name: string;
    description: string;
    hasMatte: boolean;
  } | null;
  narratorText: string;
  narratorWindow: {
    startSeconds: number;
    durationSeconds: number;
    endSeconds: number;
  };
  soundEffectCue: string;
  musicCue: string;
  dialogue: Array<{
    lineId: string;
    lineOrder: number;
    characterId: string;
    characterName: string;
    text: string;
    startSeconds: number;
    durationSeconds: number;
    endSeconds: number;
  }>;
  imageLayers: Array<{
    layerType: string;
    description: string;
    hasImage: boolean;
  }>;
  speakingCharacters: Array<{
    id: string;
    name: string;
    description: string;
    hasPortrait: boolean;
  }>;
}

interface PlanningContext {
  project: {
    id: string;
    name: string;
    premise: string;
    tone: string;
    orientation: string;
    storyLanguage: string;
    narratorEnabled: boolean;
    subtitlesEnabled: boolean;
  };
  style: {
    presetName?: string;
    visualStyle: string;
    artisticMedium: string;
    colorPalette: string;
    lighting: string;
    mood: string;
    presetDescription?: string;
    swatches?: string[];
  };
  scenePresets: PlanningScenePreset[];
  runtimeSceneInspirations: PlanningRuntimeSceneInspiration[];
  effectPresets: PlanningEffectPresetGroup[];
  imageBudget: number;
  sections: PlanningSectionSummary[];
}

function normalizeText(text?: string): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function sentenceExcerpt(text: string, maxWords: number, maxChars = 160): string {
  const clean = normalizeText(text);
  if (!clean) return "";

  const words = clean.split(" ");
  let clipped = words.slice(0, maxWords).join(" ");
  if (words.length > maxWords) clipped += "...";
  if (clipped.length > maxChars) {
    clipped = `${clipped.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
  }

  return clipped;
}

function estimateDurationFromText(text: string | undefined): number {
  const clean = normalizeText(text);
  if (!clean) return 0;
  const wordCount = clean.split(/\s+/).length;
  return Math.max(0.7, wordCount / 2.8);
}

function sectionDuration(manifest: AssetManifest, section: ScriptSection, narratorEnabled: boolean): number {
  const narratorDuration = narratorEnabled ? manifest.durations[`narrator-${section.id}`] ?? 0 : 0;
  const dialogueDuration = section.dialogueLines.reduce(
    (total, line) => total + (manifest.durations[`dialogue-${line.id}`] ?? 0),
    0,
  );

  return Math.max(1.2, narratorDuration + dialogueDuration);
}

function buildScenePresetCatalog(): PlanningScenePreset[] {
  return [
    {
      presetId: "kenBurns",
      role: "Environmental framing and cinematic reveal preset",
      bestFor: [
        "establishing geography",
        "quiet discovery beats",
        "narrator-led exposition",
        "headline or caption support",
      ],
      avoidWhen: [
        "tight two-character exchanges",
        "rapid emotional reversals",
        "peak impact moments that need a stronger pose",
      ],
      motionLanguage: "slow push, drift, reveal, atmospheric framing",
    },
    {
      presetId: "dialogue",
      role: "Two-character conversational framing preset",
      bestFor: [
        "clean speaker exchanges",
        "back-and-forth persuasion",
        "argument or negotiation beats",
      ],
      avoidWhen: [
        "single-speaker sections",
        "environmental montage",
        "heroic payoff shots",
      ],
      motionLanguage: "alternating focus, conversational tension, readable eyelines",
    },
    {
      presetId: "heroPose",
      role: "Impact, reveal, fear, resolve, or triumph preset",
      bestFor: [
        "emotional pivots",
        "threat reveals",
        "defiant resolve",
        "final payoff moments",
      ],
      avoidWhen: [
        "flat exposition",
        "long stretches of calm narration",
        "ordinary coverage with no visual change",
      ],
      motionLanguage: "assertive framing, bold hold, dramatic emphasis",
    },
  ];
}

function bestUseCasesForSituationType(situationType: EffectPreset["situationType"]): string[] {
  switch (situationType) {
    case "speaking":
      return ["dialogue rhythm", "subtle vocal energy", "speaker liveliness"];
    case "scene-transition":
      return ["scene entry", "angle change", "section reset"];
    case "character-entrance":
      return ["arrival beat", "surprise reveal", "new focal subject"];
    case "character-exit":
      return ["departure beat", "handoff of focus", "escape movement"];
    case "emphasis":
      return ["impact accent", "shock beat", "dramatic punctuation"];
    case "idle":
      return ["held shot breathing", "ambient life", "gentle motion bed"];
    default:
      return ["general motion support"];
  }
}

function buildEffectPresetCatalog(): PlanningEffectPresetGroup[] {
  const groups = new Map<EffectPreset["situationType"], EffectPreset[]>();

  for (const preset of effectPresets) {
    const existing = groups.get(preset.situationType) ?? [];
    existing.push(preset);
    groups.set(preset.situationType, existing);
  }

  return Array.from(groups.entries()).map(([situationType, presets]) => ({
    situationType,
    bestUseCases: bestUseCasesForSituationType(situationType),
    presets: presets.map((preset) => ({
      id: preset.id,
      variant: preset.variant,
      description: preset.description,
      exampleGsapCode: preset.gsapCode,
    })),
  }));
}

function buildRuntimeSceneInspirationCatalog(): PlanningRuntimeSceneInspiration[] {
  return motionScenePresets.map((preset) => ({
    id: preset.id,
    title: preset.title,
    description: preset.description,
    useWhen: preset.useWhen,
  }));
}

function buildSectionSummary(
  project: StoryProject,
  section: ScriptSection,
  manifest: AssetManifest,
  charactersById: Map<string, Character>,
  locationsById: Map<string, Location>,
): PlanningSectionSummary {
  const narratorEnabled = project.brief?.narratorEnabled !== false;
  const location = section.locationId ? locationsById.get(section.locationId) : undefined;
  const narratorDuration = narratorEnabled
    ? manifest.durations[`narrator-${section.id}`] ?? estimateDurationFromText(section.narratorText)
    : 0;
  let dialogueCursor = narratorDuration;
  const uniqueSpeakingCharacters = new Map<string, Character>();

  for (const line of section.dialogueLines) {
    const character = charactersById.get(line.characterId);
    if (character) uniqueSpeakingCharacters.set(character.id, character);
  }

  return {
    sectionId: section.id,
    sectionOrder: section.sectionOrder,
    durationSeconds: sectionDuration(manifest, section, narratorEnabled),
    location: location
      ? {
          id: location.id,
          name: location.name,
          description: location.description,
          hasMatte: Boolean(location.imagePath),
        }
      : null,
    narratorText: normalizeText(section.narratorText),
    narratorWindow: {
      startSeconds: 0,
      durationSeconds: narratorDuration,
      endSeconds: narratorDuration,
    },
    soundEffectCue: normalizeText(section.soundEffectCue),
    musicCue: sentenceExcerpt(section.musicCue ?? "", 20, 140),
    dialogue: section.dialogueLines.map((line) => {
      const durationSeconds = manifest.durations[`dialogue-${line.id}`] ?? estimateDurationFromText(line.lineText);
      const startSeconds = dialogueCursor;
      const endSeconds = startSeconds + durationSeconds;
      dialogueCursor = endSeconds;

      return {
        lineId: line.id,
        lineOrder: line.lineOrder,
        characterId: line.characterId,
        characterName: charactersById.get(line.characterId)?.name ?? "Speaker",
        text: normalizeText(line.lineText),
        startSeconds,
        durationSeconds,
        endSeconds,
      };
    }),
    imageLayers: section.imageLayers.map((layer) => ({
      layerType: layer.layerType,
      description: sentenceExcerpt(layer.description ?? "", 20, 140),
      hasImage: Boolean(layer.imagePath),
    })),
    speakingCharacters: Array.from(uniqueSpeakingCharacters.values()).map((character) => ({
      id: character.id,
      name: character.name,
      description: sentenceExcerpt(character.description, 20, 140),
      hasPortrait: Boolean(character.portraitPath),
    })),
  };
}

function buildPlanningContext(project: StoryProject, manifest: AssetManifest): PlanningContext {
  const charactersById = new Map(project.characters.map((character) => [character.id, character] as const));
  const locationsById = new Map(project.locations.map((location) => [location.id, location] as const));
  const selectedStylePreset = stylePresets.find((preset) => preset.presetName === project.style?.presetName);
  const sections = project.script?.sections ?? [];

  return {
    project: {
      id: project.id,
      name: project.name,
      premise: project.brief?.premise ?? "",
      tone: project.brief?.tone ?? "unspecified",
      orientation: project.brief?.orientation ?? "landscape",
      storyLanguage: inferProjectStoryLanguage(project),
      narratorEnabled: project.brief?.narratorEnabled !== false,
      subtitlesEnabled: project.brief?.subtitlesEnabled !== false,
    },
    style: {
      presetName: project.style?.presetName,
      visualStyle: project.style?.visualStyle ?? "",
      artisticMedium: project.style?.artisticMedium ?? "",
      colorPalette: project.style?.colorPalette ?? "",
      lighting: project.style?.lighting ?? "",
      mood: project.style?.mood ?? "",
      presetDescription: selectedStylePreset?.description,
      swatches: selectedStylePreset?.swatches,
    },
    scenePresets: buildScenePresetCatalog(),
    runtimeSceneInspirations: buildRuntimeSceneInspirationCatalog(),
    effectPresets: buildEffectPresetCatalog(),
    imageBudget: MAX_GENERATED_IMAGES,
    sections: sections.map((section) =>
      buildSectionSummary(project, section, manifest, charactersById, locationsById),
    ),
  };
}

function compactSectionForPrompt(section: PlanningSectionSummary) {
  return {
    sectionId: section.sectionId,
    sectionOrder: section.sectionOrder,
    durationSeconds: Math.round(section.durationSeconds * 100) / 100,
    location: section.location
      ? {
          id: section.location.id,
          name: section.location.name,
          hasMatte: section.location.hasMatte,
        }
      : null,
    approvedNarratorText: section.narratorText,
    timingWindows: {
      narrator: {
        startSeconds: Math.round(section.narratorWindow.startSeconds * 100) / 100,
        durationSeconds: Math.round(section.narratorWindow.durationSeconds * 100) / 100,
        endSeconds: Math.round(section.narratorWindow.endSeconds * 100) / 100,
      },
      dialogue: section.dialogue.map((line) => ({
        lineId: line.lineId,
        lineOrder: line.lineOrder,
        characterId: line.characterId,
        characterName: line.characterName,
        startSeconds: Math.round(line.startSeconds * 100) / 100,
        durationSeconds: Math.round(line.durationSeconds * 100) / 100,
        endSeconds: Math.round(line.endSeconds * 100) / 100,
      })),
    },
    approvedDialogueLines: section.dialogue.map((line) => ({
      lineId: line.lineId,
      lineOrder: line.lineOrder,
      characterId: line.characterId,
      characterName: line.characterName,
      text: line.text,
    })),
    speakers: section.speakingCharacters.map((character) => ({
      id: character.id,
      name: character.name,
      hasPortrait: character.hasPortrait,
    })),
    imageCoverage: {
      layerTypes: section.imageLayers.map((layer) => layer.layerType),
      missingImageLayerTypes: section.imageLayers
        .filter((layer) => !layer.hasImage)
        .map((layer) => layer.layerType),
    },
  };
}

function compactProjectPromptContext(context: PlanningContext) {
  return {
    project: context.project,
    style: context.style,
    imageBudget: context.imageBudget,
    sections: context.sections.map((section) => compactSectionForPrompt(section)),
  };
}

function hasConfiguredValue(value?: string): boolean {
  const normalized = (value ?? "").trim();
  if (!normalized) return false;
  return !/(your_|changeme|replace-me|example\.com)/i.test(normalized);
}

function readAzurePlannerEnv() {
  return {
    endpoint: (process.env.VIDEO_DIRECTION_AZURE_ENDPOINT ?? process.env.AZURE_OPENAI_ENDPOINT)?.trim(),
    apiKey: (process.env.VIDEO_DIRECTION_AZURE_API_KEY ?? process.env.AZURE_OPENAI_API_KEY)?.trim(),
    apiVersion: (
      process.env.VIDEO_DIRECTION_AZURE_API_VERSION
      ?? process.env.OPENAI_API_VERSION
      ?? DEFAULT_AZURE_API_VERSION
    ).trim(),
    deployment: VIDEO_DIRECTION_AZURE_DEPLOYMENT,
  };
}

export function hasVideoDirectionAzureConfig(): boolean {
  const { endpoint, apiKey } = readAzurePlannerEnv();
  return hasConfiguredValue(endpoint) && hasConfiguredValue(apiKey);
}

function createAzurePlannerModel(): { model: OpenAIChatCompletionsModel; deployment: string } {
  const { endpoint, apiKey, apiVersion, deployment } = readAzurePlannerEnv();

  if (!hasConfiguredValue(endpoint)) {
    throw new Error("VIDEO_DIRECTION_AZURE_ENDPOINT or AZURE_OPENAI_ENDPOINT is required for the agents planner");
  }
  if (!hasConfiguredValue(apiKey)) {
    throw new Error("VIDEO_DIRECTION_AZURE_API_KEY or AZURE_OPENAI_API_KEY is required for the agents planner");
  }

  const client = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion,
    deployment,
  });

  return {
    model: new OpenAIChatCompletionsModel(client, deployment),
    deployment,
  };
}

function agentSettings(reasoningEffort: "minimal" | "low" | "medium" | "high" | "xhigh") {
  return {
    reasoning: {
      effort: reasoningEffort,
    },
    text: {
      verbosity: VIDEO_DIRECTION_VERBOSITY,
    },
  };
}

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>,
): Promise<TOutput[]> {
  if (items.length === 0) return [];

  const limit = Math.max(1, Math.min(concurrency, items.length));
  const results = new Array<TOutput>(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= items.length) return;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  };

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

const presetReviewInstructions = [
  "You are a senior animation director and motion systems designer.",
  "Before planning any cut, you review the actual preset catalogs and derive a playbook from the available runtime capabilities.",
  "You must reason from the provided supported shot kinds, wider runtime scene inspiration library, and effect preset catalog only.",
  "The runtime inspiration library is broader than the currently supported output kinds, so map good ideas back onto the valid output kinds instead of inventing unsupported shot kinds.",
  "Do not invent runtime presets that do not exist.",
  "Favor specific, usable guidance over generic style advice.",
].join(" ");

const sectionPlannerInstructions = [
  "You are a section-level cinematic planner for an animated short film.",
  "Plan one section only.",
  "The superior script agent already approved the narration and dialogue text. Treat that text as immutable source material.",
  "Do not rewrite, paraphrase, summarize, translate, shorten, or expand the approved narrator or dialogue text.",
  "headline, caption, and sfxLabel are reserved runtime fields. Return them as null so the renderer derives them from the approved section text.",
  "Use the provided timing windows to place visual beats in the correct spoken region instead of guessing where dialogue happens.",
  "Use only the output shot kinds kenBurns, dialogue, and heroPose.",
  "You may borrow motion language from the wider runtime scene inspiration library and GSAP effect examples, but do not emit unsupported kind values.",
  "Dialogue is allowed only when the section clearly has two distinct speaking characters.",
  "If narrator exposition happens before the dialogue block, use non-dialogue shots for that setup and reserve dialogue shots for the later speaking portion.",
  "Whenever a character is speaking in a shot, that speaker must stay visible or be the explicit focal character of the frame.",
  "Whenever spoken dialogue is heard in a shot, plan the beat so the runtime can keep an on-screen speech bubble visible.",
  "If a sustained environmental state defines the sequence, keep that environmental effect active through every affected shot until the story clearly resets it.",
  "When existing images are not enough for a beat, use imageStrategy generate and describe a stronger frame.",
  "When you describe a generated frame with characters, preserve their established identity, silhouette, face, costume, palette, and distinguishing traits from the provided character context.",
  "Most sections should have 2 to 4 shots when duration allows it.",
  "Ground every choice in the provided preset review and section context.",
].join(" ");

const critiqueInstructions = [
  "You are a hard-nosed final-cut critic.",
  "Treat the approved narration and dialogue text as immutable. Do not ask downstream stages to rewrite it.",
  "Audit the draft plan for repetitive preset use, weak cinematic judgment, lazy image reuse, invalid dialogue framing, missing speech-bubble planning on spoken beats, broken environmental continuity, and wasteful generate shots.",
  "Call out only concrete issues that materially improve the cut.",
].join(" ");

const finalDirectorInstructions = [
  "You are the final animation director for the cut.",
  "Produce the finished video plan, section by section, after considering the preset review, the draft plan, and the critique.",
  "The superior script agent already approved the narration and dialogue text. Treat that text as immutable source material.",
  "Do not rewrite, paraphrase, summarize, translate, shorten, or expand the approved narrator or dialogue text.",
  "headline, caption, and sfxLabel are reserved runtime fields. Return them as null so the renderer derives them from the approved section text.",
  "Preserve every sectionId and keep section order unchanged.",
  `Do not exceed ${MAX_GENERATED_IMAGES} total generate shots across the whole plan.`,
  "Keep dialogue shots inside the actual speaking portion when narrator exposition comes first.",
  "Whenever a character is speaking in a shot, that speaker must stay visible or be the explicit focal character of the frame.",
  "Whenever spoken dialogue is heard in a shot, the plan must preserve an on-screen speech bubble opportunity instead of presenting the beat like silent action.",
  "Keep sustained environmental states active across every affected shot until the story clearly resets them.",
  "Any generated character frame must preserve the established identity and design cues from the provided character context.",
  "Prefer bold variety, but keep the plan coherent and grounded in the actual runtime presets.",
].join(" ");

function buildPresetReviewPrompt(context: PlanningContext): string {
  return [
    "Review the runtime preset catalogs and derive the directing playbook for this project's final critical video stage.",
    "In runtimeInspirationGuidance, map broader runtime inspirations back onto the supported shot kinds instead of proposing unsupported output kinds.",
    "Return structured JSON only.",
    JSON.stringify(
      {
        project: context.project,
        style: context.style,
        scenePresets: context.scenePresets,
        effectPresets: context.effectPresets,
        sections: context.sections.map((section) => compactSectionForPrompt(section)),
      },
      null,
      2,
    ),
  ].join("\n\n");
}

function buildSectionPlannerPrompt(
  context: PlanningContext,
  review: PresetReviewOutput,
  section: PlanningSectionSummary,
): string {
  const neighboringSections = context.sections.filter(
    (candidate) => Math.abs(candidate.sectionOrder - section.sectionOrder) <= 1,
  );

  return [
    `Plan section ${section.sectionOrder} for the final cut.`,
    "Return a plan for this section only.",
    `Respect the shared generate-shot budget of ${context.imageBudget} across the full project.`,
    `Language rule: ${buildSameLanguageInstruction(context.project.storyLanguage, "rationale and any other non-visual explanatory output fields")}`,
    "Approved narration/dialogue text is immutable. Use it only as source material for shot design.",
    "Use the timingWindows block to keep dialogue shots inside the actual spoken region.",
    "Environmental rule: If the section or location is under a sustained environmental state, keep that effect active through every affected shot until the story clearly resets it.",
    "Project context:",
    JSON.stringify({ project: context.project, style: context.style }, null, 2),
    "Preset review:",
    JSON.stringify(review, null, 2),
    "Neighboring section context:",
    JSON.stringify(neighboringSections, null, 2),
    "Target section:",
    JSON.stringify(section, null, 2),
  ].join("\n\n");
}

function buildCritiquePrompt(
  context: PlanningContext,
  review: PresetReviewOutput,
  draftPlan: AgentVideoPlanOutput,
): string {
  const generateCount = draftPlan.sections.reduce(
    (total, section) => total + section.shots.filter((shot) => shot.imageStrategy === "generate").length,
    0,
  );

  return [
    "Audit this draft video plan.",
    `The draft currently uses ${generateCount} generate shots and the total budget is ${context.imageBudget}.`,
    `Language rule: ${buildSameLanguageInstruction(context.project.storyLanguage, "rationale and any other non-visual explanatory output fields")}`,
    "Project context:",
    JSON.stringify(compactProjectPromptContext(context), null, 2),
    "Preset review:",
    JSON.stringify(review, null, 2),
    "Draft plan:",
    JSON.stringify(draftPlan, null, 2),
  ].join("\n\n");
}

function buildFinalDirectorPrompt(
  context: PlanningContext,
  review: PresetReviewOutput,
  draftPlan: AgentVideoPlanOutput,
  critique: PlanCritiqueOutput,
): string {
  return [
    "Finalize the critical video direction plan.",
    `Keep the total number of generate shots at or under ${context.imageBudget}.`,
    `Language rule: ${buildSameLanguageInstruction(context.project.storyLanguage, "rationale and any other non-visual explanatory output fields")}`,
    "Approved narration/dialogue text is immutable. Use it only as source material for shot design.",
    "Use the timingWindows block to keep dialogue shots inside the actual spoken region.",
    "Environmental rule: If the section or location is under a sustained environmental state, keep that effect active through every affected shot until the story clearly resets it.",
    "Project context:",
    JSON.stringify(compactProjectPromptContext(context), null, 2),
    "Preset review:",
    JSON.stringify(review, null, 2),
    "Draft plan:",
    JSON.stringify(draftPlan, null, 2),
    "Critique:",
    JSON.stringify(critique, null, 2),
  ].join("\n\n");
}

function createAgents(model: OpenAIChatCompletionsModel) {
  return {
    presetReviewAgent: new Agent({
      name: "Preset Review Agent",
      instructions: presetReviewInstructions,
      model,
      modelSettings: agentSettings(PRESET_REVIEW_REASONING_EFFORT),
      outputType: presetReviewSchema,
    }),
    sectionPlannerAgent: new Agent({
      name: "Section Planner Agent",
      instructions: sectionPlannerInstructions,
      model,
      modelSettings: agentSettings(SECTION_PLANNER_REASONING_EFFORT),
      outputType: sectionPlanSchema,
    }),
    critiqueAgent: new Agent({
      name: "Plan Critique Agent",
      instructions: critiqueInstructions,
      model,
      modelSettings: agentSettings(CRITIQUE_REASONING_EFFORT),
      outputType: planCritiqueSchema,
    }),
    finalDirectorAgent: new Agent({
      name: "Final Director Agent",
      instructions: finalDirectorInstructions,
      model,
      modelSettings: agentSettings(FINAL_DIRECTOR_REASONING_EFFORT),
      outputType: videoPlanSchema,
    }),
  };
}

function sanitizeOptionalText(value: string | null | undefined): string | undefined {
  const normalized = normalizeText(value ?? undefined);
  return normalized || undefined;
}

function sanitizeAgentShot(shot: RawAgentShotPlanOutput): AgentShotPlanOutput {
  return {
    kind: shot.kind,
    emphasis: shot.emphasis,
    imageStrategy: shot.imageStrategy,
    imagePrompt: sanitizeOptionalText(shot.imagePrompt),
    leftCharacterId: sanitizeOptionalText(shot.leftCharacterId),
    rightCharacterId: sanitizeOptionalText(shot.rightCharacterId),
    headline: undefined,
    caption: undefined,
    sfxLabel: undefined,
    rationale: sanitizeOptionalText(shot.rationale),
  };
}

function sanitizeAgentSection(section: RawAgentSectionPlanOutput): AgentSectionPlanOutput {
  return {
    sectionId: section.sectionId,
    shots: section.shots.map((shot) => sanitizeAgentShot(shot)),
  };
}

function sanitizeAgentVideoPlan(plan: RawAgentVideoPlanOutput): AgentVideoPlanOutput {
  return {
    sections: plan.sections.map((section) => sanitizeAgentSection(section)),
  };
}

const STREAM_PROGRESS_INTERVAL_MS = 2000;
const STREAM_PROGRESS_MIN_CHARS = 240;
const STREAM_PROGRESS_PREVIEW_CHARS = 220;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object") return undefined;
  return value as Record<string, unknown>;
}

function truncateForLog(text: string, maxChars = STREAM_PROGRESS_PREVIEW_CHARS): string {
  const normalized = normalizeText(text);
  if (!normalized) return "";
  if (normalized.length <= maxChars) return normalized;
  return `...${normalized.slice(normalized.length - maxChars)}`;
}

function extractStreamTextDelta(event: unknown): string {
  const record = asRecord(event);
  if (!record || record.type !== "raw_model_stream_event") {
    return "";
  }

  const data = asRecord(record.data);
  const nestedEvent = asRecord(data?.event);
  const directDelta = typeof data?.delta === "string" ? data.delta : undefined;
  const nestedDelta = typeof nestedEvent?.delta === "string" ? nestedEvent.delta : undefined;

  const choices = Array.isArray(data?.choices) ? data.choices : [];
  const choiceText = choices
    .map((choice) => {
      const choiceRecord = asRecord(choice);
      const deltaRecord = asRecord(choiceRecord?.delta);
      return typeof deltaRecord?.content === "string" ? deltaRecord.content : "";
    })
    .join("");

  return directDelta ?? nestedDelta ?? choiceText;
}

function summarizeRunItem(item: unknown): Record<string, unknown> | undefined {
  const record = asRecord(item);
  if (!record) return undefined;

  const summary: Record<string, unknown> = {};
  for (const key of ["type", "id", "status", "name", "callId"]) {
    const value = record[key];
    if (typeof value === "string") {
      summary[key] = value;
    }
  }

  return Object.keys(summary).length > 0 ? summary : undefined;
}

function summarizeStreamEvent(event: unknown): { message: string; payload: Record<string, unknown> } | undefined {
  const record = asRecord(event);
  if (!record || typeof record.type !== "string") {
    return undefined;
  }

  if (record.type === "agent_updated_stream_event") {
    const agent = asRecord(record.agent);
    const agentName = typeof agent?.name === "string" ? agent.name : "unknown";
    return {
      message: `active agent -> ${agentName}`,
      payload: { event: "agent_updated", agentName },
    };
  }

  if (record.type === "run_item_stream_event") {
    const itemName = typeof record.name === "string" ? record.name : "unknown";
    const itemSummary = summarizeRunItem(record.item);
    return {
      message: `run item -> ${itemName}`,
      payload: { event: "run_item", itemName, ...(itemSummary ?? {}) },
    };
  }

  if (record.type === "raw_model_stream_event") {
    const data = asRecord(record.data);
    const nestedEvent = asRecord(data?.event);
    const rawType = typeof data?.type === "string"
      ? data.type
      : typeof nestedEvent?.type === "string"
        ? nestedEvent.type
        : undefined;

    if (rawType && /(done|completed|finished)$/i.test(rawType)) {
      return {
        message: `model event -> ${rawType}`,
        payload: { event: "raw_model_event", rawType },
      };
    }
  }

  return undefined;
}

function logStageProgress(
  projectId: string | undefined,
  stage: string,
  deployment: string,
  started: number,
  message: string,
  payload: Record<string, unknown>,
): void {
  if (!projectId) return;

  const response = JSON.stringify(payload);
  logAiCall({
    ts: new Date().toISOString(),
    projectId,
    stage,
    kind: "textFast",
    model: deployment,
    prompt: "",
    response,
    responseBytes: Buffer.byteLength(response, "utf-8"),
    elapsedMs: Date.now() - started,
  });

  console.log(`[${stage}] ${message}`);
}

async function runStructuredStage<T>(
  stage: string,
  deployment: string,
  systemPrompt: string,
  agent: Agent<any, any>,
  input: string,
): Promise<T> {
  const started = Date.now();
  const debug = currentDebug();

  try {
    const result = await withStage(stage, () =>
      withAiRetries(stage, async (attempt) => {
        logStageProgress(
          debug?.projectId,
          stage,
          deployment,
          started,
          `attempt ${attempt} started`,
          { event: "attempt_started", attempt },
        );

        const stream = await run(agent, input, { stream: true });
        let accumulatedText = "";
        let lastProgressChars = 0;
        let lastProgressAt = Date.now();

        try {
          for await (const event of stream) {
            const delta = extractStreamTextDelta(event);
            if (delta) {
              accumulatedText += delta;
              const now = Date.now();
              if (
                accumulatedText.length - lastProgressChars >= STREAM_PROGRESS_MIN_CHARS
                || now - lastProgressAt >= STREAM_PROGRESS_INTERVAL_MS
              ) {
                lastProgressChars = accumulatedText.length;
                lastProgressAt = now;
                logStageProgress(
                  debug?.projectId,
                  stage,
                  deployment,
                  started,
                  `model output ${accumulatedText.length} chars`,
                  {
                    event: "model_output_progress",
                    attempt,
                    chars: accumulatedText.length,
                    preview: truncateForLog(accumulatedText),
                  },
                );
              }
              continue;
            }

            const summary = summarizeStreamEvent(event);
            if (summary) {
              logStageProgress(
                debug?.projectId,
                stage,
                deployment,
                started,
                summary.message,
                { attempt, ...summary.payload },
              );
            }
          }

          await stream.completed;
        } catch (error) {
          logStageProgress(
            debug?.projectId,
            stage,
            deployment,
            started,
            `attempt ${attempt} error: ${(error as Error).message}`,
            {
              event: "attempt_error",
              attempt,
              error: (error as Error).message,
              chars: accumulatedText.length,
              preview: truncateForLog(accumulatedText),
            },
          );
          throw error;
        }

        if (typeof stream.finalOutput === "undefined") {
          throw new Error(`Agent stage ${stage} produced no final output`);
        }

        logStageProgress(
          debug?.projectId,
          stage,
          deployment,
          started,
          `attempt ${attempt} completed`,
          {
            event: "attempt_completed",
            attempt,
            chars: accumulatedText.length,
            cancelled: stream.cancelled === true,
          },
        );

        return stream;
      })
    );
    const finalOutput = result.finalOutput;

    const response = JSON.stringify(finalOutput);
    if (debug?.projectId) {
      logAiCall({
        ts: new Date().toISOString(),
        projectId: debug.projectId,
        stage,
        kind: "text",
        model: deployment,
        systemPrompt,
        prompt: input,
        response,
        responseBytes: Buffer.byteLength(response, "utf-8"),
        elapsedMs: Date.now() - started,
      });
    }

    return finalOutput as T;
  } catch (error) {
    if (debug?.projectId) {
      logAiCall({
        ts: new Date().toISOString(),
        projectId: debug.projectId,
        stage,
        kind: "text",
        model: deployment,
        systemPrompt,
        prompt: input,
        error: (error as Error).message,
        elapsedMs: Date.now() - started,
      });
    }

    throw error;
  }
}

function mergeWithDraftSections(
  context: PlanningContext,
  draftPlan: AgentVideoPlanOutput,
  finalPlan: AgentVideoPlanOutput,
): AgentVideoPlanOutput {
  const finalBySectionId = new Map(finalPlan.sections.map((section) => [section.sectionId, section] as const));
  const draftBySectionId = new Map(draftPlan.sections.map((section) => [section.sectionId, section] as const));

  return {
    sections: context.sections
      .map((section) => finalBySectionId.get(section.sectionId) ?? draftBySectionId.get(section.sectionId))
      .filter((section): section is AgentSectionPlanOutput => Boolean(section)),
  };
}

export function isVideoDirectionAgentsEnabled(): boolean {
  const runtime = VIDEO_DIRECTION_RUNTIME_MODE;

  if (runtime === "classic") {
    return false;
  }
  if (runtime === "agents") {
    return true;
  }

  return hasVideoDirectionAzureConfig();
}

export async function buildVideoDirectionPlanWithAgents(
  project: StoryProject,
  manifest: AssetManifest,
): Promise<AgentVideoPlanOutput> {
  const context = buildPlanningContext(project, manifest);
  const { model, deployment } = createAzurePlannerModel();
  const agents = createAgents(model);

  const presetReview = await runStructuredStage<PresetReviewOutput>(
    "video.agents.preset-review",
    deployment,
    presetReviewInstructions,
    agents.presetReviewAgent,
    buildPresetReviewPrompt(context),
  );

  const sectionPlans = await mapWithConcurrency(
    context.sections,
    SECTION_PLANNER_CONCURRENCY,
    async (section) => {
      const rawSectionPlan = await runStructuredStage<RawAgentSectionPlanOutput>(
        `video.agents.section.${section.sectionOrder}`,
        deployment,
        sectionPlannerInstructions,
        agents.sectionPlannerAgent,
        buildSectionPlannerPrompt(context, presetReview, section),
      );
      return sanitizeAgentSection(rawSectionPlan);
    },
  );

  const draftPlan: AgentVideoPlanOutput = { sections: sectionPlans };
  const critique = await runStructuredStage<PlanCritiqueOutput>(
    "video.agents.critique",
    deployment,
    critiqueInstructions,
    agents.critiqueAgent,
    buildCritiquePrompt(context, presetReview, draftPlan),
  );

  try {
    const rawFinalPlan = await runStructuredStage<RawAgentVideoPlanOutput>(
      "video.agents.finalize",
      deployment,
      finalDirectorInstructions,
      agents.finalDirectorAgent,
      buildFinalDirectorPrompt(context, presetReview, draftPlan, critique),
    );

    return mergeWithDraftSections(context, draftPlan, sanitizeAgentVideoPlan(rawFinalPlan));
  } catch (error) {
    console.warn(`[video] agents finalizer fallback: ${(error as Error).message}`);
    return draftPlan;
  }
}