import { Hono } from "hono";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { stylePresets } from "../data/style-presets.js";
import { saveStyle } from "../repositories/style-repository.js";
import { invalidateCharacterPromptsByProjectId } from "../repositories/character-repository.js";
import { invalidateLocationPromptsByProjectId } from "../repositories/location-repository.js";
import { textImageProvider } from "../services/providers.js";
import type { StyleConfig } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const previewDir = resolve(__dirname, "..", "..", "assets", "images", "style-presets");
mkdirSync(previewDir, { recursive: true });

const styleRoutes = new Hono();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function previewRelPath(presetName: string): string {
  return `images/style-presets/${slugify(presetName)}.png`;
}

function enrichPresets() {
  return stylePresets.map((p) => {
    const slug = slugify(p.presetName);
    const relV31 = `images/style-presets/${slug}.png`;
    const relV25 = `images/style-presets-v2.5/${slug}.png`;
    const absV31 = resolve(__dirname, "..", "..", "assets", relV31);
    const absV25 = resolve(__dirname, "..", "..", "assets", relV25);
    const paths = [
      existsSync(absV31) ? relV31 : undefined,
      existsSync(absV25) ? relV25 : undefined,
    ].filter((x): x is string => Boolean(x));
    return {
      ...p,
      previewImagePath: paths[0],
      previewImagePaths: paths,
    };
  });
}

styleRoutes.get("/style-presets", (c) => {
  return c.json(enrichPresets());
});

styleRoutes.post("/style-presets/:name/preview", async (c) => {
  const name = c.req.param("name");
  const preset = stylePresets.find((p) => p.presetName === name);
  if (!preset) {
    return c.json({ error: "Preset not found" }, 404);
  }

  const rel = previewRelPath(preset.presetName);
  const abs = resolve(__dirname, "..", "..", "assets", rel);

  try {
    const buffer = await textImageProvider.generateImage(preset.previewPrompt, "1024x1024");
    writeFileSync(abs, buffer);
    return c.json({ previewImagePath: rel });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate preview";
    return c.json({ error: message }, 500);
  }
});

styleRoutes.post("/projects/:id/style", async (c) => {
  const projectId = c.req.param("id");
  const body = await c.req.json<Omit<StyleConfig, "id">>();
  const saved = saveStyle(projectId, {
    visualStyle: body.visualStyle ?? "",
    artisticMedium: body.artisticMedium ?? "",
    colorPalette: body.colorPalette ?? "",
    lighting: body.lighting ?? "",
    mood: body.mood ?? "",
    presetName: body.presetName,
  });
  invalidateCharacterPromptsByProjectId(projectId);
  invalidateLocationPromptsByProjectId(projectId);
  return c.json(saved, 201);
});

export { styleRoutes };
