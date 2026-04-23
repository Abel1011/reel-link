import { v4 as uuidv4 } from "uuid";
import db from "../db.js";
import { stylePresets } from "../data/style-presets.js";
import { saveStyle } from "./style-repository.js";
import type {
  StoryProject,
  StoryBrief,
  StoryTone,
  StoryLength,
  StoryOrientation,
  StyleConfig,
  Character,
  Location,
  StoryScript,
  ScriptSection,
  DialogueLine,
  ImageLayer,
  WordTimestamp,
  Composition,
} from "../types.js";

const DEFAULT_STYLE_PRESET = "Pastoral Anime";

function rowToBrief(row: any): StoryBrief | undefined {
  const hasAny =
    row.premise ||
    row.tone ||
    row.length_preset ||
    row.orientation ||
    row.subtitles_enabled != null ||
    row.narrator_enabled != null;
  if (!hasAny) return undefined;
  return {
    premise: row.premise ?? undefined,
    tone: (row.tone as StoryTone) ?? undefined,
    lengthPreset: (row.length_preset as StoryLength) ?? undefined,
    orientation: (row.orientation as StoryOrientation) ?? undefined,
    subtitlesEnabled:
      row.subtitles_enabled == null ? undefined : !!row.subtitles_enabled,
    narratorEnabled:
      row.narrator_enabled == null ? undefined : !!row.narrator_enabled,
  };
}

export function createProject(
  name: string,
  mode: "ai" | "manual",
  prompt?: string
): StoryProject {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO projects (id, name, mode, prompt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, name, mode, prompt ?? null, now, now);

  // Seed a default visual style so downstream generation always has something to work with
  const preset =
    stylePresets.find((p) => p.presetName === DEFAULT_STYLE_PRESET) ??
    stylePresets[0];
  const style = saveStyle(id, {
    visualStyle: preset.visualStyle,
    artisticMedium: preset.artisticMedium,
    colorPalette: preset.colorPalette,
    lighting: preset.lighting,
    mood: preset.mood,
    presetName: preset.presetName,
  });

  return {
    id,
    name,
    mode,
    prompt,
    createdAt: now,
    updatedAt: now,
    style,
    characters: [],
    locations: [],
  };
}

