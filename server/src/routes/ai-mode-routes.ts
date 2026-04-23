import { Hono } from "hono";
import { getProject, updateProject } from "../repositories/project-repository.js";
import { saveStyle, getStyleByProjectId } from "../repositories/style-repository.js";
import {
  addCharacter,
  updateCharacter,
  getCharactersByProjectId,
} from "../repositories/character-repository.js";
import {
  addLocation,
  updateLocation,
  getLocationsByProjectId,
} from "../repositories/location-repository.js";
import { saveImage, saveAudio } from "../services/asset-storage.js";
import { textImageProvider, elevenLabsService } from "../services/providers.js";
import { runWithDebug, withStage } from "../services/debug-logger.js";
import {
  buildCharacterPortraitFallbackPrompt,
  buildCharacterVoiceFallbackPrompt,
  buildLocationImageFallbackPrompt,
  buildStyleReference,
  buildVoiceStyleReference,
  characterPlanListSchema,
  locationPlanListSchema,
  storyBriefSchema,
  styleConfigSchema,
  voicePromptSchema,
  type GeneratedCharacterPlan,
  type GeneratedLocationPlan,
  type GeneratedStoryBrief,
  type GeneratedStyleConfig,
} from "../services/creative-prompts.js";
import { buildSameLanguageInstruction, inferStoryLanguageLabel } from "../services/story-language.js";
import type { StoryTone } from "../types.js";

const aiModeRoutes = new Hono();

type ProgressState = {
  step: number;
  total: number;
  label: string;
  done: boolean;
  error?: string;
  updatedAt: number;
};

const TOTAL_STEPS = 7;
const PROGRESS_LABELS = [
  "Lighting the set",
  "Casting call",
  "Makeup & wardrobe",
  "Voice lab",
  "Scouting locations",
  "Matte paintings",
  "Writing the brief",
];

const progressByProject = new Map<string, ProgressState>();
const inflight = new Set<string>();

function setProgress(projectId: string, step: number, extra: Partial<ProgressState> = {}) {
  const label = extra.label ?? PROGRESS_LABELS[Math.min(step, TOTAL_STEPS - 1)] ?? "";
  progressByProject.set(projectId, {
    step,
    total: TOTAL_STEPS,
    label,
    done: extra.done ?? false,
    error: extra.error,
    updatedAt: Date.now(),
  });
  console.log(`[ai-generate] ${projectId} step ${step}/${TOTAL_STEPS}: ${label}${extra.error ? ` ERROR: ${extra.error}` : ""}`);
}

const VALID_TONES: StoryTone[] = [
  "whimsical",
  "mysterious",
  "heroic",
  "melancholic",
  "funny",
  "dramatic",
];

async function designVoiceForCharacter(
  name: string,
  description: string,
  styleLine: string,
  providedVoicePrompt?: string,
): Promise<{ voiceId: string; voiceName: string; voicePreviewUrl: string }> {
  const baseDescription = description?.trim() || name;
  let voicePrompt = providedVoicePrompt?.trim();
  try {
    if (!voicePrompt) {
      const system =
        "You write direct ElevenLabs voice design prompts. Return JSON only. " +
        "The voicePrompt must be ONE concise English paragraph (2-4 sentences, max 80 words) describing ONLY voice qualities: " +
        "age, gender or ambiguity, accent, timbre, pitch, pace, emotional color, and delivery style. " +
        "Do NOT describe appearance, clothing, backstory, or actions.";
      const userPrompt = `Character: ${name}\nDescription: ${baseDescription}\n${styleLine}\nWrite the voice design prompt.`;
      const generated = await withStage(`ai.voicePrompt.${name}`, () =>
        textImageProvider.generateStructured<{ voicePrompt: string }>(userPrompt, voicePromptSchema, {
          systemPrompt: system,
          model: "pro",
        }),
      );
      voicePrompt = generated.voicePrompt.trim();
    }
  } catch {
    voicePrompt = `A natural, expressive voice for ${name}. ${baseDescription}. ${styleLine}`.trim();
  }

  const voiceLabel = `${name} · ${Math.random().toString(36).slice(2, 8)}`;
  const designed = await elevenLabsService.designVoice(voiceLabel, voicePrompt);
  const previewRelPath = saveAudio(designed.previewAudio, "mp3");
  return {
    voiceId: designed.voiceId,
    voiceName: designed.voiceName,
    voicePreviewUrl: `/assets/${previewRelPath}`,
  };
}

