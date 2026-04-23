import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { Type, type Schema } from "@google/genai";
import type {
  AssetManifest,
  Character,
  GenerateImageOptions,
  ImageSize,
  Location,
  ScriptSection,
  StoryProject,
} from "../types.js";
import { getAssetsDir, saveImage } from "./asset-storage.js";
import { withStage } from "./debug-logger.js";
import { createTextImageProvider } from "./providers.js";
import {
  buildVideoDirectionPlanWithAgents,
  hasVideoDirectionAzureConfig,
  isVideoDirectionAgentsEnabled,
} from "./video-direction-agents.js";
import { buildSameLanguageInstruction, inferProjectStoryLanguage } from "./story-language.js";

export type DirectedShotKind = "kenBurns" | "dialogue" | "heroPose";
export type DirectedImageStrategy =
  | "reuse-background"
  | "reuse-lead"
  | "reuse-secondary"
  | "generate";

export interface DirectedShot {
  id: string;
  kind: DirectedShotKind;
  emphasis: number;
  imageStrategy: DirectedImageStrategy;
  imagePath?: string;
  imagePrompt?: string;
  leftCharacterId?: string;
  rightCharacterId?: string;
  headline?: string;
  caption?: string;
  sfxLabel?: string;
  rationale?: string;
}

export type DirectedVideoPlan = Record<string, DirectedShot[]>;

interface ShotPlanOutput {
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

interface SectionPlanOutput {
  sectionId: string;
  shots: ShotPlanOutput[];
}

interface VideoPlanOutput {
  sections: SectionPlanOutput[];
}

const shotPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    kind: {
      type: Type.STRING,
      format: "enum",
      enum: ["kenBurns", "dialogue", "heroPose"],
    },
    emphasis: { type: Type.INTEGER, minimum: 1, maximum: 3 },
    imageStrategy: {
      type: Type.STRING,
      format: "enum",
      enum: ["reuse-background", "reuse-lead", "reuse-secondary", "generate"],
    },
    imagePrompt: { type: Type.STRING, nullable: true },
    leftCharacterId: { type: Type.STRING, nullable: true },
    rightCharacterId: { type: Type.STRING, nullable: true },
    headline: { type: Type.STRING, nullable: true },
    caption: { type: Type.STRING, nullable: true },
    sfxLabel: { type: Type.STRING, nullable: true },
    rationale: { type: Type.STRING, nullable: true },
  },
  required: ["kind", "emphasis", "imageStrategy", "imagePrompt", "leftCharacterId", "rightCharacterId", "headline", "caption", "sfxLabel", "rationale"],
  propertyOrdering: ["kind", "emphasis", "imageStrategy", "imagePrompt", "leftCharacterId", "rightCharacterId", "headline", "caption", "sfxLabel", "rationale"],
};

const sectionPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sectionId: { type: Type.STRING },
    shots: { type: Type.ARRAY, items: shotPlanSchema, minItems: "1" },
  },
  required: ["sectionId", "shots"],
  propertyOrdering: ["sectionId", "shots"],
};

const videoPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sections: { type: Type.ARRAY, items: sectionPlanSchema, minItems: "1" },
  },
  required: ["sections"],
  propertyOrdering: ["sections"],
};

const MAX_GENERATED_IMAGES = Math.max(
  0,
  Number.parseInt(process.env.VIDEO_MAX_GENERATED_IMAGES ?? "6", 10) || 6,
);
const VIDEO_DIRECTION_MODEL =
  (process.env.VIDEO_DIRECTION_MODEL ?? "pro").trim().toLowerCase() === "flash"
    ? "flash"
    : "pro";

function resolveVideoDirectionProviderOverride(): string | undefined {
  const explicitProvider = process.env.VIDEO_DIRECTION_PROVIDER?.trim();
  if (explicitProvider) return explicitProvider;
  if (isVideoDirectionAgentsEnabled() && hasVideoDirectionAzureConfig()) return "azure";
  return undefined;
}

const videoDirectionTextProvider = createTextImageProvider(resolveVideoDirectionProviderOverride());
const videoDirectionImageProvider = createTextImageProvider("gemini");

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