export function getProject(id: string): StoryProject | null {
  const row = db
    .prepare(`SELECT * FROM projects WHERE id = ?`)
    .get(id) as any;
  if (!row) return null;

  const project: StoryProject = {
    id: row.id,
    name: row.name,
    mode: row.mode,
    prompt: row.prompt ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    brief: rowToBrief(row),
    characters: [],
    locations: [],
  };

  // Load style
  const styleRow = db
    .prepare(`SELECT * FROM styles WHERE project_id = ?`)
    .get(id) as any;
  if (styleRow) {
    project.style = {
      id: styleRow.id,
      visualStyle: styleRow.visual_style ?? "",
      artisticMedium: styleRow.artistic_medium ?? "",
      colorPalette: styleRow.color_palette ?? "",
      lighting: styleRow.lighting ?? "",
      mood: styleRow.mood ?? "",
      presetName: styleRow.preset_name ?? undefined,
    } satisfies StyleConfig;
  }

  // Load characters
  const charRows = db
    .prepare(`SELECT * FROM characters WHERE project_id = ?`)
    .all(id) as any[];
  project.characters = charRows.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description ?? "",
    imagePrompt: c.image_prompt ?? undefined,
    portraitPath: c.portrait_path ?? undefined,
    voicePrompt: c.voice_prompt ?? undefined,
    voiceId: c.voice_id ?? undefined,
    voiceName: c.voice_name ?? undefined,
    voicePreviewUrl: c.voice_preview_url ?? undefined,
  })) satisfies Character[];

  // Load locations
  const locRows = db
    .prepare(`SELECT * FROM locations WHERE project_id = ?`)
    .all(id) as any[];
  project.locations = locRows.map((l) => ({
    id: l.id,
    name: l.name,
    description: l.description ?? "",
    imagePrompt: l.image_prompt ?? undefined,
    imagePath: l.image_path ?? undefined,
  })) satisfies Location[];

  // Load script with sections, dialogue lines, and image layers
  const scriptRow = db
    .prepare(`SELECT * FROM scripts WHERE project_id = ?`)
    .get(id) as any;
  if (scriptRow) {
    const sectionRows = db
      .prepare(
        `SELECT * FROM script_sections WHERE script_id = ? ORDER BY section_order`
      )
      .all(scriptRow.id) as any[];

    const sections: ScriptSection[] = sectionRows.map((s) => {
      const dialogueRows = db
        .prepare(
          `SELECT * FROM dialogue_lines WHERE section_id = ? ORDER BY line_order`
        )
        .all(s.id) as any[];

      const dialogueLines: DialogueLine[] = dialogueRows.map((d) => ({
        id: d.id,
        characterId: d.character_id,
        lineText: d.line_text,
        lineOrder: d.line_order,
        audioPath: d.audio_path ?? undefined,
        timestamps: d.timestamps_json
          ? (JSON.parse(d.timestamps_json) as WordTimestamp[])
          : undefined,
      }));

      const layerRows = db
        .prepare(
          `SELECT * FROM image_layers WHERE section_id = ? ORDER BY layer_order`
        )
        .all(s.id) as any[];

      const imageLayers: ImageLayer[] = layerRows.map((l) => ({
        id: l.id,
        layerType: l.layer_type,
        layerOrder: l.layer_order,
        imagePath: l.image_path ?? undefined,
        positionX: l.position_x ?? 0,
        positionY: l.position_y ?? 0,
        scale: l.scale ?? 1.0,
        description: l.description ?? undefined,
      }));

      return {
        id: s.id,
        sectionOrder: s.section_order,
        locationId: s.location_id ?? undefined,
        narratorText: s.narrator_text ?? undefined,
        musicCue: s.music_cue ?? undefined,
        soundEffectCue: s.sound_effect_cue ?? undefined,
        narratorAudioPath: s.narrator_audio_path ?? undefined,
        narratorTimestamps: s.narrator_timestamps_json
          ? (JSON.parse(s.narrator_timestamps_json) as WordTimestamp[])
          : undefined,
        musicAudioPath: s.music_audio_path ?? undefined,
        sfxAudioPath: s.sfx_audio_path ?? undefined,
        dialogueLines,
        imageLayers,
      } satisfies ScriptSection;
    });

    project.script = {
      id: scriptRow.id,
      sections,
    } satisfies StoryScript;
  }

  // Load composition
  const compRow = db
    .prepare(`SELECT * FROM compositions WHERE project_id = ?`)
    .get(id) as any;
  if (compRow) {
    project.composition = {
      id: compRow.id,
      htmlPath: compRow.html_path,
      createdAt: compRow.created_at,
    } satisfies Composition;
  }

  return project;
}

export function listProjects(): StoryProject[] {
  const rows = db
    .prepare(`SELECT * FROM projects ORDER BY created_at DESC`)
    .all() as any[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    mode: row.mode,
    prompt: row.prompt ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    brief: rowToBrief(row),
    characters: [],
    locations: [],
  }));
}

export function updateProject(
  id: string,
  data: Partial<{ name: string; prompt: string; brief: StoryBrief }>
): StoryProject {
  const sets: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    sets.push("name = ?");
    values.push(data.name);
  }
  if (data.prompt !== undefined) {
    sets.push("prompt = ?");
    values.push(data.prompt);
  }
  if (data.brief !== undefined) {
    const b = data.brief;
    if (b.premise !== undefined) {
      sets.push("premise = ?");
      values.push(b.premise);
    }
    if (b.tone !== undefined) {
      sets.push("tone = ?");
      values.push(b.tone);
    }
    if (b.lengthPreset !== undefined) {
      sets.push("length_preset = ?");
      values.push(b.lengthPreset);
    }
    if (b.orientation !== undefined) {
      sets.push("orientation = ?");
      values.push(b.orientation);
    }
    if (b.subtitlesEnabled !== undefined) {
      sets.push("subtitles_enabled = ?");
      values.push(b.subtitlesEnabled ? 1 : 0);
    }
    if (b.narratorEnabled !== undefined) {
      sets.push("narrator_enabled = ?");
      values.push(b.narratorEnabled ? 1 : 0);
    }
  }

  sets.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  db.prepare(`UPDATE projects SET ${sets.join(", ")} WHERE id = ?`).run(
    ...values
  );

  return getProject(id)!;
}