function inferToneFromPrompt(storyPrompt: string): StoryTone {
  const raw = storyPrompt.trim().toLowerCase();
  const match = VALID_TONES.find((tone) => raw.includes(tone));
  return match ?? "whimsical";
}

function normalizeTone(rawTone?: string): StoryTone {
  const normalized = rawTone?.trim().toLowerCase() ?? "";
  return VALID_TONES.find((tone) => normalized.includes(tone)) ?? "whimsical";
}

async function generateStoryBrief(
  storyPrompt: string,
  characters: { name: string; description: string }[],
  locations: { name: string; description: string }[],
): Promise<{ premise: string; tone: StoryTone }> {
  try {
    const storyLanguage = inferStoryLanguageLabel(storyPrompt);
    const system =
      "You are a story editor shaping a pitch into a screenwriter-ready story brief. Return JSON only. " +
      "Return an object with premise and tone. premise must be ONE polished paragraph in the SAME language as the user's idea (do not translate), target 120-220 words, and include hook, protagonist goal, obstacle or stakes, the world/setting, and a hint of emotional arc. " +
      "Weave in the given characters by name and at least one location. Keep it present-tense, concrete, evocative, and free of markdown. " +
      `${buildSameLanguageInstruction(storyLanguage, "the premise")}. ` +
      "tone must be exactly one of: whimsical, mysterious, heroic, melancholic, funny, dramatic.";
    const charBlock = characters
      .map((c) => `- ${c.name}: ${c.description}`)
      .join("\n");
    const locBlock = locations
      .map((l) => `- ${l.name}: ${l.description}`)
      .join("\n");
    const user = `Original idea:\n${storyPrompt}\n\nCharacters:\n${charBlock}\n\nLocations:\n${locBlock}\n\nWrite the story brief now.`;
    const brief = await withStage("ai.brief", () =>
      textImageProvider.generateStructured<GeneratedStoryBrief>(user, storyBriefSchema, {
        systemPrompt: system,
        model: "pro",
      }),
    );
    const premise = brief.premise?.trim() ? brief.premise.trim().slice(0, 2000) : storyPrompt;
    return {
      premise,
      tone: normalizeTone(String(brief.tone ?? "")),
    };
  } catch {
    return {
      premise: storyPrompt,
      tone: inferToneFromPrompt(storyPrompt),
    };
  }
}

aiModeRoutes.get("/:id/ai-generate/progress", (c) => {
  const projectId = c.req.param("id");
  const state = progressByProject.get(projectId);
  if (!state) {
    return c.json({ step: 0, total: TOTAL_STEPS, label: "Warming up", done: false });
  }
  return c.json(state);
});

