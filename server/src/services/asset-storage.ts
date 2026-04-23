import { mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = resolve(__dirname, "..", "..", "assets");

const imagesDir = resolve(assetsDir, "images");
const audioDir = resolve(assetsDir, "audio");
const compositionsDir = resolve(assetsDir, "compositions");

mkdirSync(imagesDir, { recursive: true });
mkdirSync(audioDir, { recursive: true });
mkdirSync(compositionsDir, { recursive: true });

export function getAssetsDir(): string {
  return assetsDir;
}

export function saveImage(buffer: Buffer, extension = "png"): string {
  const filename = `${uuidv4()}.${extension}`;
  const relativePath = `images/${filename}`;
  writeFileSync(resolve(assetsDir, relativePath), buffer);
  return relativePath;
}

export function saveAudio(buffer: Buffer, extension = "mp3"): string {
  const filename = `${uuidv4()}.${extension}`;
  const relativePath = `audio/${filename}`;
  writeFileSync(resolve(assetsDir, relativePath), buffer);
  return relativePath;
}

export function saveHtml(content: string): string {
  const filename = `${uuidv4()}.html`;
  const relativePath = `compositions/${filename}`;
  writeFileSync(resolve(assetsDir, relativePath), content, "utf-8");
  return relativePath;
}