function orientationToImageSize(orientation?: string): ImageSize {
  if (orientation === "portrait") return "1024x1792";
  if (orientation === "square") return "1024x1024";
  return "1792x1024";
}

function pickGeneratedShotImageSize(
  projectOrientation: string | undefined,
  shot: Pick<ShotPlanOutput, "kind" | "leftCharacterId" | "rightCharacterId">,
): ImageSize {
  const hasLeftCharacter = Boolean(shot.leftCharacterId);
  const hasRightCharacter = Boolean(shot.rightCharacterId);
  const hasMultipleCharacters = hasLeftCharacter && hasRightCharacter;
  const hasAnyCharacter = hasLeftCharacter || hasRightCharacter;

  if (shot.kind === "dialogue") return "1792x1024";
  if (!hasAnyCharacter) return "1792x1024";
  if (hasMultipleCharacters) return "1792x1024";
  if (shot.kind === "heroPose") return "1024x1024";
  return projectOrientation === "square" ? "1024x1024" : orientationToImageSize(projectOrientation);
}

function buildShotFrameGuidance(imageSize: ImageSize): string {
  if (imageSize === "1024x1024") {
    return "Frame format: square 1:1 character-focused composition.";
  }
  if (imageSize === "1024x1792") {
    return "Frame format: tall portrait composition.";
  }
  return "Frame format: wide horizontal landscape composition.";
}

function sectionDuration(manifest: AssetManifest, section: ScriptSection, narratorEnabled: boolean): number {
  const narratorDuration = narratorEnabled ? manifest.durations[`narrator-${section.id}`] ?? 0 : 0;
  const dialogueDuration = section.dialogueLines.reduce(
    (total, line) => total + (manifest.durations[`dialogue-${line.id}`] ?? 0),
    0,
  );
  return Math.max(1.2, narratorDuration + dialogueDuration);
}

function sectionSummary(
  project: StoryProject,
  section: ScriptSection,
  manifest: AssetManifest,
  charactersById: Map<string, Character>,
  locationsById: Map<string, Location>,
): Record<string, unknown> {
  const location = section.locationId ? locationsById.get(section.locationId) : undefined;
  const narratorDuration = project.brief?.narratorEnabled !== false
    ? manifest.durations[`narrator-${section.id}`] ?? estimateDurationFromText(section.narratorText)
    : 0;
  let dialogueCursor = narratorDuration;
  const speakingCharacters = section.dialogueLines
    .map((line) => charactersById.get(line.characterId))
    .filter((character): character is Character => Boolean(character));

  return {
    sectionId: section.id,
    sectionOrder: section.sectionOrder,
    durationSeconds: sectionDuration(manifest, section, project.brief?.narratorEnabled !== false),
    location: location
      ? {
          id: location.id,
          name: location.name,
          description: location.description,
          hasMatte: Boolean(location.imagePath),
        }
      : null,
    approvedNarratorText: normalizeText(section.narratorText),
    timingWindows: {
      narrator: {
        startSeconds: 0,
        durationSeconds: narratorDuration,
        endSeconds: narratorDuration,
      },
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
          startSeconds,
          durationSeconds,
          endSeconds,
        };
      }),
    },
    soundEffectCue: normalizeText(section.soundEffectCue),
    musicCue: sentenceExcerpt(section.musicCue ?? "", 20, 140),
    approvedDialogueLines: section.dialogueLines.map((line) => ({
      lineId: line.id,
      lineOrder: line.lineOrder,
      characterId: line.characterId,
      characterName: charactersById.get(line.characterId)?.name ?? "Speaker",
      text: normalizeText(line.lineText),
    })),
    imageLayers: section.imageLayers.map((layer) => ({
      layerType: layer.layerType,
      description: sentenceExcerpt(layer.description ?? "", 20, 140),
      hasImage: Boolean(layer.imagePath),
    })),
    speakingCharacters: speakingCharacters.map((character) => ({
      id: character.id,
      name: character.name,
      description: sentenceExcerpt(character.description, 20, 140),
      hasPortrait: Boolean(character.portraitPath),
    })),
  };
}