aiModeRoutes.post("/:id/ai-generate", async (c) => {
  const projectId = c.req.param("id");

  const project = getProject(projectId);
  if (!project) return c.json({ error: "Project not found" }, 404);
  if (!project.prompt) return c.json({ error: "Project has no prompt" }, 400);

  // Idempotency guard #1: another request is already generating this project.
  if (inflight.has(projectId)) {
    console.log(`[ai-generate] ${projectId} already in flight, ignoring duplicate POST`);
    const current = progressByProject.get(projectId);
    return c.json(current ?? { step: 0, total: TOTAL_STEPS, label: "In progress", done: false }, 202);
  }

  // Idempotency guard #2: project already has pre-production content, do not regenerate.
  const existingStyle = getStyleByProjectId(projectId);
  const existingCharacters = getCharactersByProjectId(projectId);
  const existingLocations = getLocationsByProjectId(projectId);
  if (
    existingStyle &&
    existingCharacters.length > 0 &&
    existingLocations.length > 0 &&
    existingCharacters.every((c) => c.portraitPath) &&
    existingLocations.every((l) => l.imagePath)
  ) {
    console.log(`[ai-generate] ${projectId} already populated, skipping regeneration`);
    setProgress(projectId, TOTAL_STEPS, { done: true, label: "Ready" });
    return c.json(getProject(projectId));
  }

  inflight.add(projectId);
  try {
    return await runWithDebug({ projectId }, () => runPreproduction(c, projectId, project.prompt!));
  } finally {
    inflight.delete(projectId);
  }
});

