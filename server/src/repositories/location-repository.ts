import { v4 as uuidv4 } from "uuid";
import db from "../db.js";
import type { Location } from "../types.js";

export function addLocation(
  projectId: string,
  name: string,
  description: string,
  prompts?: { imagePrompt?: string },
): Location {
  const id = uuidv4();
  db.prepare(
    `INSERT INTO locations (id, project_id, name, description, image_prompt) VALUES (?, ?, ?, ?, ?)`
  ).run(id, projectId, name, description, prompts?.imagePrompt ?? null);

  return { id, name, description, imagePrompt: prompts?.imagePrompt };
}

export function updateLocation(
  id: string,
  data: Partial<{ name: string; description: string; imagePrompt: string | null; imagePath: string }>
): Location {
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
  if (data.imagePath !== undefined) {
    sets.push("image_path = ?");
    values.push(data.imagePath);
  }

  if (sets.length > 0) {
    values.push(id);
    db.prepare(`UPDATE locations SET ${sets.join(", ")} WHERE id = ?`).run(
      ...values
    );
  }

  return getLocation(id)!;
}

export function deleteLocation(id: string): void {
  db.prepare(`DELETE FROM locations WHERE id = ?`).run(id);
}

export function getLocationsByProjectId(projectId: string): Location[] {
  const rows = db
    .prepare(`SELECT * FROM locations WHERE project_id = ?`)
    .all(projectId) as any[];

  return rows.map((l) => ({
    id: l.id,
    name: l.name,
    description: l.description ?? "",
    imagePrompt: l.image_prompt ?? undefined,
    imagePath: l.image_path ?? undefined,
  }));
}

export function getLocation(id: string): Location | null {
  const row = db
    .prepare(`SELECT * FROM locations WHERE id = ?`)
    .get(id) as any;
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    imagePrompt: row.image_prompt ?? undefined,
    imagePath: row.image_path ?? undefined,
  };
}

export function invalidateLocationPromptsByProjectId(projectId: string): void {
  db.prepare(`UPDATE locations SET image_prompt = NULL WHERE project_id = ?`).run(projectId);
}
