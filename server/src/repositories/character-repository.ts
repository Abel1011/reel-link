import { v4 as uuidv4 } from "uuid";
import db from "../db.js";
import type { Character } from "../types.js";

export function addCharacter(
  projectId: string,
  name: string,
  description: string,
  prompts?: { imagePrompt?: string; voicePrompt?: string },
): Character {
  const id = uuidv4();
  db.prepare(
    `INSERT INTO characters (id, project_id, name, description, image_prompt, voice_prompt) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, projectId, name, description, prompts?.imagePrompt ?? null, prompts?.voicePrompt ?? null);

  return {
    id,
    name,
    description,
    imagePrompt: prompts?.imagePrompt,
    voicePrompt: prompts?.voicePrompt,
  };
}

export function updateCharacter(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    imagePrompt: string | null;
    portraitPath: string;
    voicePrompt: string | null;
    voiceId: string;
    voiceName: string;
    voicePreviewUrl: string;
  }>
): Character {
  const sets: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    sets.push("name = ?");
    values.push(data.name);
  }
  if (data.description !== undefined) {
    sets.push("description = ?");
    values.push(data.description);
  }
  if (data.imagePrompt !== undefined) {
    sets.push("image_prompt = ?");
    values.push(data.imagePrompt);
  }
  if (data.portraitPath !== undefined) {
    sets.push("portrait_path = ?");
    values.push(data.portraitPath);
  }
  if (data.voicePrompt !== undefined) {
    sets.push("voice_prompt = ?");
    values.push(data.voicePrompt);
  }
  if (data.voiceId !== undefined) {
    sets.push("voice_id = ?");
    values.push(data.voiceId);
  }
  if (data.voiceName !== undefined) {
    sets.push("voice_name = ?");
    values.push(data.voiceName);
  }
  if (data.voicePreviewUrl !== undefined) {
    sets.push("voice_preview_url = ?");
    values.push(data.voicePreviewUrl);
  }

  if (sets.length > 0) {
    values.push(id);
    db.prepare(`UPDATE characters SET ${sets.join(", ")} WHERE id = ?`).run(
      ...values
    );
  }

  return getCharacter(id)!;
}

export function deleteCharacter(id: string): void {
  db.prepare(`DELETE FROM characters WHERE id = ?`).run(id);
}

export function getCharactersByProjectId(projectId: string): Character[] {
  const rows = db
    .prepare(`SELECT * FROM characters WHERE project_id = ?`)
    .all(projectId) as any[];

  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description ?? "",
    imagePrompt: c.image_prompt ?? undefined,
    portraitPath: c.portrait_path ?? undefined,
    voicePrompt: c.voice_prompt ?? undefined,
    voiceId: c.voice_id ?? undefined,
    voiceName: c.voice_name ?? undefined,
    voicePreviewUrl: c.voice_preview_url ?? undefined,
  }));
}

export function getCharacter(id: string): Character | null {
  const row = db
    .prepare(`SELECT * FROM characters WHERE id = ?`)
    .get(id) as any;
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    imagePrompt: row.image_prompt ?? undefined,
    portraitPath: row.portrait_path ?? undefined,
    voicePrompt: row.voice_prompt ?? undefined,
    voiceId: row.voice_id ?? undefined,
    voiceName: row.voice_name ?? undefined,
    voicePreviewUrl: row.voice_preview_url ?? undefined,
  };
}

export function invalidateCharacterPromptsByProjectId(projectId: string): void {
  db.prepare(
    `UPDATE characters SET image_prompt = NULL, voice_prompt = NULL WHERE project_id = ?`
  ).run(projectId);
}
