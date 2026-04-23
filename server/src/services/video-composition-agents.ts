import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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
import type { AssetManifest, StoryProject } from "../types.js";
import { withAiRetries } from "./ai-retry.js";
import {
  buildDeterministicComposition,
  buildTimeline,
  type CompositionSize,
} from "./video-composer.js";
import { currentDebug, logAiCall, withStage } from "./debug-logger.js";
import { buildSameLanguageInstruction, inferProjectStoryLanguage } from "./story-language.js";
import type { DirectedVideoPlan } from "./video-direction.js";

setTracingDisabled(true);

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_AZURE_API_VERSION = "2024-12-01-preview";
const VIDEO_COMPOSITION_AZURE_DEPLOYMENT = (process.env.VIDEO_COMPOSITION_AZURE_DEPLOYMENT ?? "gpt-5.4").trim();
const VIDEO_COMPOSITION_VERBOSITY: "low" | "medium" | "high" = "medium";
const PLAYBOOK_REASONING_EFFORT: "minimal" | "low" | "medium" | "high" | "xhigh" = "medium";
const BLUEPRINT_REASONING_EFFORT: "minimal" | "low" | "medium" | "high" | "xhigh" = "medium";
const HTML_REASONING_EFFORT: "minimal" | "low" | "medium" | "high" | "xhigh" = "medium";
const ALLOWED_SCRIPT_SRCS = new Set([
  "https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js",
  "https://cdn.jsdelivr.net/npm/@hyperframes/core/dist/hyperframe.runtime.iife.js",
  "/assets/vendor/story-motion-kit.js",
]);

const playbookSchema = z.object({
  globalRules: z.array(z.string()).min(4).max(10),
  shellRules: z.array(z.string()).min(3).max(8),
  sectionDirectives: z.array(
    z.object({
      sectionId: z.string(),
      focus: z.string(),
      reusePatterns: z.array(z.string()).min(1).max(4),
      implementationNotes: z.array(z.string()).min(1).max(5),
    }),
  ).min(1),
});

const blueprintSchema = z.object({
  shell: z.object({
    compositionId: z.string(),
    rootClass: z.string(),
    requiredScripts: z.array(z.string()).min(3).max(6),
    notes: z.array(z.string()).min(2).max(6),
  }),
  sections: z.array(
    z.object({
      sectionId: z.string(),
      renderingGoal: z.string(),
      requiredSceneKinds: z.array(z.enum(["kenBurns", "dialogue", "heroPose"]))
        .min(1)
        .max(4),
      overlayIds: z.array(z.string()).max(12),
      captionIds: z.array(z.string()).max(24),
      audioIds: z.array(z.string()).max(24),
      continuityNotes: z.array(z.string()).max(6),
    }),
  ).min(1),
  finalChecks: z.array(z.string()).min(3).max(8),
});

type HtmlPlaybook = z.infer<typeof playbookSchema>;
type HtmlBlueprint = z.infer<typeof blueprintSchema>;

interface CompactTimelineSection {
  sectionId: string;
  sectionOrder: number;
  locationName: string;
  narratorText: string;
  dialogueLines: Array<{
    lineId: string;
    characterId: string;
    text: string;
  }>;
  scenes: Array<{
    kind: "kenBurns" | "dialogue" | "heroPose";
    at: number;
    duration: number;
    trackBase: number;
    label: string;
    backdrop: string;
    image?: string;
    headline?: string;
    caption?: string;
    leftImage?: string;
    rightImage?: string;
    leftCaption?: string;
    rightCaption?: string;
    lines?: Array<{
      text: string;
      side: "left" | "right";
      variant?: "shout";
      start?: number;
      duration?: number;
    }>;
    sfx?: string;
    rain?: boolean;
  }>;
  overlays: Array<{
    id: string;
    kind: "meta" | "beat" | "badge" | "title";
    start: number;
    duration: number;
    trackIndex: number;
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    body?: string;
    badges?: string[];
  }>;
  captions: Array<{
    id: string;
    label?: string;
    start: number;
    duration: number;
    tone: "narrator" | "dialogue";
    text: string;
  }>;
  audioPlans: Array<{
    id: string;
    src: string;
    start: number;
    duration: number;
    trackIndex: number;
    volume: number;
  }>;
}

