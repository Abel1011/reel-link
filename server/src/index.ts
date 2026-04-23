import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import "dotenv/config";
import { registerRoutes } from "./routes/index.js";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = new Hono();

app.use("*", cors());

app.use(
  "/assets/*",
  serveStatic({
    root: "./assets",
    rewriteRequestPath: (path) => path.replace("/assets", ""),
  })
);

app.get("/api/health", (c) => c.json({ status: "ok" }));

registerRoutes(app);

// In production, serve the client build from ../client/dist
const clientDist = resolve(__dirname, "..", "..", "client", "dist");
if (existsSync(clientDist)) {
  app.use(
    "/*",
    serveStatic({
      root: clientDist,
      rewriteRequestPath: (path) => path,
    })
  );
  // SPA fallback: serve index.html for any non-API, non-asset route
  app.get("*", async (c) => {
    const indexPath = resolve(clientDist, "index.html");
    if (existsSync(indexPath)) {
      const { readFileSync } = await import("fs");
      return c.html(readFileSync(indexPath, "utf-8"));
    }
    return c.notFound();
  });
}

const port = Number(process.env.PORT) || 3001;
console.log(`Server running on http://localhost:${port}`);
const server = serve({ fetch: app.fetch, port });

// Video generation can exceed Node's default long-request thresholds.
if ("requestTimeout" in server) {
  server.requestTimeout = 0;
}
if ("headersTimeout" in server) {
  server.headersTimeout = 0;
}
if ("setTimeout" in server) {
  server.setTimeout(0);
}
