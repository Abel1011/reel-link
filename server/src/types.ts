import type { Schema } from "@google/genai";

// Shared TypeScript types for Animated Story Creator

export type ImageSize = "1024x1024" | "1792x1024" | "1024x1792";

export interface StoryProject {
  id: string;
  name: string;
  mode: "ai" | "manual";
  prompt?: string;
  createdAt: string;
  updatedAt: string;
  brief?: StoryBrief;
  style?: StyleConfig;
  characters: Character[];
  locations: Location[];
  script?: StoryScript;
  composition?: Composition;
}

export type StoryTone =
  | "whimsical"
  | "mysterious"
  | "heroic"
  | "melancholic"
  | "funny"
  | "dramatic";

export type StoryLength = "short" | "standard" | "long";
export type StoryOrientation = "landscape" | "portrait" | "square";

export interface StoryBrief {
  premise?: string;
  tone?: StoryTone;
  lengthPreset?: StoryLength;
  orientation?: StoryOrientation;
  subtitlesEnabled?: boolean;
  narratorEnabled?: boolean;
}

export interface StyleConfig {
  id: string;
  visualStyle: string;
  artisticMedium: string;
  colorPalette: string;
  lighting: string;
  mood: string;
  presetName?: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  imagePrompt?: string;
  portraitPath?: string;
  voicePrompt?: string;
  voiceId?: string;
  voiceName?: string;
  voicePreviewUrl?: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  imagePrompt?: string;
  imagePath?: string;
}

export interface StoryScript {
  id: string;
  sections: ScriptSection[];
}

export interface ScriptSection {
  id: string;
  sectionOrder: number;
  locationId?: string;
  narratorText?: string;
  musicCue?: string;
  soundEffectCue?: string;
  narratorAudioPath?: string;
  narratorTimestamps?: WordTimestamp[];
  musicAudioPath?: string;
  sfxAudioPath?: string;
  dialogueLines: DialogueLine[];
  imageLayers: ImageLayer[];
}

export interface DialogueLine {
  id: string;
  characterId: string;
  lineText: string;
  lineOrder: number;
  audioPath?: string;
  timestamps?: WordTimestamp[];
}

export interface ImageLayer {
  id: string;
  layerType: "background" | "character" | "overlay";
  layerOrder: number;
  imagePath?: string;
  positionX: number;
  positionY: number;
  scale: number;
  description?: string;
}

export interface WordTimestamp {
  word: string;
  startMs: number;
  endMs: number;
}

export interface AssetManifest {
  images: Record<string, string>;
  audio: Record<string, string>;
  timestamps: Record<string, WordTimestamp[]>;
  /** Real audio durations in seconds, keyed by the same keys used in `audio`. */
  durations: Record<string, number>;
}

export interface EffectPreset {
  id: string;
  situationType: "speaking" | "scene-transition" | "character-entrance" | "character-exit" | "emphasis" | "idle";
  variant: number;
  gsapCode: string;
  description: string;
}

export interface Composition {
  id: string;
  htmlPath: string;
  createdAt: string;
}

export interface GenerateStructuredOptions {
  systemPrompt?: string;
  model?: "pro" | "flash";
  temperature?: number;
}

export interface GenerateImageReference {
  data: Buffer;
  mimeType: string;
  label?: string;
}

export interface GenerateImageOptions {
  references?: GenerateImageReference[];
}

export interface SpeechVoiceSettings {
  stability?: number;
  useSpeakerBoost?: boolean;
  similarityBoost?: number;
  style?: number;
  speed?: number;
}

export interface SpeechGenerationOptions {
  voiceSettings?: SpeechVoiceSettings;
  previousText?: string;
  nextText?: string;
}

export interface TextImageProvider {
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
  generateTextFast(prompt: string, systemPrompt?: string): Promise<string>;
  generateStructured<T>(
    prompt: string,
    schema: Schema,
    options?: GenerateStructuredOptions,
  ): Promise<T>;
  generateImage(prompt: string, size?: ImageSize, options?: GenerateImageOptions): Promise<Buffer>;
}

export interface ElevenLabsServiceInterface {
  generateSpeech(
    text: string,
    voiceId: string,
    options?: SpeechGenerationOptions,
  ): Promise<{ audio: Buffer; timestamps?: WordTimestamp[] }>;
  generateMusic(prompt: string, durationMs: number): Promise<Buffer>;
  generateSoundEffect(prompt: string, durationSeconds: number): Promise<Buffer>;
  listVoices(): Promise<Voice[]>;
  designVoice(voiceName: string, voiceDescription: string): Promise<{ voiceId: string; voiceName: string; previewAudio: Buffer }>;
}

export interface Voice {
  voiceId: string;
  name: string;
  previewUrl?: string;
}