async function runPreproduction(c: any, projectId: string, storyPrompt: string) {

  // 1. Generate style
  setProgress(projectId, 0);
  const styleParsed = await withStage("ai.style", () =>
    textImageProvider.generateStructured<GeneratedStyleConfig>(
      `Story idea:\n${storyPrompt}\n\nCreate one cohesive visual direction for the full project.`,
      styleConfigSchema,
      {
        model: "flash",
        systemPrompt:
          "You are a visual development artist. Return JSON only. " +
          "Create a single production-ready style config. Keep each field concise, concrete, and visually useful. " +
          "presetName must be a short evocative label of 2 to 4 words.",
      },
    ),
  );

  const style = saveStyle(projectId, {
    visualStyle: styleParsed.visualStyle ?? "",
    artisticMedium: styleParsed.artisticMedium ?? "",
    colorPalette: styleParsed.colorPalette ?? "",
    lighting: styleParsed.lighting ?? "",
    mood: styleParsed.mood ?? "",
    presetName: styleParsed.presetName ?? undefined,
  });

  const stylePrompt = buildStyleReference(style);
  const styleLineForVoice = buildVoiceStyleReference(style);

  // 2. Generate characters (keep the cast small while we iterate)
  setProgress(projectId, 1);
  const charsParsed = await withStage("ai.characters", () =>
    textImageProvider.generateStructured<GeneratedCharacterPlan[]>(
      `Story idea:\n${storyPrompt}\n\nStyle reference:\n${stylePrompt}\n\nCreate the core cast for this story.`,
      characterPlanListSchema,
      {
        model: "pro",
        systemPrompt:
          "You are a character art director. Return JSON only. " +
          "Create EXACTLY 2 characters: a protagonist and one supporting character. " +
          "Each character must include: name, a short physical/personality description, an imagePrompt in English ready to send directly to the image model, and a voicePrompt in English ready to send directly to ElevenLabs voice design. " +
          "The prompts must already reflect the given visual style and story premise.",
      },
    ),
  );

  if (!Array.isArray(charsParsed) || charsParsed.length !== 2) {
    return c.json({ error: "AI returned an unexpected response for characters" }, 500);
  }

  const characters = charsParsed
    .slice(0, 2)
    .map((ch: GeneratedCharacterPlan) =>
      addCharacter(projectId, ch.name ?? "Unnamed", ch.description ?? "", {
        imagePrompt: ch.imagePrompt ?? undefined,
        voicePrompt: ch.voicePrompt ?? undefined,
      })
    );

  // 3. Portraits (parallel)
  setProgress(projectId, 2);
  await Promise.all(
    characters.map(async (character) => {
      const prompt = character.imagePrompt ?? buildCharacterPortraitFallbackPrompt(character, style);
      const imageBuffer = await withStage(
        `ai.portrait.${character.name}`,
        () => textImageProvider.generateImage(prompt, "1024x1024"),
      );
      const portraitPath = saveImage(imageBuffer, "png");
      updateCharacter(character.id, { portraitPath });
    }),
  );

  // 4. Custom-designed voices (parallel)
  //    Preset fallback voices (stock ElevenLabs voices) so no character ends up
  //    without a voiceId — which would block dialogue audio + video later.
  const FALLBACK_VOICES = [
    "21m00Tcm4TlvDq8ikWAM", // Rachel
    "AZnzlk1XvdvUeBnXmlld", // Domi
    "EXAVITQu4vr4xnSDxMaL", // Bella
    "ErXwobaYiN019PkySvjV", // Antoni
    "MF3mGyEYCl7XYWbV9V6O", // Elli
    "TxGEqnHWrfWFTfGW9XjX", // Josh
  ];
  setProgress(projectId, 3);
  await Promise.all(
    characters.map(async (character, idx) => {
      try {
        const voice = await designVoiceForCharacter(
          character.name,
          character.description,
          styleLineForVoice,
          character.voicePrompt,
        );
        updateCharacter(character.id, voice);
      } catch (err) {
        const msg = (err as Error)?.message ?? String(err);
        console.warn(`[ai-mode] designVoice failed for "${character.name}": ${msg} — using preset fallback`);
        updateCharacter(character.id, {
          voiceId: FALLBACK_VOICES[idx % FALLBACK_VOICES.length],
          voiceName: `${character.name} (preset)`,
        });
      }
    }),
  );

  // 5. Locations (keep it tight: 2 locations)
  setProgress(projectId, 4);
  const locsParsed = await withStage("ai.locations", () =>
    textImageProvider.generateStructured<GeneratedLocationPlan[]>(
      `Story idea:\n${storyPrompt}\n\nStyle reference:\n${stylePrompt}\n\nCreate the two key unoccupied locations for the story. Each location prompt must describe only the space itself.`,
      locationPlanListSchema,
      {
        model: "flash",
        systemPrompt:
          "You are a location designer for animated shorts. Return JSON only. " +
          "Create EXACTLY 2 locations that cover the story. Each one must include a name, a visual description, and an imagePrompt in English ready to send directly to the image model. " +
          "The imagePrompt must reflect the style reference while describing ONLY the environment: space, props, layout, materials, lighting, and atmosphere. " +
          "Do NOT mention or depict any character, creature, silhouette, clothing, or figure. The result must be a clean unoccupied background plate.",
      },
    ),
  );

  if (!Array.isArray(locsParsed) || locsParsed.length !== 2) {
    return c.json({ error: "AI returned an unexpected response for locations" }, 500);
  }

  const locations = locsParsed
    .slice(0, 2)
    .map((loc: GeneratedLocationPlan) =>
      addLocation(projectId, loc.name ?? "Unnamed", loc.description ?? "", {
        imagePrompt: loc.imagePrompt ?? undefined,
      })
    );

  // 6. Location images (parallel)
  setProgress(projectId, 5);
  await Promise.all(
    locations.map(async (location) => {
      const prompt = location.imagePrompt ?? buildLocationImageFallbackPrompt(location, style);
      const imageBuffer = await withStage(
        `ai.matte.${location.name}`,
        () => textImageProvider.generateImage(prompt, "1792x1024"),
      );
      const imagePath = saveImage(imageBuffer, "png");
      updateLocation(location.id, { imagePath });
    }),
  );

  // 7. Seed the story brief so the Script page is ready to generate
  setProgress(projectId, 6);
  const { tone, premise } = await generateStoryBrief(storyPrompt, characters, locations);
  updateProject(projectId, {
    brief: {
      premise,
      tone,
      lengthPreset: "standard",
      orientation: "landscape",
      subtitlesEnabled: true,
      narratorEnabled: true,
    },
  });

  // 8. Return updated project
  setProgress(projectId, TOTAL_STEPS, { done: true, label: "Ready" });
  const updatedProject = getProject(projectId);
  return c.json(updatedProject);
}

export { aiModeRoutes };