interface ExamplePack {
  supportedSceneKinds: Array<{
    id: string;
    title: string;
    description: string;
    useWhen: string;
  }>;
  runtimeInspirations: Array<{
    id: string;
    title: string;
    description: string;
    useWhen: string;
  }>;
  effectExamples: Array<{
    id: string;
    situationType: string;
    description: string;
    gsapCode: string;
  }>;
  demoPreviewExcerpt: string;
  deterministicReferenceHtml: string;
}

interface CompositionAuthoringContext {
  project: {
    id: string;
    name: string;
    premise: string;
    tone: string;
    orientation: string;
    storyLanguage: string;
  };
  size: CompositionSize;
  subtitlesEnabled: boolean;
  compositionId: string;
  rootClass: string;
  totalDuration: number;
  timeline: CompactTimelineSection[];
  examplePack: ExamplePack;
  allowedAssetUrls: Set<string>;
  requiredSceneKinds: Set<string>;
}

interface HtmlValidationResult {
  ok: boolean;
  errors: string[];
}

const playbookInstructions = [
  "You are a runtime playbook designer for agent-authored Story Motion compositions.",
  "Review the real runtime examples and current film context before any HTML is written.",
  "Do not write HTML.",
  "Derive practical rules for shell structure, code reuse, preset adaptation, and section emphasis.",
  "Push for visible variety across sections so the film does not reuse one motion recipe everywhere unless continuity truly requires it.",
  "Ground every recommendation in the provided examples and timeline facts.",
].join(" ");

const blueprintInstructions = [
  "You are the composition architect for a Story Motion film.",
  "Do not write HTML.",
  "Transform the approved film timeline and playbook into a complete rendering blueprint for the HTML author.",
  "Preserve section order, section ids, asset usage, and the runtime shell contract.",
  "Distribute multiple compatible scene treatments and effect patterns across the film instead of collapsing every section into the same visual move.",
  "Keep your output specific enough that the HTML author can assemble one full document without guessing missing structure.",
].join(" ");

const htmlAuthorInstructions = [
  "You are the final HTML author for a Story Motion video composition.",
  "Return only the final complete HTML document.",
  "Do not wrap the response in markdown fences.",
  "Adapt the provided examples instead of inventing new runtime APIs or asset paths.",
  "Keep the approved narration/dialogue text immutable and preserve the supplied timing and asset data.",
  "Honor the playbook's variety goals so separate sections do not all reuse the same effect cadence or scene treatment unless continuity requires it.",
  "Use one composition root, one timeline registration, and the approved script sources only.",
].join(" ");

const htmlRepairInstructions = [
  "You repair invalid Story Motion HTML documents.",
  "Return only the corrected complete HTML document.",
  "Do not wrap the response in markdown fences.",
  "Fix only the validation failures while preserving the film content, assets, and overall structure.",
].join(" ");

function hasConfiguredValue(value?: string): boolean {
  const normalized = (value ?? "").trim();
  if (!normalized) return false;
  return !/(your_|changeme|replace-me|example\.com)/i.test(normalized);
}

function readAzureCompositionEnv() {
  return {
    endpoint: (
      process.env.VIDEO_COMPOSITION_AZURE_ENDPOINT
      ?? process.env.VIDEO_DIRECTION_AZURE_ENDPOINT
      ?? process.env.AZURE_OPENAI_ENDPOINT
    )?.trim(),
    apiKey: (
      process.env.VIDEO_COMPOSITION_AZURE_API_KEY
      ?? process.env.VIDEO_DIRECTION_AZURE_API_KEY
      ?? process.env.AZURE_OPENAI_API_KEY
    )?.trim(),
    apiVersion: (
      process.env.VIDEO_COMPOSITION_AZURE_API_VERSION
      ?? process.env.VIDEO_DIRECTION_AZURE_API_VERSION
      ?? process.env.OPENAI_API_VERSION
      ?? DEFAULT_AZURE_API_VERSION
    ).trim(),
    deployment: VIDEO_COMPOSITION_AZURE_DEPLOYMENT,
  };
}

export function hasVideoCompositionAzureConfig(): boolean {
  const { endpoint, apiKey } = readAzureCompositionEnv();
  return hasConfiguredValue(endpoint) && hasConfiguredValue(apiKey);
}

