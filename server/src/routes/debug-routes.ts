import { Hono } from "hono";
import { readAiLog } from "../services/debug-logger.js";

const debugRoutes = new Hono();

debugRoutes.get("/ai-log/:projectId", (c) => {
  const projectId = c.req.param("projectId");
  const since = Number(c.req.query("since") ?? 0);
  const { entries, nextOffset } = readAiLog(projectId, isFinite(since) ? since : 0);
  return c.json({ entries, nextOffset });
});

export { debugRoutes };
