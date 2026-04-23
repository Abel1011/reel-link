import { Hono } from "hono";
import { getProject } from "../repositories/project-repository.js";
import { saveComposition } from "../repositories/composition-repository.js";
import { saveHtml } from "../services/asset-storage.js";
import { currentDebug, logAiCall, runWithDebug } from "../services/debug-logger.js";
import { mp3DurationForAsset } from "../services/audio-duration.js";
import { buildAgenticHtmlComposition } from "../services/video-composition-agents.js";
import { buildVideoDirection } from "../services/video-direction.js";
import { buildDeterministicComposition, orientationToSize } from "../services/video-composer.js";
import type { AssetManifest, StoryProject } from "../types.js";

const videoRoutes = new Hono();

function buildAssetManifest(project: StoryProject): AssetManifest {
  const manifest: AssetManifest = { images: {}, audio: {}, timestamps: {}, durations: {} };
  if (!project.script) return manifest;

  const record = (key: string, relPath: string) => {
    manifest.audio[key] = `/assets/${relPath}`;
    const d = mp3DurationForAsset(relPath);
    if (d > 0) manifest.durations[key] = Math.round(d * 100) / 100;
  };

  for (const section of project.script.sections) {
    for (const layer of section.imageLayers) {
      if (layer.imagePath) {
        manifest.images[layer.id] = `/assets/${layer.imagePath}`;
      }
    }
    if (section.narratorAudioPath) record(`narrator-${section.id}`, section.narratorAudioPath);
    if (section.narratorTimestamps) {
      manifest.timestamps[`narrator-${section.id}`] = section.narratorTimestamps;
    }
    if (section.musicAudioPath) record(`music-${section.id}`, section.musicAudioPath);
    if (section.sfxAudioPath) record(`sfx-${section.id}`, section.sfxAudioPath);
    for (const line of section.dialogueLines) {
      if (line.audioPath) record(`dialogue-${line.id}`, line.audioPath);
      if (line.timestamps) {
        manifest.timestamps[line.id] = line.timestamps;
      }
    }
  }
  return manifest;
}

function validateAssets(project: StoryProject): string[] {
  const missing: string[] = [];
  if (!project.script) return ["No script found"];

  const narratorEnabled = project.brief?.narratorEnabled !== false;

  for (const section of project.script.sections) {
    const label = `Section ${section.sectionOrder}`;
    const hasImages = section.imageLayers.some((layer) => layer.imagePath);
    if (!hasImages) missing.push(`${label}: missing images`);
    if (narratorEnabled && section.narratorText && !section.narratorAudioPath) {
      missing.push(`${label}: missing narrator audio`);
    }
    for (const line of section.dialogueLines) {
      if (!line.audioPath) {
        missing.push(`${label}: missing dialogue audio for line "${line.lineText.slice(0, 30)}..."`);
      }
    }
  }

  return missing;
}

videoRoutes.post("/:id/generate-video", async (c) => {
  const projectId = c.req.param("id");

  const project = getProject(projectId);
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  if (!project.script || project.script.sections.length === 0) {
    return c.json({ error: "No script found for this project" }, 400);
  }

  const missingAssets = validateAssets(project);
  if (missingAssets.length > 0) {
    return c.json({ error: "Missing required assets", details: missingAssets }, 400);
  }

  const manifest = buildAssetManifest(project);
  const size = orientationToSize(project.brief?.orientation);
  const subtitlesEnabled = project.brief?.subtitlesEnabled !== false;
  const cleanedHtml = await runWithDebug({ projectId, stage: "video" }, async () => {
    const direction = await buildVideoDirection(project, manifest);
    try {
      return await buildAgenticHtmlComposition(project, manifest, size, {
        subtitlesEnabled,
        direction,
      });
    } catch (error) {
      const message = (error as Error).message;
      const debug = currentDebug();
      if (debug?.projectId) {
        logAiCall({
          ts: new Date().toISOString(),
          projectId: debug.projectId,
          stage: "video.composition.fallback",
          kind: "textFast",
          model: "agentic-html",
          prompt: "",
          error: message,
          elapsedMs: 0,
        });
      }
      console.warn(`[video] agentic composition fallback: ${message}`);
      return buildDeterministicComposition(project, manifest, size, {
        subtitlesEnabled,
        direction,
      });
    }
  });

  const htmlPath = saveHtml(cleanedHtml);
  saveComposition(projectId, htmlPath);

  return c.json(getProject(projectId));
});

export { videoRoutes };