function plannerPrompt(project: StoryProject, manifest: AssetManifest): string {
  const charactersById = new Map(project.characters.map((character) => [character.id, character] as const));
  const locationsById = new Map(project.locations.map((location) => [location.id, location] as const));
  const sections = project.script?.sections ?? [];
  const storyLanguage = inferProjectStoryLanguage(project);
  const languageRule = buildSameLanguageInstruction(
    storyLanguage,
    "rationale and any other non-visual explanatory output fields",
  );

  const sectionJson = sections
    .map((section) => JSON.stringify(sectionSummary(project, section, manifest, charactersById, locationsById), null, 2))
    .join("\n\n");

  return `Design a multi-shot video direction plan for the final animation cut.

Project title: ${project.name}
Premise: ${project.brief?.premise ?? ""}
Tone: ${project.brief?.tone ?? "unspecified"}
Orientation: ${project.brief?.orientation ?? "landscape"}
Story language: ${storyLanguage}

Style bible:
- Visual style: ${project.style?.visualStyle ?? ""}
- Artistic medium: ${project.style?.artisticMedium ?? ""}
- Palette: ${project.style?.colorPalette ?? ""}
- Lighting: ${project.style?.lighting ?? ""}
- Mood: ${project.style?.mood ?? ""}

Your job:
- The superior script agent already approved the narration and dialogue text. Treat that text as immutable source material.
- Do not rewrite, paraphrase, summarize, translate, shorten, or expand the approved narrator or dialogue text.
- Use the provided timingWindows block to place visual beats in the correct spoken region instead of guessing where dialogue happens.
- Break every section into 2 to 4 shots whenever the section duration allows it.
- Do not keep a whole section on a single preset unless it is extremely short.
- If a section starts with narrator exposition before the dialogue block, reserve non-dialogue shots for that narrator setup and place dialogue shots only in the later speaking portion.
- Whenever a character is speaking in a shot, that speaker must stay visible or be the explicit visual focus of the frame.
- Whenever spoken dialogue is heard in a shot, plan the beat so the runtime can keep an on-screen speech bubble visible. Do not design speech beats as silent-looking clean plates.
- If a location or sequence is under a sustained environmental state such as storm, rain, snow, fog, dust, or fire, keep those environmental effects active across every affected shot until the story clearly resets the condition.
- Vary presets with intent: use kenBurns for environment or reveal beats, dialogue for exchanges, heroPose for impact or payoff moments.
- Every non-dialogue character-focused shot must name its focal character in leftCharacterId. Leave rightCharacterId null unless a second character is intentionally visible in frame.
- Treat reuse-lead and reuse-secondary as semantic subject choices tied to the named character IDs, not as arbitrary layer order.
- Use imageStrategy "generate" when a shot needs a new angle, a close-up, a detail insert, a reveal, a reaction, or a stronger cinematic beat than the existing section assets can provide.
- If you use "generate", provide an imagePrompt that describes a single cinematic frame in the same art direction.
- Prefer reusing existing assets only when they are genuinely enough.
- headline, caption, and sfxLabel are reserved runtime fields. Return them as null so the renderer derives them from the approved section text.
- ${languageRule}

Return one entry per section, preserving the same sectionId.

Sections:
${sectionJson}`;
}

function plannerSystemPrompt(storyLanguage: string): string {
  const languageRule = buildSameLanguageInstruction(
    storyLanguage,
    "rationale and any other non-visual explanatory output fields",
  );

  return `You are a senior animation director planning a final cut.

Return valid JSON only.

Rules:
- Each section must have at least 1 shot.
- Most sections should have 2 to 4 shots.
- The superior script agent already approved the narration and dialogue text. Treat that text as immutable source material.
- Do not rewrite, paraphrase, summarize, translate, shorten, or expand the approved narrator or dialogue text.
- Use the provided timingWindows block to keep dialogue shots inside the actual spoken region.
- If narrator exposition happens before dialogue in a section, keep dialogue shots inside the later speaking portion rather than the narrator setup.
- If any character is speaking during a shot, that speaker must be visible or be the explicit focal character for that shot.
- When spoken dialogue is heard in a shot, the plan must preserve an on-screen speech bubble opportunity instead of presenting the beat like silent action.
- If a sustained environmental state such as storm, rain, snow, fog, dust, or fire defines the scene or location, keep those effects active across every affected shot until the story clearly resets them.
- Avoid using the same preset for every shot in a section unless the section is under 4 seconds or entirely a clean two-character exchange.
- dialogue shots must use character IDs that are actually speaking in that section when possible.
- Non-dialogue shots that center a character must set leftCharacterId to that focal character, even when reusing an existing asset.
- reuse-lead and reuse-secondary must match the semantic subject identified by leftCharacterId or rightCharacterId, never random layer order.
- heroPose shots should be reserved for impact, reveal, fear, triumph, or emotional pivot beats.
- headline, caption, and sfxLabel are reserved runtime fields and must be null.
- Generated character shots must preserve the established identity, silhouette, facial cues, costume, and palette of the referenced characters.
- ${languageRule}
- imagePrompt must describe only the visual frame, never on-screen text or subtitles.`;
}

