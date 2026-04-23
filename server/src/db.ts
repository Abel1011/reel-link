import Database, { type Database as DatabaseType } from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbDir = resolve(__dirname, "..", "data");
const dbPath = resolve(dbDir, "stories.db");

mkdirSync(dbDir, { recursive: true });

const db: DatabaseType = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('ai', 'manual')),
  prompt TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS styles (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  visual_style TEXT,
  artistic_medium TEXT,
  color_palette TEXT,
  lighting TEXT,
  mood TEXT,
  preset_name TEXT
);

CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_prompt TEXT,
  portrait_path TEXT,
  voice_prompt TEXT,
  voice_id TEXT,
  voice_name TEXT,
  voice_preview_url TEXT
);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_prompt TEXT,
  image_path TEXT
);

CREATE TABLE IF NOT EXISTS scripts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS script_sections (
  id TEXT PRIMARY KEY,
  script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  section_order INTEGER NOT NULL,
  location_id TEXT REFERENCES locations(id),
  narrator_text TEXT,
  music_cue TEXT,
  sound_effect_cue TEXT,
  narrator_audio_path TEXT,
  narrator_timestamps_json TEXT,
  music_audio_path TEXT,
  sfx_audio_path TEXT
);

CREATE TABLE IF NOT EXISTS dialogue_lines (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES script_sections(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES characters(id),
  line_text TEXT NOT NULL,
  line_order INTEGER NOT NULL,
  audio_path TEXT,
  timestamps_json TEXT
);

CREATE TABLE IF NOT EXISTS image_layers (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES script_sections(id) ON DELETE CASCADE,
  layer_type TEXT NOT NULL CHECK(layer_type IN ('background', 'character', 'overlay')),
  layer_order INTEGER NOT NULL,
  image_path TEXT,
  position_x REAL DEFAULT 0,
  position_y REAL DEFAULT 0,
  scale REAL DEFAULT 1.0,
  description TEXT
);

CREATE TABLE IF NOT EXISTS compositions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  html_path TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Non-destructive migrations for existing databases
try {
  db.exec(`ALTER TABLE characters ADD COLUMN voice_preview_url TEXT`);
} catch {
  // column already exists
}

const derivedPromptColumns: Array<[string, string, string]> = [
  ["characters", "image_prompt", "TEXT"],
  ["characters", "voice_prompt", "TEXT"],
  ["locations", "image_prompt", "TEXT"],
];
for (const [table, col, type] of derivedPromptColumns) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
  } catch {
    // column already exists
  }
}

// Story brief columns
const briefColumns: Array<[string, string]> = [
  ["premise", "TEXT"],
  ["tone", "TEXT"],
  ["length_preset", "TEXT"],
  ["orientation", "TEXT"],
  ["subtitles_enabled", "INTEGER"],
  ["narrator_enabled", "INTEGER"],
];
for (const [col, type] of briefColumns) {
  try {
    db.exec(`ALTER TABLE projects ADD COLUMN ${col} ${type}`);
  } catch {
    // column already exists
  }
}

try {
  db.exec(`ALTER TABLE script_sections ADD COLUMN narrator_timestamps_json TEXT`);
} catch {
  // column already exists
}

export default db;