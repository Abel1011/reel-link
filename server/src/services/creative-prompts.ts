import { Type, type Schema } from "@google/genai";
import type { Character, Location, StoryTone, StyleConfig } from "../types.js";

type StyleReference = Pick<
  StyleConfig,
  "visualStyle" | "artisticMedium" | "colorPalette" | "lighting" | "mood" | "presetName"
>;

export interface GeneratedStyleConfig {
  visualStyle: string;
  artisticMedium: string;
  colorPalette: string;
  lighting: string;
  mood: string;
  presetName: string;
}

export interface GeneratedCharacterPlan {
  name: string;
  description: string;
  imagePrompt: string;
  voicePrompt: string;
}

export interface GeneratedLocationPlan {
  name: string;
  description: string;
  imagePrompt: string;
}

export interface GeneratedStoryBrief {
  premise: string;
  tone: StoryTone | string;
}

export const styleConfigSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    visualStyle: { type: Type.STRING },
    artisticMedium: { type: Type.STRING },
    colorPalette: { type: Type.STRING },
    lighting: { type: Type.STRING },
    mood: { type: Type.STRING },
    presetName: { type: Type.STRING },
  },
  required: ["visualStyle", "artisticMedium", "colorPalette", "lighting", "mood", "presetName"],
  propertyOrdering: ["visualStyle", "artisticMedium", "colorPalette", "lighting", "mood", "presetName"],
};

const characterPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    imagePrompt: { type: Type.STRING },
    voicePrompt: { type: Type.STRING },
  },
  required: ["name", "description", "imagePrompt", "voicePrompt"],
  propertyOrdering: ["name", "description", "imagePrompt", "voicePrompt"],
};

export const characterPlanListSchema: Schema = {
  type: Type.ARRAY,
  minItems: "2",
  maxItems: "2",
  items: characterPlanSchema,
};

export const characterPromptBundleSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    imagePrompt: { type: Type.STRING },
    voicePrompt: { type: Type.STRING },
  },
  required: ["imagePrompt", "voicePrompt"],
  propertyOrdering: ["imagePrompt", "voicePrompt"],
};

const locationPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    imagePrompt: { type: Type.STRING },
  },
  required: ["name", "description", "imagePrompt"],
  propertyOrdering: ["name", "description", "imagePrompt"],
};

export const locationPlanListSchema: Schema = {
  type: Type.ARRAY,
  minItems: "2",
  maxItems: "2",
  items: locationPlanSchema,
};

export const locationPromptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    imagePrompt: { type: Type.STRING },
  },
  required: ["imagePrompt"],
  propertyOrdering: ["imagePrompt"],
};

export const voicePromptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    voicePrompt: { type: Type.STRING },
  },
  required: ["voicePrompt"],
  propertyOrdering: ["voicePrompt"],
};

export const storyBriefSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    premise: { type: Type.STRING },
    tone: { type: Type.STRING },
  },
  required: ["premise", "tone"],
  propertyOrdering: ["premise", "tone"],
};

export function buildStyleReference(style: StyleReference): string {
  return [
    `Visual style: ${style.visualStyle}.`,
    `Medium: ${style.artisticMedium}.`,
    `Palette: ${style.colorPalette}.`,
    `Lighting: ${style.lighting}.`,
    `Mood: ${style.mood}.`,
    style.presetName ? `Reference label: ${style.presetName}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildVoiceStyleReference(style: StyleReference): string {
  return `The story uses ${style.presetName ?? style.visualStyle} visuals, ${style.lighting} lighting, and a ${style.mood} mood.`;
}

export function buildCharacterPortraitFallbackPrompt(
  character: Pick<Character, "name" | "description">,
  style: StyleReference,
): string {
  return `Character portrait: ${character.name}. ${character.description}. ${buildStyleReference(style)} Square 1:1 shoulders-up composition on a simple complementary background, consistent with the visual style above, no text, no watermarks.`;
}

export function buildCharacterVoiceFallbackPrompt(
  character: Pick<Character, "name" | "description">,
  style: StyleReference,
): string {
  return `A natural, expressive voice for ${character.name}. ${character.description}. ${buildVoiceStyleReference(style)}`.trim();
}

export function buildLocationImageFallbackPrompt(
  location: Pick<Location, "name" | "description">,
  style: StyleReference,
): string {
  return [
    `Wide cinematic establishing shot of: ${location.name}.`,
    location.description,
    buildStyleReference(style),
    "Depict only the environment/background plate.",
    "No characters, people, creatures, silhouettes, body parts, or clothing.",
    "Wide 16:9 landscape composition, no text, no watermarks, suitable as a clean background plate for compositing.",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}