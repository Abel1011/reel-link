import { v4 as uuidv4 } from "uuid";
import db from "../db.js";
import type {
  StoryScript,
  ScriptSection,
  DialogueLine,
  ImageLayer,
  WordTimestamp,
} from "../types.js";

interface SectionInput {
  sectionOrder: number;
  locationId?: string;
  narratorText?: string;
  narratorTimestamps?: WordTimestamp[];
  musicCue?: string;
  soundEffectCue?: string;
  dialogueLines: Array<{
    characterId: string;
    lineText: string;
    lineOrder: number;
  }>;
  imageLayers: Array<{
    layerType: "background" | "character" | "overlay";
    layerOrder: number;
    imagePath?: string;
    positionX?: number;
    positionY?: number;
    scale?: number;
    description?: string;
  }>;
}

export function saveScript(
  projectId: string,
  sections: SectionInput[]
): StoryScript {
  const scriptId = uuidv4();

  const txn = db.transaction(() => {
    db.prepare(`DELETE FROM scripts WHERE project_id = ?`).run(projectId);

    db.prepare(
      `INSERT INTO scripts (id, project_id) VALUES (?, ?)`
    ).run(scriptId, projectId);

    const insertSection = db.prepare(
      `INSERT INTO script_sections (id, script_id, section_order, location_id, narrator_text, narrator_timestamps_json, music_cue, sound_effect_cue)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertDialogue = db.prepare(
      `INSERT INTO dialogue_lines (id, section_id, character_id, line_text, line_order)
       VALUES (?, ?, ?, ?, ?)`
    );
    const insertLayer = db.prepare(
      `INSERT INTO image_layers (id, section_id, layer_type, layer_order, image_path, position_x, position_y, scale, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const s of sections) {
      const sectionId = uuidv4();
      insertSection.run(
        sectionId,
        scriptId,
        s.sectionOrder,
        s.locationId ?? null,
        s.narratorText ?? null,
        s.narratorTimestamps ? JSON.stringify(s.narratorTimestamps) : null,
        s.musicCue ?? null,
        s.soundEffectCue ?? null
      );

      for (const d of s.dialogueLines) {
        insertDialogue.run(
          uuidv4(),
          sectionId,
          d.characterId,
          d.lineText,
          d.lineOrder
        );
      }

      for (const l of s.imageLayers) {
        insertLayer.run(
          uuidv4(),
          sectionId,
          l.layerType,
          l.layerOrder,
          l.imagePath ?? null,
          l.positionX ?? 0,
          l.positionY ?? 0,
          l.scale ?? 1.0,
          l.description ?? null
        );
      }
    }
  });

  txn();
  return getScriptByProjectId(projectId)!;
}

export function getScriptByProjectId(projectId: string): StoryScript | null {
  const scriptRow = db
    .prepare(`SELECT * FROM scripts WHERE project_id = ?`)
    .get(projectId) as any;
  if (!scriptRow) return null;

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

  return { id: scriptRow.id, sections };
}

export function updateScriptSection(
  sectionId: string,
  data: Partial<{
    narratorText: string;
    narratorTimestampsJson: string;
    musicCue: string;
    soundEffectCue: string;
    locationId: string;
    narratorAudioPath: string;
    musicAudioPath: string;
    sfxAudioPath: string;
  }>
): ScriptSection {
  const columnMap: Record<string, string> = {
    narratorText: "narrator_text",
    narratorTimestampsJson: "narrator_timestamps_json",
    musicCue: "music_cue",
    soundEffectCue: "sound_effect_cue",
    locationId: "location_id",
    narratorAudioPath: "narrator_audio_path",
    musicAudioPath: "music_audio_path",
    sfxAudioPath: "sfx_audio_path",
  };

  const sets: string[] = [];
  const values: any[] = [];

  for (const [key, col] of Object.entries(columnMap)) {
    if ((data as any)[key] !== undefined) {
      sets.push(`${col} = ?`);
      values.push((data as any)[key]);
    }
  }

  if (sets.length > 0) {
    values.push(sectionId);
    db.prepare(
      `UPDATE script_sections SET ${sets.join(", ")} WHERE id = ?`
    ).run(...values);
  }

  return getSection(sectionId)!;
}

export function updateDialogueLine(
  lineId: string,
  data: Partial<{ lineText: string; audioPath: string; timestampsJson: string }>
): void {
  const columnMap: Record<string, string> = {
    lineText: "line_text",
    audioPath: "audio_path",
    timestampsJson: "timestamps_json",
  };

  const sets: string[] = [];
  const values: any[] = [];

  for (const [key, col] of Object.entries(columnMap)) {
    if ((data as any)[key] !== undefined) {
      sets.push(`${col} = ?`);
      values.push((data as any)[key]);
    }
  }

  if (sets.length > 0) {
    values.push(lineId);
    db.prepare(
      `UPDATE dialogue_lines SET ${sets.join(", ")} WHERE id = ?`
    ).run(...values);
  }
}

function getSection(sectionId: string): ScriptSection | null {
  const s = db
    .prepare(`SELECT * FROM script_sections WHERE id = ?`)
    .get(sectionId) as any;
  if (!s) return null;

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
  };
}
