import { Hono } from "hono";
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
} from "../repositories/project-repository.js";
import { invalidateCharacterPromptsByProjectId } from "../repositories/character-repository.js";
import { invalidateLocationPromptsByProjectId } from "../repositories/location-repository.js";
import type { StoryBrief } from "../types.js";

const projectRoutes = new Hono();

projectRoutes.get("/", (c) => {
  const projects = listProjects();
  return c.json(projects);
});

projectRoutes.post("/", async (c) => {
  const body = await c.req.json<{ name: string; mode: "ai" | "manual"; prompt?: string }>();
  const project = createProject(body.name, body.mode, body.prompt);
  return c.json(project, 201);
});

projectRoutes.get("/:id", (c) => {
  const id = c.req.param("id");
  const project = getProject(id);
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  return c.json(project);
});

projectRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<Partial<{ name: string; prompt: string; brief: StoryBrief }>>();
  const project = updateProject(id, body);
  const premiseChanged = body.brief?.premise !== undefined;
  const promptChanged = body.prompt !== undefined;
  if (premiseChanged || promptChanged) {
    invalidateCharacterPromptsByProjectId(id);
    invalidateLocationPromptsByProjectId(id);
  }
  return c.json(project);
});

export { projectRoutes };
