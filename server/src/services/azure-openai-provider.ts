import type {
  TextImageProvider,
  ImageSize,
  GenerateImageOptions,
  GenerateStructuredOptions,
} from "./text-image-provider.js";
import { withAiRetries } from "./ai-retry.js";
import { currentDebug, logAiCall } from "./debug-logger.js";

const TEXT_DEPLOYMENT = process.env.AZURE_OPENAI_TEXT_DEPLOYMENT ?? "gpt-5";
const FAST_TEXT_DEPLOYMENT = process.env.AZURE_OPENAI_FAST_TEXT_DEPLOYMENT ?? TEXT_DEPLOYMENT;
const IMAGE_DEPLOYMENT = process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT ?? "gpt-image-1.5";
const TEXT_API_VERSION = "2024-12-01-preview";
const IMAGE_API_VERSION = "2025-04-01-preview";

function supportsTemperature(deployment: string): boolean {
  return !/^gpt-5(?:[.-]|$)/i.test(deployment.trim());
}

function normalizeAzureTextContent(
  content: string | Array<{ text?: string }> | undefined,
): string | undefined {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const joined = content.map((part) => part.text ?? "").join("").trim();
    return joined || undefined;
  }
  return undefined;
}

function extractJsonPayload(text: string): string {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const objectStart = trimmed.indexOf("{");
  const arrayStart = trimmed.indexOf("[");
  const hasObject = objectStart >= 0;
  const hasArray = arrayStart >= 0;
  const start = hasObject && hasArray
    ? Math.min(objectStart, arrayStart)
    : hasObject
      ? objectStart
      : arrayStart;
  const end = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));

  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

export class AzureOpenAIProvider implements TextImageProvider {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey?: string, endpoint?: string) {
    this.apiKey = apiKey ?? process.env.AZURE_OPENAI_API_KEY ?? "";
    this.endpoint = (endpoint ?? process.env.AZURE_OPENAI_ENDPOINT ?? "").replace(/\/+$/, "");
    if (!this.apiKey) throw new Error("AZURE_OPENAI_API_KEY is required");
    if (!this.endpoint) throw new Error("AZURE_OPENAI_ENDPOINT is required");
  }

  private async requestText(
    prompt: string,
    options: GenerateStructuredOptions & { systemPrompt?: string } = {},
  ): Promise<string> {
    const started = Date.now();
    const ctx = currentDebug();
    const modelKind = options.model ?? "pro";
    const deployment = modelKind === "flash" ? FAST_TEXT_DEPLOYMENT : TEXT_DEPLOYMENT;
    const kind = modelKind === "flash" ? "textFast" : "text";
    const url = `${this.endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${TEXT_API_VERSION}`;
    const messages: { role: string; content: string }[] = [];
    if (options.systemPrompt) messages.push({ role: "system", content: options.systemPrompt });
    messages.push({ role: "user", content: prompt });

    try {
      const text = await withAiRetries(`Azure OpenAI ${kind}`, async () => {
        const requestBody: Record<string, unknown> = { messages };
        if (options.temperature !== undefined && supportsTemperature(deployment)) {
          requestBody.temperature = options.temperature;
        }

        const res = await fetch(url, {
          method: "POST",
          headers: { "api-key": this.apiKey, "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const body = await res.text();
          throw Object.assign(new Error(`Azure OpenAI text error ${res.status}: ${body}`), { status: res.status });
        }

        const data = (await res.json()) as {
          choices?: { message?: { content?: string | Array<{ text?: string }> } }[];
        };
        const responseText = normalizeAzureTextContent(data.choices?.[0]?.message?.content);
        if (!responseText) throw new Error("Azure OpenAI returned no text content");
        return responseText;
      });

      if (ctx) {
        logAiCall({
          ts: new Date().toISOString(),
          projectId: ctx.projectId,
          stage: ctx.stage,
          kind,
          model: deployment,
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
          model: deployment,
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
    schema: unknown,
    options: GenerateStructuredOptions = {},
  ): Promise<T> {
    const schemaText = JSON.stringify(schema, null, 2);
    const systemPrompt = [
      options.systemPrompt?.trim(),
      "Return only valid JSON. Do not use markdown fences, commentary, or trailing notes.",
      `Match this JSON schema exactly:\n${schemaText}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const text = await this.requestText(prompt, {
      ...options,
      systemPrompt,
    });

    try {
      return JSON.parse(extractJsonPayload(text)) as T;
    } catch (err) {
      throw new Error(`Azure OpenAI returned invalid JSON: ${(err as Error).message}`);
    }
  }

  async generateImage(prompt: string, size?: ImageSize, _options?: GenerateImageOptions): Promise<Buffer> {
    const started = Date.now();
    const ctx = currentDebug();
    const url = `${this.endpoint}/openai/deployments/${IMAGE_DEPLOYMENT}/images/generations?api-version=${IMAGE_API_VERSION}`;

    try {
      const buffer = await withAiRetries("Azure OpenAI image", async () => {
        const res = await fetch(url, {
          method: "POST",
          headers: { "api-key": this.apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            size: size ?? "1024x1024",
            n: 1,
            output_format: "png",
          }),
        });

        if (!res.ok) {
          const body = await res.text();
          throw Object.assign(new Error(`Azure OpenAI image error ${res.status}: ${body}`), { status: res.status });
        }

        const data = (await res.json()) as {
          data?: { b64_json?: string }[];
        };
        const b64 = data.data?.[0]?.b64_json;
        if (!b64) throw new Error("Azure OpenAI returned no image data");
        return Buffer.from(b64, "base64");
      });

      if (ctx) {
        logAiCall({
          ts: new Date().toISOString(),
          projectId: ctx.projectId,
          stage: ctx.stage,
          kind: "image",
          model: IMAGE_DEPLOYMENT,
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
          model: IMAGE_DEPLOYMENT,
          prompt,
          error: (err as Error).message,
          elapsedMs: Date.now() - started,
        });
      }
      throw err;
    }
  }
}