function createAzureCompositionModel(): { model: OpenAIChatCompletionsModel; deployment: string } {
  const { endpoint, apiKey, apiVersion, deployment } = readAzureCompositionEnv();

  if (!hasConfiguredValue(endpoint)) {
    throw new Error("VIDEO_COMPOSITION_AZURE_ENDPOINT, VIDEO_DIRECTION_AZURE_ENDPOINT, or AZURE_OPENAI_ENDPOINT is required for agentic HTML composition");
  }
  if (!hasConfiguredValue(apiKey)) {
    throw new Error("VIDEO_COMPOSITION_AZURE_API_KEY, VIDEO_DIRECTION_AZURE_API_KEY, or AZURE_OPENAI_API_KEY is required for agentic HTML composition");
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
      verbosity: VIDEO_COMPOSITION_VERBOSITY,
    },
  };
}

function createAgents(model: OpenAIChatCompletionsModel) {
  return {
    playbookAgent: new Agent({
      name: "Composition Playbook Agent",
      instructions: playbookInstructions,
      model,
      modelSettings: agentSettings(PLAYBOOK_REASONING_EFFORT),
      outputType: playbookSchema,
    }),
    blueprintAgent: new Agent({
      name: "Composition Blueprint Agent",
      instructions: blueprintInstructions,
      model,
      modelSettings: agentSettings(BLUEPRINT_REASONING_EFFORT),
      outputType: blueprintSchema,
    }),
    htmlAuthorAgent: new Agent({
      name: "Composition HTML Author Agent",
      instructions: htmlAuthorInstructions,
      model,
      modelSettings: agentSettings(HTML_REASONING_EFFORT),
    }),
    htmlRepairAgent: new Agent({
      name: "Composition HTML Repair Agent",
      instructions: htmlRepairInstructions,
      model,
      modelSettings: agentSettings(HTML_REASONING_EFFORT),
    }),
  };
}

function normalizeText(text?: string): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function normalizeAssetUrl(path: string): string {
  if (path.startsWith("/assets/")) return path;
  return `/assets/${path.replace(/^\/+/, "")}`;
}

function lastSceneEnd(timeline: ReturnType<typeof buildTimeline>): number {
  return timeline.reduce((maxEnd, entry) => {
    const sectionEnd = entry.scenes.reduce((sceneEnd, scene) => Math.max(sceneEnd, scene.at + scene.duration), 0);
    return Math.max(maxEnd, sectionEnd);
  }, 0);
}

function rootClassForOrientation(orientation?: string): string {
  if (orientation === "portrait") return "story-root--portrait";
  if (orientation === "square") return "story-root--square";
  return "story-root--landscape";
}

function readDemoPreviewExcerpt(): string {
  const filePath = resolve(__dirname, "..", "..", "..", "client", "public", "hyperframes", "demo-preview.html");
  const source = readFileSync(filePath, "utf-8");
  return source.split(/\r?\n/).slice(0, 180).join("\n");
}

function buildExamplePack(referenceHtml: string): ExamplePack {
  const supportedSceneIds = new Set(["kenBurns", "dialogue", "heroPose"]);
  const inspirationIds = new Set(["title", "heartbeat", "tearDrop", "confession", "ticker", "memoryFlashback"]);

  return {
    supportedSceneKinds: motionScenePresets
      .filter((preset) => supportedSceneIds.has(preset.id))
      .map((preset) => ({
        id: preset.id,
        title: preset.title,
        description: preset.description,
        useWhen: preset.useWhen,
      })),
    runtimeInspirations: motionScenePresets
      .filter((preset) => inspirationIds.has(preset.id))
      .map((preset) => ({
        id: preset.id,
        title: preset.title,
        description: preset.description,
        useWhen: preset.useWhen,
      })),
    effectExamples: effectPresets.map((preset) => ({
      id: preset.id,
      situationType: preset.situationType,
      description: preset.description,
      gsapCode: preset.gsapCode,
    })),
    demoPreviewExcerpt: readDemoPreviewExcerpt(),
    deterministicReferenceHtml: referenceHtml,
  };
}