function mimeTypeForImagePath(imagePath: string): string {
  switch (extname(imagePath).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "image/png";
  }
}

function buildShotImageReferences(
  section: ScriptSection,
  shot: DirectedShot,
  charactersById: Map<string, Character>,
): GenerateImageOptions | undefined {
  const shotCharacterIds = Array.from(
    new Set([shot.leftCharacterId, shot.rightCharacterId].filter((characterId): characterId is string => Boolean(characterId))),
  );
  const fallbackSpeakerIds = Array.from(
    new Set(section.dialogueLines.map((line) => line.characterId).filter((characterId): characterId is string => Boolean(characterId))),
  );
  const orderedCharacterIds = (shotCharacterIds.length > 0 ? shotCharacterIds : fallbackSpeakerIds).slice(0, 2);

  const references = orderedCharacterIds.flatMap((characterId) => {
    const character = charactersById.get(characterId);
    if (!character?.portraitPath) return [];

    try {
      return [{
        label: character.name,
        mimeType: mimeTypeForImagePath(character.portraitPath),
        data: readFileSync(resolve(getAssetsDir(), character.portraitPath)),
      }];
    } catch {
      return [];
    }
  });

  return references.length > 0 ? { references } : undefined;
}

function sanitizeKind(value: string | undefined): DirectedShotKind {
  if (value === "dialogue" || value === "heroPose") return value;
  return "kenBurns";
}

