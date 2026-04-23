import type { Hono } from "hono";
import { projectRoutes } from "./project-routes.js";
import { styleRoutes } from "./style-routes.js";
import { characterRoutes } from "./character-routes.js";
import { locationRoutes } from "./location-routes.js";
import { scriptRoutes } from "./script-routes.js";
import { audioRoutes } from "./audio-routes.js";
import { videoRoutes } from "./video-routes.js";
import { aiModeRoutes } from "./ai-mode-routes.js";
import { debugRoutes } from "./debug-routes.js";

export function registerRoutes(app: Hono): void {
  app.route("/api/projects", projectRoutes);
  app.route("/api", styleRoutes);
  app.route("/api/projects/:id/characters", characterRoutes);
  app.route("/api/projects/:id/locations", locationRoutes);
  app.route("/api/projects", scriptRoutes);
  app.route("/api/projects", audioRoutes);
  app.route("/api/projects", videoRoutes);
  app.route("/api/projects", aiModeRoutes);
  app.route("/api/debug", debugRoutes);
}