function buildAuthoringContext(
  project: StoryProject,
  manifest: AssetManifest,
  size: CompositionSize,
  subtitlesEnabled: boolean,
  direction?: DirectedVideoPlan,
): CompositionAuthoringContext {
  const timeline = buildTimeline(project, manifest, subtitlesEnabled, direction);
  const totalDuration = lastSceneEnd(timeline);
  const compositionId = `story-${project.id}`;
  const rootClass = rootClassForOrientation(project.brief?.orientation);
  const referenceHtml = buildDeterministicComposition(project, manifest, size, {
    subtitlesEnabled,
    direction,
  });
  const allowedAssetUrls = new Set<string>(["/assets/vendor/story-motion-kit.js"]);
  const requiredSceneKinds = new Set<string>();

  Object.values(manifest.images).forEach((url) => allowedAssetUrls.add(normalizeAssetUrl(url)));
  Object.values(manifest.audio).forEach((url) => allowedAssetUrls.add(normalizeAssetUrl(url)));

  const compactTimeline = timeline.map((entry) => {
    const locationName = project.locations.find((location) => location.id === entry.section.locationId)?.name ?? "Unknown Location";

    entry.scenes.forEach((scene) => {
      requiredSceneKinds.add(scene.kind);
      if (scene.image) allowedAssetUrls.add(scene.image);
      if (scene.leftImage) allowedAssetUrls.add(scene.leftImage);
      if (scene.rightImage) allowedAssetUrls.add(scene.rightImage);
    });
    entry.audioPlans.forEach((plan) => allowedAssetUrls.add(plan.src));

    return {
      sectionId: entry.section.id,
      sectionOrder: entry.section.sectionOrder,
      locationName,
      narratorText: entry.section.narratorText ?? "",
      dialogueLines: entry.section.dialogueLines.map((line) => ({
        lineId: line.id,
        characterId: line.characterId,
        text: line.lineText,
      })),
      scenes: entry.scenes.map((scene) => ({
        kind: scene.kind,
        at: scene.at,
        duration: scene.duration,
        trackBase: scene.trackBase,
        label: scene.label,
        backdrop: scene.backdrop,
        image: scene.image,
        headline: scene.headline,
        caption: scene.caption,
        leftImage: scene.leftImage,
        rightImage: scene.rightImage,
        leftCaption: scene.leftCaption,
        rightCaption: scene.rightCaption,
        lines: scene.lines?.map((line) => ({
          text: line.text,
          side: line.side,
          variant: line.variant,
          start: line.start,
          duration: line.duration,
        })),
        sfx: scene.sfx,
        rain: scene.rain,
      })),
      overlays: entry.overlays.map((overlay) => ({
        id: overlay.id,
        kind: overlay.kind,
        start: overlay.start,
        duration: overlay.duration,
        trackIndex: overlay.trackIndex,
        eyebrow: overlay.eyebrow,
        title: overlay.title,
        subtitle: overlay.subtitle,
        body: overlay.body,
        badges: overlay.badges,
      })),
      captions: entry.captions.map((caption) => ({
        id: caption.id,
        label: caption.label,
        start: caption.start,
        duration: caption.duration,
        tone: caption.tone,
        text: caption.words.join(" "),
      })),
      audioPlans: entry.audioPlans.map((audioPlan) => ({
        id: audioPlan.id,
        src: audioPlan.src,
        start: audioPlan.start,
        duration: audioPlan.duration,
        trackIndex: audioPlan.trackIndex,
        volume: audioPlan.volume,
      })),
    } satisfies CompactTimelineSection;
  });

  return {
    project: {
      id: project.id,
      name: project.name,
      premise: project.brief?.premise ?? "",
      tone: project.brief?.tone ?? "dramatic",
      orientation: project.brief?.orientation ?? "landscape",
      storyLanguage: inferProjectStoryLanguage(project),
    },
    size,
    subtitlesEnabled,
    compositionId,
    rootClass,
    totalDuration,
    timeline: compactTimeline,
    examplePack: buildExamplePack(referenceHtml),
    allowedAssetUrls,
    requiredSceneKinds,
  };
}

function compactPromptContext(context: CompositionAuthoringContext): Record<string, unknown> {
  return {
    project: context.project,
    size: context.size,
    subtitlesEnabled: context.subtitlesEnabled,
    compositionId: context.compositionId,
    rootClass: context.rootClass,
    totalDuration: context.totalDuration,
    requiredSceneKinds: Array.from(context.requiredSceneKinds),
    timeline: context.timeline,
    allowedAssetUrls: Array.from(context.allowedAssetUrls).sort(),
  };
}

function promptExamplePack(examplePack: ExamplePack): Record<string, unknown> {
  return {
    supportedSceneKinds: examplePack.supportedSceneKinds,
    runtimeInspirations: examplePack.runtimeInspirations,
    effectExamples: examplePack.effectExamples,
    demoPreviewExcerpt: examplePack.demoPreviewExcerpt,
  };
}

