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

export interface Composition {
  id: string;
  htmlPath: string;
  createdAt: string;
}

export interface Voice {
  voiceId: string;
  name: string;
}

export type StyleGenre = "Comic" | "Anime" | "Painterly" | "3D" | "Retro" | "Minimal";

export interface StylePreset {
  presetName: string;
  genre: StyleGenre;
  description: string;
  visualStyle: string;
  artisticMedium: string;
  colorPalette: string;
  swatches: string[];
  lighting: string;
  mood: string;
  previewPrompt: string;
  previewImagePath?: string;
  previewImagePaths?: string[];
}
