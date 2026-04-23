import { Hono } from "hono";
import {
  addCharacter,
  updateCharacter,
  deleteCharacter,
  getCharacter,
} from "../repositories/character-repository.js";
import { getProject } from "../repositories/project-repository.js";
import { getStyleByProjectId, saveStyle } from "../repositories/style-repository.js";
import { stylePresets } from "../data/style-presets.js";
import { saveImage, saveAudio } from "../services/asset-storage.js";
import { textImageProvider, elevenLabsService } from "../services/providers.js";
import {
  buildCharacterPortraitFallbackPrompt,
  buildCharacterVoiceFallbackPrompt,
  buildStyleReference,
  characterPromptBundleSchema,
} from "../services/creative-prompts.js";
import type { Character, StyleConfig } from "../types.js";
const characterRoutes = new Hono();

async function ensureCharacterPrompts(
  projectId: string,
  character: Character,
  style: StyleConfig,
): Promise<{ imagePrompt: string; voicePrompt: string }> {
  const existingImagePrompt = character.imagePrompt?.trim();
  const existingVoicePrompt = character.voicePrompt?.trim();
  if (existingImagePrompt && existingVoicePrompt) {
    return { imagePrompt: existingImagePrompt, voicePrompt: existingVoicePrompt };
  }

  const project = getProject(projectId);
  const storyContext = project?.brief?.premise?.trim() || project?.prompt?.trim() || "No story premise was provided.";

  try {
    const bundle = await textImageProvider.generateStructured<{ imagePrompt: string; voicePrompt: string }>(
      `Story premise:\n${storyContext}\n\nStyle reference:\n${buildStyleReference(style)}\n\nCharacter:\nName: ${character.name}\nDescription: ${character.description}\n\nCreate a direct image prompt and a direct ElevenLabs voice design prompt for this character.`,
      characterPromptBundleSchema,
      {
        model: "flash",
        systemPrompt:
          "You write downstream prompts for a portrait image model and ElevenLabs voice design. Return JSON only. " +
          "imagePrompt must be in English, directly usable for a shoulders-up portrait render. " +
          "voicePrompt must be in English, 2 to 4 sentences max 80 words, and describe only voice qualities.",
      },
    );

    const imagePrompt = bundle.imagePrompt?.trim() || existingImagePrompt || buildCharacterPortraitFallbackPrompt(character, style);
    const voicePrompt = bundle.voicePrompt?.trim() || existingVoicePrompt || buildCharacterVoiceFallbackPrompt(character, style);
    updateCharacter(character.id, { imagePrompt, voicePrompt });
    return { imagePrompt, voicePrompt };
  } catch {
    const imagePrompt = existingImagePrompt || buildCharacterPortraitFallbackPrompt(character, style);
    const voicePrompt = existingVoicePrompt || buildCharacterVoiceFallbackPrompt(character, style);
    updateCharacter(character.id, { imagePrompt, voicePrompt });
    return { imagePrompt, voicePrompt };
  }
}

characterRoutes.post("/", async (c) => {
  const projectId = c.req.param("id")!;
  const { name, description } = await c.req.json<{ name: string; description: string }>();
  const character = addCharacter(projectId, name, description);
  return c.json(character, 201);
});

characterRoutes.put("/:charId", async (c) => {
  const charId = c.req.param("charId");
  const body = await c.req.json();
  const updated = updateCharacter(charId, {
    ...body,
    ...(body.name !== undefined || body.description !== undefined
      ? {
          imagePrompt: body.imagePrompt ?? null,
          voicePrompt: body.voicePrompt ?? null,
        }
      : {}),
  });
  return c.json(updated);
});

characterRoutes.delete("/:charId", (c) => {
  const charId = c.req.param("charId");
  deleteCharacter(charId);
  return c.body(null, 204);
});

characterRoutes.post("/:charId/generate-portrait", async (c) => {
  const projectId = c.req.param("id")!;
  const charId = c.req.param("charId");

  const character = getCharacter(charId);
  if (!character) return c.json({ error: "Character not found" }, 404);

  let style = getStyleByProjectId(projectId);
  if (!style) {
    const fallback =
      stylePresets.find((p) => p.presetName === "Pastoral Anime") ?? stylePresets[0];
    style = saveStyle(projectId, {
      visualStyle: fallback.visualStyle,
      artisticMedium: fallback.artisticMedium,
      colorPalette: fallback.colorPalette,
      lighting: fallback.lighting,
      mood: fallback.mood,
      presetName: fallback.presetName,
    });
  }
  const { imagePrompt } = await ensureCharacterPrompts(projectId, character, style);

  const imageBuffer = await textImageProvider.generateImage(imagePrompt, "1024x1024");
  const portraitPath = saveImage(imageBuffer, "png");
  const updated = updateCharacter(charId, { portraitPath });
  return c.json(updated);
});

characterRoutes.post("/:charId/generate-voice", async (c) => {
  const projectId = c.req.param("id")!;
  const charId = c.req.param("charId");

  const character = getCharacter(charId);
  if (!character) return c.json({ error: "Character not found" }, 404);

  const style = getStyleByProjectId(projectId);
  if (!style) return c.json({ error: "Style config not found" }, 400);
  const { voicePrompt } = await ensureCharacterPrompts(projectId, character, style);

  const voiceLabel = `${character.name} · ${charId.slice(0, 6)}`;
  const designed = await elevenLabsService.designVoice(voiceLabel, voicePrompt);
  const previewRelPath = saveAudio(designed.previewAudio, "mp3");

  const updated = updateCharacter(charId, {
    voicePrompt,
    voiceId: designed.voiceId,
    voiceName: designed.voiceName,
    voicePreviewUrl: `/assets/${previewRelPath}`,
  });
  return c.json(updated);
});

export { characterRoutes };
