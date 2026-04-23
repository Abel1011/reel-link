import { v4 as uuidv4 } from "uuid";
import db from "../db.js";
import type { Composition } from "../types.js";

export function saveComposition(
  projectId: string,
  htmlPath: string
): Composition {
  const id = uuidv4();

  db.prepare(`DELETE FROM compositions WHERE project_id = ?`).run(projectId);

  db.prepare(
    `INSERT INTO compositions (id, project_id, html_path) VALUES (?, ?, ?)`
  ).run(id, projectId, htmlPath);

  return getCompositionByProjectId(projectId)!;
}

export function getCompositionByProjectId(
  projectId: string
): Composition | null {
  const row = db
    .prepare(`SELECT * FROM compositions WHERE project_id = ?`)
    .get(projectId) as any;
  if (!row) return null;

  return {
    id: row.id,
    htmlPath: row.html_path,
    createdAt: row.created_at,
  };
}
