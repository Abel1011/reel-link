import { Hono } from "hono";
import {
  addLocation,
  updateLocation,
  deleteLocation,
  getLocation,
} from "../repositories/location-repository.js";
import { getStyleByProjectId, saveStyle } from "../repositories/style-repository.js";
import { stylePresets } from "../data/style-presets.js";
import { saveImage } from "../services/asset-storage.js";
import { textImageProvider } from "../services/providers.js";
import {
  buildLocationImageFallbackPrompt,
  buildStyleReference,
  locationPromptSchema,
} from "../services/creative-prompts.js";
import type { Location, StyleConfig } from "../types.js";

const locationRoutes = new Hono();

async function ensureLocationImagePrompt(
  location: Location,
  style: StyleConfig,
): Promise<string> {
  const existingPrompt = location.imagePrompt?.trim();
  if (existingPrompt) return existingPrompt;

  try {
    const bundle = await textImageProvider.generateStructured<{ imagePrompt: string }>(
      `Style reference:\n${buildStyleReference(style)}\n\nLocation:\nName: ${location.name}\nDescription: ${location.description}\n\nCreate a direct image prompt for this location as a clean empty environment plate.`,
      locationPromptSchema,
      {
        model: "flash",
        systemPrompt:
          "You write direct-to-image prompts for animated background plates. Return JSON only. " +
          "The imagePrompt must be in English, visually specific, reflect the supplied style, and describe ONLY the environment. " +
          "Do NOT mention or depict characters, creatures, silhouettes, body parts, costumes, or any figure in the frame.",
      },
    );

    const imagePrompt = bundle.imagePrompt?.trim() || buildLocationImageFallbackPrompt(location, style);
    updateLocation(location.id, { imagePrompt });
    return imagePrompt;
  } catch {
    const imagePrompt = buildLocationImageFallbackPrompt(location, style);
    updateLocation(location.id, { imagePrompt });
    return imagePrompt;
  }
}

locationRoutes.post("/", async (c) => {
  const projectId = c.req.param("id")!;
  const { name, description } = await c.req.json<{ name: string; description: string }>();
  const location = addLocation(projectId, name, description);
  return c.json(location, 201);
});

locationRoutes.put("/:locId", async (c) => {
  const locId = c.req.param("locId");
  const body = await c.req.json();
  const updated = updateLocation(locId, {
    ...body,
    ...(body.name !== undefined || body.description !== undefined
      ? { imagePrompt: body.imagePrompt ?? null }
      : {}),
  });
  return c.json(updated);
});

locationRoutes.delete("/:locId", (c) => {
  const locId = c.req.param("locId");
  deleteLocation(locId);
  return c.body(null, 204);
});

locationRoutes.post("/:locId/generate-image", async (c) => {
  const projectId = c.req.param("id")!;
  const locId = c.req.param("locId");

  const location = getLocation(locId);
  if (!location) return c.json({ error: "Location not found" }, 404);

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
  const prompt = await ensureLocationImagePrompt(location, style);

  const imageBuffer = await textImageProvider.generateImage(prompt, "1792x1024");
  const imagePath = saveImage(imageBuffer, "png");
  const updated = updateLocation(locId, { imagePath, imagePrompt: prompt });
  return c.json(updated);
});

export { locationRoutes };