function buildPlaybookPrompt(context: CompositionAuthoringContext): string {
  return [
    "Design the runtime playbook for this film's new agent-authored HTML composition.",
    `Language rule: ${buildSameLanguageInstruction(context.project.storyLanguage, "all explanatory text fields")}`,
    "Return structured JSON only.",
    "Film context:",
    JSON.stringify(compactPromptContext(context), null, 2),
    "Curated example pack:",
    JSON.stringify(promptExamplePack(context.examplePack), null, 2),
  ].join("\n\n");
}

function buildBlueprintPrompt(context: CompositionAuthoringContext, playbook: HtmlPlaybook): string {
  return [
    "Build the full-film rendering blueprint for the HTML author.",
    `Language rule: ${buildSameLanguageInstruction(context.project.storyLanguage, "all explanatory text fields")}`,
    "Return structured JSON only.",
    "Film context:",
    JSON.stringify(compactPromptContext(context), null, 2),
    "Runtime playbook:",
    JSON.stringify(playbook, null, 2),
  ].join("\n\n");
}

function buildHtmlAuthorPrompt(
  context: CompositionAuthoringContext,
  playbook: HtmlPlaybook,
  blueprint: HtmlBlueprint,
): string {
  return [
    "Write the final HTML document for this film.",
    `Language rule: ${buildSameLanguageInstruction(context.project.storyLanguage, "all non-code explanatory text that you may include in comments or labels")}`,
    "Hard requirements:",
    "- Return only raw HTML.",
    "- Use exactly one composition root with the provided compositionId, width, height, and root class.",
    "- Include these script sources exactly once: GSAP 3.14.2, Hyperframes runtime, and /assets/vendor/story-motion-kit.js.",
    "- Register exactly one timeline in window.__timelines[compositionId].",
    "- Use storyMotionKit scene calls that match the blueprint and current supported scene kinds.",
    "- Reuse only the supplied /assets URLs. Do not invent new assets or remote script dependencies.",
    "- Preserve the supplied narration/dialogue text and timing facts.",
    "- Vary section treatment across the film. Do not clone one effect pattern or one scene recipe across every section unless continuity demands it.",
    "Film context:",
    JSON.stringify(compactPromptContext(context), null, 2),
    "Runtime playbook:",
    JSON.stringify(playbook, null, 2),
    "Rendering blueprint:",
    JSON.stringify(blueprint, null, 2),
    "Curated example pack:",
    JSON.stringify(promptExamplePack(context.examplePack), null, 2),
    "Working deterministic reference HTML for this same film:",
    context.examplePack.deterministicReferenceHtml,
  ].join("\n\n");
}

function buildRepairPrompt(
  context: CompositionAuthoringContext,
  playbook: HtmlPlaybook,
  blueprint: HtmlBlueprint,
  html: string,
  errors: string[],
): string {
  return [
    "Repair this invalid composition HTML.",
    "Return only raw HTML.",
    "Validation errors:",
    JSON.stringify(errors, null, 2),
    "Film context:",
    JSON.stringify(compactPromptContext(context), null, 2),
    "Runtime playbook:",
    JSON.stringify(playbook, null, 2),
    "Rendering blueprint:",
    JSON.stringify(blueprint, null, 2),
    "Invalid HTML to repair:",
    html,
  ].join("\n\n");
}

function logStageSuccess(stage: string, deployment: string, prompt: string, response: string, started: number): void {
  const debug = currentDebug();
  if (!debug?.projectId) return;
  logAiCall({
    ts: new Date().toISOString(),
    projectId: debug.projectId,
    stage,
    kind: "text",
    model: deployment,
    prompt,
    response,
    responseBytes: Buffer.byteLength(response, "utf-8"),
    elapsedMs: Date.now() - started,
  });
}

function logStageError(stage: string, deployment: string, prompt: string, error: unknown, started: number): void {
  const debug = currentDebug();
  if (!debug?.projectId) return;
  logAiCall({
    ts: new Date().toISOString(),
    projectId: debug.projectId,
    stage,
    kind: "text",
    model: deployment,
    prompt,
    error: error instanceof Error ? error.message : String(error),
    elapsedMs: Date.now() - started,
  });
}