function sanitizeImageStrategy(value: string | undefined): DirectedImageStrategy {
  if (
    value === "reuse-background" ||
    value === "reuse-lead" ||
    value === "reuse-secondary" ||
    value === "generate"
  ) {
    return value;
  }
  return "reuse-background";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function inferShotFocusCharacterId(
  shot: ShotPlanOutput,
  section: ScriptSection | undefined,
  characters: Character[],
  validCharacterIds: Set<string>,
): string | undefined {
  if (shot.leftCharacterId && validCharacterIds.has(shot.leftCharacterId)) {
    return shot.leftCharacterId;
  }

  const sceneText = normalizeText(
    [
      shot.rationale,
      shot.imagePrompt,
      section?.narratorText,
      ...(section?.dialogueLines.map((line) => line.lineText) ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  ).toLowerCase();

  if (!sceneText) return undefined;

  let bestMatch: { id: string; score: number } | undefined;
  let secondBestScore = 0;

  for (const character of characters) {
    if (!validCharacterIds.has(character.id)) continue;

    const normalizedName = normalizeText(character.name).toLowerCase();
    const aliases = Array.from(new Set([
      normalizedName,
      ...normalizedName.split(/\s+/).filter((token) => token.length > 2),
    ]));

    const score = aliases.reduce((total, alias) => {
      if (!alias) return total;
      const matcher = new RegExp(`(^|\\W)${escapeRegExp(alias)}(?=$|\\W)`, "g");
      const matches = sceneText.match(matcher);
      return total + (matches?.length ?? 0) * Math.max(alias.length, 3);
    }, 0);

    if (score <= 0) continue;

    if (!bestMatch || score > bestMatch.score) {
      secondBestScore = bestMatch?.score ?? 0;
      bestMatch = { id: character.id, score };
      continue;
    }

    if (score > secondBestScore) secondBestScore = score;
  }

  if (!bestMatch) return undefined;
  if (secondBestScore > 0 && bestMatch.score === secondBestScore) return undefined;
  return bestMatch.id;
}

function buildShotImagePrompt(
  project: StoryProject,
  section: ScriptSection,
  shot: ShotPlanOutput,
  imageSize: ImageSize,
  charactersById: Map<string, Character>,
  locationsById: Map<string, Location>,
): string {
  const location = section.locationId ? locationsById.get(section.locationId) : undefined;
  const characterIds = [shot.leftCharacterId, shot.rightCharacterId]
    .filter((id): id is string => Boolean(id));
  const charactersInFrame = characterIds
    .map((id) => charactersById.get(id))
    .filter((character): character is Character => Boolean(character));
  const characterLines = charactersInFrame
    .map((character) => `${character.name}: ${character.description}${character.portraitPath ? " [reference portrait attached]" : ""}`);
  const hasReferencePortrait = charactersInFrame.some((character) => Boolean(character.portraitPath));

  return [
    "Create a single cinematic storyboard frame for an animated short film.",
    `Project: ${project.name}`,
    project.brief?.premise ? `Premise: ${project.brief.premise}` : "",
    project.brief?.tone ? `Tone: ${project.brief.tone}` : "",
    project.style?.visualStyle ? `Visual style: ${project.style.visualStyle}` : "",
    project.style?.artisticMedium ? `Artistic medium: ${project.style.artisticMedium}` : "",
    project.style?.colorPalette ? `Color palette: ${project.style.colorPalette}` : "",
    project.style?.lighting ? `Lighting: ${project.style.lighting}` : "",
    project.style?.mood ? `Mood: ${project.style.mood}` : "",
    location ? `Location: ${location.name}. ${location.description}` : "",
    characterLines.length > 0 ? `Characters in frame: ${characterLines.join(" | ")}` : "",
    hasReferencePortrait
      ? "Reference portraits are attached for the listed characters. Match their established identity, face, silhouette, palette, wardrobe, and distinguishing visual features."
      : "",
    section.narratorText ? `Narration beat: ${sentenceExcerpt(section.narratorText, 36, 220)}` : "",
    section.dialogueLines.length > 0
      ? `Dialogue beat: ${sentenceExcerpt(section.dialogueLines.map((line) => line.lineText).join(" "), 28, 180)}`
      : "",
    shot.imagePrompt ? `Requested shot: ${shot.imagePrompt}` : "",
    buildShotFrameGuidance(imageSize),
    "No subtitles, no logos, no text overlays, no watermarks.",
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizePlan(
  project: StoryProject,
  raw: VideoPlanOutput,
): DirectedVideoPlan {
  const validSectionIds = new Set(project.script?.sections.map((section) => section.id) ?? []);
  const validCharacterIds = new Set(project.characters.map((character) => character.id));
  const sectionsById = new Map(project.script?.sections.map((section) => [section.id, section] as const) ?? []);
  const normalized: DirectedVideoPlan = {};

  for (const entry of raw.sections ?? []) {
    if (!validSectionIds.has(entry.sectionId)) continue;
    const section = sectionsById.get(entry.sectionId);
    const sectionSpeakerIds = Array.from(
      new Set(
        section?.dialogueLines
          .map((line) => line.characterId)
          .filter((characterId): characterId is string => validCharacterIds.has(characterId)) ?? [],
      ),
    );
    const shots = (entry.shots ?? [])
      .slice(0, 4)
      .map((shot, index) => {
        let leftCharacterId = shot.leftCharacterId && validCharacterIds.has(shot.leftCharacterId)
          ? shot.leftCharacterId
          : undefined;
        let rightCharacterId = shot.rightCharacterId && validCharacterIds.has(shot.rightCharacterId)
          ? shot.rightCharacterId
          : undefined;
        let kind = sanitizeKind(shot.kind);
        let imageStrategy = sanitizeImageStrategy(shot.imageStrategy);

        const distinctShotSpeakers = Array.from(
          new Set([leftCharacterId, rightCharacterId].filter((characterId): characterId is string => Boolean(characterId))),
        );

        if (kind === "dialogue" && (sectionSpeakerIds.length < 2 || distinctShotSpeakers.length < 2)) {
          kind = sectionSpeakerIds.length > 0 ? "heroPose" : "kenBurns";
          leftCharacterId = distinctShotSpeakers[0] ?? sectionSpeakerIds[0];
          rightCharacterId = undefined;
          if (kind === "kenBurns" && imageStrategy === "reuse-secondary") {
            imageStrategy = "reuse-background";
          }
        }

        if (kind !== "dialogue" && !leftCharacterId) {
          leftCharacterId = inferShotFocusCharacterId(shot, section, project.characters, validCharacterIds)
            ?? (sectionSpeakerIds.length === 1 ? sectionSpeakerIds[0] : undefined);
        }

        return {
          id: `${entry.sectionId}-shot-${index}`,
          kind,
          emphasis: Math.min(3, Math.max(1, Math.round(shot.emphasis || 1))),
          imageStrategy,
          imagePrompt: normalizeText(shot.imagePrompt),
          leftCharacterId,
          rightCharacterId,
          headline: undefined,
          caption: undefined,
          sfxLabel: undefined,
          rationale: normalizeText(shot.rationale),
        } satisfies DirectedShot;
      })
      .filter((shot) => Boolean(shot.kind));

    if (shots.length > 0) normalized[entry.sectionId] = shots;
  }

  return normalized;
}

async function attachGeneratedImages(project: StoryProject, plan: DirectedVideoPlan): Promise<DirectedVideoPlan> {
  if (MAX_GENERATED_IMAGES === 0 || !project.script) return plan;

  const charactersById = new Map(project.characters.map((character) => [character.id, character] as const));
  const locationsById = new Map(project.locations.map((location) => [location.id, location] as const));
  const sectionsById = new Map(project.script.sections.map((section) => [section.id, section] as const));
  let generatedCount = 0;

  for (const [sectionId, shots] of Object.entries(plan)) {
    const section = sectionsById.get(sectionId);
    if (!section) continue;

    for (let index = 0; index < shots.length; index += 1) {
      const shot = shots[index];
      if (shot.imageStrategy !== "generate" || !shot.imagePrompt) continue;
      if (generatedCount >= MAX_GENERATED_IMAGES) {
        shot.imageStrategy = "reuse-background";
        shot.imagePrompt = undefined;
        continue;
      }

      const imageSize = pickGeneratedShotImageSize(project.brief?.orientation, shot);
      const prompt = buildShotImagePrompt(project, section, shot, imageSize, charactersById, locationsById);
      const imageOptions = buildShotImageReferences(section, shot, charactersById);
      const imageBuffer = await withStage(`video.image.${section.sectionOrder}.${index}`, () =>
        videoDirectionImageProvider.generateImage(prompt, imageSize, imageOptions),
      );
      shot.imagePath = saveImage(imageBuffer, "png");
      generatedCount += 1;
    }
  }

  return plan;
}

export async function buildVideoDirection(
  project: StoryProject,
  manifest: AssetManifest,
): Promise<DirectedVideoPlan> {
  if (!project.script || project.script.sections.length === 0) return {};

  const storyLanguage = inferProjectStoryLanguage(project);

  if (isVideoDirectionAgentsEnabled()) {
    try {
      const rawPlan = await buildVideoDirectionPlanWithAgents(project, manifest);
      const normalized = normalizePlan(project, rawPlan);
      return attachGeneratedImages(project, normalized);
    } catch (error) {
      console.warn(`[video] agents planner fallback: ${(error as Error).message}`);
    }
  }

  try {
    const rawPlan = await withStage("video.plan", () =>
      videoDirectionTextProvider.generateStructured<VideoPlanOutput>(plannerPrompt(project, manifest), videoPlanSchema, {
        systemPrompt: plannerSystemPrompt(storyLanguage),
        model: VIDEO_DIRECTION_MODEL,
      }),
    );
    const normalized = normalizePlan(project, rawPlan);
    return attachGeneratedImages(project, normalized);
  } catch (error) {
    console.warn(`[video] direction planner fallback: ${(error as Error).message}`);
    return {};
  }
}