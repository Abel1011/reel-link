import { GoogleGenAI, createPartFromBase64, createPartFromText, type Schema } from "@google/genai";
import type { TextImageProvider, ImageSize, GenerateImageOptions } from "./text-image-provider.js";
import { withAiRetries } from "./ai-retry.js";
import { currentDebug, logAiCall } from "./debug-logger.js";

// Latest Gemini 3.x preview models (verified April 2026 at https://ai.google.dev/gemini-api/docs/models)
// NOTE: gemini-3-pro-preview was shut down 2026-03-09; the current Pro is 3.1-pro-preview.
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.1-pro-preview";
const FAST_TEXT_MODEL = process.env.GEMINI_TEXT_FAST_MODEL || "gemini-3-flash-preview";
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview";

function imageSizeToAspectRatio(size?: ImageSize): "1:1" | "16:9" | "9:16" | undefined {
  switch (size) {
    case "1024x1024":
      return "1:1";
    case "1024x1792":
      return "9:16";
    case "1792x1024":
      return "16:9";
    default:
      return undefined;
  }
}

export class GeminiProvider implements TextImageProvider {
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is required");
    this.ai = new GoogleGenAI({ apiKey: key });
  }

  private async requestText(
    prompt: string,
    options: {
      systemPrompt?: string;
      model?: "pro" | "flash";
      responseMimeType?: string;
      responseSchema?: Schema;
      temperature?: number;
    } = {},
  ): Promise<string> {
    const started = Date.now();
    const ctx = currentDebug();
    const modelKind = options.model ?? "pro";
    const model = modelKind === "flash" ? FAST_TEXT_MODEL : TEXT_MODEL;
    const kind = modelKind === "flash" ? "textFast" : "text";
    const config: {
      systemInstruction?: string;
      responseMimeType?: string;
      responseSchema?: Schema;
      temperature?: number;
    } = {};
    if (options.systemPrompt) config.systemInstruction = options.systemPrompt;
    if (options.responseMimeType) config.responseMimeType = options.responseMimeType;
    if (options.responseSchema) config.responseSchema = options.responseSchema;
    if (options.temperature !== undefined) config.temperature = options.temperature;

    try {
      const response = await withAiRetries(`Gemini ${kind}`, async () =>
        this.ai.models.generateContent({
          model,
          contents: prompt,
          config: Object.keys(config).length > 0 ? config : undefined,
        })
      );
      const text = response.text;
      if (!text) throw new Error("Gemini returned no text");
      if (ctx) {
        logAiCall({
          ts: new Date().toISOString(),
          projectId: ctx.projectId,
          stage: ctx.stage,
          kind,
          model,
          systemPrompt: options.systemPrompt,
          prompt,
          response: text,
          responseBytes: Buffer.byteLength(text, "utf-8"),
          elapsedMs: Date.now() - started,
        });
      }
      return text;
    } catch (err) {
      if (ctx) {
        logAiCall({
          ts: new Date().toISOString(),
          projectId: ctx.projectId,
          stage: ctx.stage,
          kind,
          model,
          systemPrompt: options.systemPrompt,
          prompt,
          error: (err as Error).message,
          elapsedMs: Date.now() - started,
        });
      }
      throw err;
    }
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    return this.requestText(prompt, { systemPrompt, model: "pro" });
  }

  async generateTextFast(prompt: string, systemPrompt?: string): Promise<string> {
    return this.requestText(prompt, { systemPrompt, model: "flash" });
  }

  async generateStructured<T>(
    prompt: string,
    schema: Schema,
    options: {
      systemPrompt?: string;
      model?: "pro" | "flash";
      temperature?: number;
    } = {},
  ): Promise<T> {
    const text = await this.requestText(prompt, {
      systemPrompt: options.systemPrompt,
      model: options.model,
      temperature: options.temperature,
      responseMimeType: "application/json",
      responseSchema: schema,
    });

    try {
      return JSON.parse(text) as T;
    } catch (err) {
      throw new Error(`Gemini returned invalid JSON: ${(err as Error).message}`);
    }
  }

  async generateImage(prompt: string, size?: ImageSize, options: GenerateImageOptions = {}): Promise<Buffer> {
    const started = Date.now();
    const ctx = currentDebug();
    try {
      const aspectRatio = imageSizeToAspectRatio(size);
      const contents = [
        createPartFromText(prompt),
        ...(options.references ?? []).flatMap((reference: NonNullable<GenerateImageOptions["references"]>[number]) => [
          createPartFromText(
            reference.label
              ? `Character reference: ${reference.label}. Preserve this character's identity, face, silhouette, palette, costume, and distinguishing visual cues in the generated frame.`
              : "Use this reference image to preserve the character's identity and appearance in the generated frame.",
          ),
          createPartFromBase64(reference.data.toString("base64"), reference.mimeType),
        ]),
      ];

      const response = await withAiRetries("Gemini image", async () =>
        this.ai.models.generateContent({
          model: IMAGE_MODEL,
          contents,
          config: {
            responseModalities: ["IMAGE"],
            imageConfig: aspectRatio
              ? {
                  aspectRatio,
                  imageSize: "1K",
                }
              : undefined,
          },
        })
      );

      const parts = response.candidates?.[0]?.content?.parts;
      const imagePart = parts?.find((p) => p.inlineData?.data);
      if (!imagePart?.inlineData?.data) {
        throw new Error("Gemini returned no image data");
      }
      const buffer = Buffer.from(imagePart.inlineData.data, "base64");
      if (ctx) {
        logAiCall({
          ts: new Date().toISOString(),
          projectId: ctx.projectId,
          stage: ctx.stage,
          kind: "image",
          model: IMAGE_MODEL,
          prompt,
          responseBytes: buffer.byteLength,
          elapsedMs: Date.now() - started,
        });
      }
      return buffer;
    } catch (err) {
      if (ctx) {
        logAiCall({
          ts: new Date().toISOString(),
          projectId: ctx.projectId,
          stage: ctx.stage,
          kind: "image",
          model: IMAGE_MODEL,
          prompt,
          error: (err as Error).message,
          elapsedMs: Date.now() - started,
        });
      }
      throw err;
    }
  }
}
