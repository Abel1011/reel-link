import { v4 as uuidv4 } from "uuid";
import db from "../db.js";
import type { StyleConfig } from "../types.js";

export function saveStyle(
  projectId: string,
  style: Omit<StyleConfig, "id"> & { id?: string }
): StyleConfig {
  const id = style.id ?? uuidv4();

  db.prepare(`DELETE FROM styles WHERE project_id = ?`).run(projectId);

  db.prepare(
    `INSERT INTO styles (id, project_id, visual_style, artistic_medium, color_palette, lighting, mood, preset_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    projectId,
    style.visualStyle,
    style.artisticMedium,
    style.colorPalette,
    style.lighting,
    style.mood,
    style.presetName ?? null
  );

  return {
    id,
    visualStyle: style.visualStyle,
    artisticMedium: style.artisticMedium,
    colorPalette: style.colorPalette,
    lighting: style.lighting,
    mood: style.mood,
    presetName: style.presetName,
  };
}

export function getStyleByProjectId(projectId: string): StyleConfig | null {
  const row = db
    .prepare(`SELECT * FROM styles WHERE project_id = ?`)
    .get(projectId) as any;
  if (!row) return null;

  return {
    id: row.id,
    visualStyle: row.visual_style ?? "",
    artisticMedium: row.artistic_medium ?? "",
    colorPalette: row.color_palette ?? "",
    lighting: row.lighting ?? "",
    mood: row.mood ?? "",
    presetName: row.preset_name ?? undefined,
  };
}
