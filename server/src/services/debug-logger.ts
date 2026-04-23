import { AsyncLocalStorage } from "node:async_hooks";
import { mkdirSync, appendFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = resolve(__dirname, "..", "..", "logs");
mkdirSync(LOGS_DIR, { recursive: true });

export interface DebugContext {
  projectId?: string;
  stage?: string;
}

export interface AiLogEntry {
  ts: string;
  projectId?: string;
  stage?: string;
  kind: "text" | "textFast" | "image" | "speech" | "music" | "soundEffect" | "voiceDesign";
  model: string;
  systemPrompt?: string;
  prompt: string;
  response?: string;
  responseBytes?: number;
  error?: string;
  elapsedMs: number;
}

const storage = new AsyncLocalStorage<DebugContext>();

export function runWithDebug<T>(ctx: DebugContext, fn: () => Promise<T>): Promise<T> {
  return storage.run(ctx, fn);
}

export function withStage<T>(stage: string, fn: () => Promise<T>): Promise<T> {
  const prev = storage.getStore();
  return storage.run({ ...(prev ?? {}), stage }, fn);
}

export function currentDebug(): DebugContext | undefined {
  return storage.getStore();
}

function logFileFor(projectId?: string): string {
  const id = projectId ?? "global";
  return resolve(LOGS_DIR, `ai-debug-${id}.jsonl`);
}

export function logAiCall(entry: AiLogEntry): void {
  const line = JSON.stringify(entry) + "\n";
  try {
    appendFileSync(logFileFor(entry.projectId), line);
  } catch (e) {
    console.error("[debug-logger] failed to write:", (e as Error).message);
  }
}

/** Read all JSONL entries for a project. Returns them parsed. */
export function readAiLog(projectId: string, sinceBytes = 0): { entries: AiLogEntry[]; nextOffset: number } {
  const file = logFileFor(projectId);
  if (!existsSync(file)) return { entries: [], nextOffset: 0 };
  const content = readFileSync(file);
  const safeOffset = Math.max(0, Math.min(sinceBytes, content.byteLength));
  const slice = content.subarray(safeOffset).toString("utf-8");
  const entries: AiLogEntry[] = [];
  for (const line of slice.split("\n")) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line));
    } catch {
      // ignore malformed lines
    }
  }
  return { entries, nextOffset: content.byteLength };
}