async function runStructuredStage<T>(
  stage: string,
  deployment: string,
  agent: Agent<any, any>,
  prompt: string,
): Promise<T> {
  const started = Date.now();

  try {
    const result = await withStage(stage, () => withAiRetries(stage, () => run(agent, prompt)));
    if (typeof result.finalOutput === "undefined") {
      throw new Error(`Agent stage ${stage} produced no final output`);
    }
    const response = JSON.stringify(result.finalOutput);
    logStageSuccess(stage, deployment, prompt, response, started);
    return result.finalOutput as T;
  } catch (error) {
    logStageError(stage, deployment, prompt, error, started);
    throw error;
  }
}

function coerceTextOutput(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((item) => coerceTextOutput(item)).filter(Boolean).join("\n");
  }
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  for (const key of ["html", "text", "content", "output_text"]) {
    if (typeof record[key] === "string") {
      return record[key] as string;
    }
  }
  for (const key of ["content", "items", "parts"]) {
    if (Array.isArray(record[key])) {
      return record[key]
        .map((item) => coerceTextOutput(item))
        .filter(Boolean)
        .join("\n");
    }
  }

  return JSON.stringify(value, null, 2);
}

async function runTextStage(
  stage: string,
  deployment: string,
  agent: Agent<any, any>,
  prompt: string,
): Promise<string> {
  const started = Date.now();

  try {
    const result = await withStage(stage, () => withAiRetries(stage, () => run(agent, prompt)));
    const response = coerceTextOutput(result.finalOutput);
    if (!response.trim()) {
      throw new Error(`Agent stage ${stage} returned empty text output`);
    }
    logStageSuccess(stage, deployment, prompt, response, started);
    return response;
  } catch (error) {
    logStageError(stage, deployment, prompt, error, started);
    throw error;
  }
}

function sanitizeHtmlDocument(value: string): string {
  const fencedMatch = value.trim().match(/^```(?:html)?\s*([\s\S]*?)```$/i);
  const raw = fencedMatch ? fencedMatch[1] : value;
  const normalized = raw.trim();

  if (/^<!doctype html>/i.test(normalized)) return normalized;
  if (/^<html[\s>]/i.test(normalized)) return `<!DOCTYPE html>\n${normalized}`;
  return normalized;
}

function stripQueryOrHash(value: string): string {
  return value.replace(/[?#].*$/, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateGeneratedHtml(html: string, context: CompositionAuthoringContext): HtmlValidationResult {
  const errors: string[] = [];
  const trimmed = html.trim();
  const compositionIdPattern = new RegExp(`data-composition-id=["']${escapeRegExp(context.compositionId)}["']`);
  const widthPattern = new RegExp(`data-width=["']${context.size.width}["']`);
  const heightPattern = new RegExp(`data-height=["']${context.size.height}["']`);

  if (!/^<!doctype html>/i.test(trimmed)) {
    errors.push("Missing <!DOCTYPE html> declaration.");
  }
  if (!compositionIdPattern.test(trimmed)) {
    errors.push(`Missing required composition root for ${context.compositionId}.`);
  }
  if (!widthPattern.test(trimmed) || !heightPattern.test(trimmed)) {
    errors.push("Missing required root width/height attributes.");
  }
  if (!trimmed.includes("window.__timelines")) {
    errors.push("Missing window.__timelines registration.");
  }
  if (!trimmed.includes("storyMotionKit") && !trimmed.includes("window.storyMotionKit")) {
    errors.push("Missing Story Motion Kit usage.");
  }
  for (const scriptSrc of ALLOWED_SCRIPT_SRCS) {
    if (!trimmed.includes(scriptSrc)) {
      errors.push(`Missing required script source: ${scriptSrc}`);
    }
  }

  const scriptSrcs = Array.from(trimmed.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)).map((match) => match[1]);
  const unsupportedScriptSrcs = scriptSrcs.filter((src) => !ALLOWED_SCRIPT_SRCS.has(src));
  if (unsupportedScriptSrcs.length > 0) {
    errors.push(`Unsupported script sources: ${unsupportedScriptSrcs.join(", ")}`);
  }

  const referencedAssets = Array.from(new Set((trimmed.match(/\/assets\/[^"'\s)<>]+/g) ?? []).map(stripQueryOrHash)));
  const unknownAssets = referencedAssets.filter((asset) => !context.allowedAssetUrls.has(asset));
  if (unknownAssets.length > 0) {
    errors.push(`Unknown asset URLs: ${unknownAssets.slice(0, 8).join(", ")}`);
  }

  const usedSceneKinds = new Set(
    Array.from(trimmed.matchAll(/(?:kit|storyMotionKit)\.scenes\.(\w+)/g)).map((match) => match[1]),
  );
  for (const sceneKind of context.requiredSceneKinds) {
    if (!usedSceneKinds.has(sceneKind)) {
      errors.push(`Missing runtime scene call for ${sceneKind}.`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function mergePlaybookWithContext(context: CompositionAuthoringContext, playbook: HtmlPlaybook): HtmlPlaybook {
  const directivesBySectionId = new Map(playbook.sectionDirectives.map((directive) => [directive.sectionId, directive] as const));

  return {
    ...playbook,
    sectionDirectives: context.timeline.map((section) => {
      const existing = directivesBySectionId.get(section.sectionId);
      if (existing) return existing;
      return {
        sectionId: section.sectionId,
        focus: section.locationName,
        reusePatterns: Array.from(new Set(section.scenes.map((scene) => scene.kind))).slice(0, 4),
        implementationNotes: ["Preserve the existing timing, assets, and dialogue order."],
      };
    }),
  };
}

function mergeBlueprintWithContext(context: CompositionAuthoringContext, blueprint: HtmlBlueprint): HtmlBlueprint {
  const sectionsById = new Map(blueprint.sections.map((section) => [section.sectionId, section] as const));

  return {
    ...blueprint,
    shell: {
      compositionId: context.compositionId,
      rootClass: context.rootClass,
      requiredScripts: Array.from(ALLOWED_SCRIPT_SRCS),
      notes: blueprint.shell.notes,
    },
    sections: context.timeline.map((section) => {
      const existing = sectionsById.get(section.sectionId);
      if (existing) return existing;
      return {
        sectionId: section.sectionId,
        renderingGoal: `${section.locationName} sequence`,
        requiredSceneKinds: Array.from(new Set(section.scenes.map((scene) => scene.kind))),
        overlayIds: section.overlays.map((overlay) => overlay.id),
        captionIds: section.captions.map((caption) => caption.id),
        audioIds: section.audioPlans.map((audioPlan) => audioPlan.id),
        continuityNotes: section.scenes.some((scene) => scene.rain)
          ? ["Keep the environmental rain/storm continuity visible across the section."]
          : [],
      };
    }),
  };
}

export async function buildAgenticHtmlComposition(
  project: StoryProject,
  manifest: AssetManifest,
  size: CompositionSize,
  options: {
    subtitlesEnabled?: boolean;
    direction?: DirectedVideoPlan;
  } = {},
): Promise<string> {
  const subtitlesEnabled = options.subtitlesEnabled !== false;
  const context = buildAuthoringContext(project, manifest, size, subtitlesEnabled, options.direction);
  const { model, deployment } = createAzureCompositionModel();
  const agents = createAgents(model);

  const rawPlaybook = await runStructuredStage<HtmlPlaybook>(
    "video.composition.playbook",
    deployment,
    agents.playbookAgent,
    buildPlaybookPrompt(context),
  );
  const playbook = mergePlaybookWithContext(context, rawPlaybook);

  const rawBlueprint = await runStructuredStage<HtmlBlueprint>(
    "video.composition.blueprint",
    deployment,
    agents.blueprintAgent,
    buildBlueprintPrompt(context, playbook),
  );
  const blueprint = mergeBlueprintWithContext(context, rawBlueprint);

  const initialHtml = sanitizeHtmlDocument(await runTextStage(
    "video.composition.author",
    deployment,
    agents.htmlAuthorAgent,
    buildHtmlAuthorPrompt(context, playbook, blueprint),
  ));
  const initialValidation = validateGeneratedHtml(initialHtml, context);
  if (initialValidation.ok) {
    return initialHtml;
  }

  const repairedHtml = sanitizeHtmlDocument(await runTextStage(
    "video.composition.repair",
    deployment,
    agents.htmlRepairAgent,
    buildRepairPrompt(context, playbook, blueprint, initialHtml, initialValidation.errors),
  ));
  const repairedValidation = validateGeneratedHtml(repairedHtml, context);
  if (repairedValidation.ok) {
    return repairedHtml;
  }

  throw new Error(`Agentic HTML composition validation failed: ${repairedValidation.errors.join(" | ")}`);
}