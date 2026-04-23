import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type {
  ElevenLabsServiceInterface,
  SpeechGenerationOptions,
  Voice,
  WordTimestamp,
} from "../types.js";
import { withAiRetries } from "./ai-retry.js";
import { currentDebug, logAiCall } from "./debug-logger.js";

async function streamToBuffer(
  stream: ReadableStream | NodeJS.ReadableStream
): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function normalizePromptText(text?: string): string | undefined {
  const normalized = text?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function buildInstrumentalMusicPrompt(prompt: string): string {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  const guardrail = "Instrumental soundtrack only. No lyrics. No sung vocals. No choir. No chanting. No spoken words.";
  if (!normalized) return guardrail;
  return `${normalized}${/[.!?]$/.test(normalized) ? "" : "."} ${guardrail}`;
}

export class ElevenLabsService implements ElevenLabsServiceInterface {
  private client: ElevenLabsClient;
  private apiKey: string;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.ELEVENLABS_API_KEY;
    if (!key) throw new Error("ELEVENLABS_API_KEY is required");
    this.apiKey = key;
    this.client = new ElevenLabsClient({ apiKey: key });
  }

  async generateSpeech(
    text: string,
    voiceId: string,
    options: SpeechGenerationOptions = {},
  ): Promise<{ audio: Buffer; timestamps?: WordTimestamp[] }> {
    const started = Date.now();
    const ctx = currentDebug();
    const modelId = "eleven_v3";
    const previousText = normalizePromptText(options.previousText);
    const nextText = normalizePromptText(options.nextText);
    const continuityContextIgnored = Boolean(previousText || nextText);
    const request = {
      text,
      modelId,
      ...(options.voiceSettings ? { voiceSettings: options.voiceSettings } : {}),
    };

    try {
      const response = await withAiRetries("ElevenLabs speech", async () =>
        this.client.textToSpeech.convertWithTimestamps(
          voiceId,
          request
        )
      );

      const audio = Buffer.from(response.audioBase64, "base64");
      let timestamps: WordTimestamp[] | undefined;

      const alignment = response.normalizedAlignment ?? response.alignment;
      if (alignment) {
        timestamps = this.extractWordTimestamps(alignment);
      }

      if (ctx) {
        logAiCall({
          ts: new Date().toISOString(),
          projectId: ctx.projectId,
          stage: ctx.stage,
          kind: "speech",
          model: "eleven_v3",
          prompt: JSON.stringify({
            voiceId,
            text,
            voiceSettings: options.voiceSettings,
            previousText,
            nextText,
          }),
          response: JSON.stringify({
            voiceId,
            timestamps: timestamps?.length ?? 0,
            voiceSettingsApplied: Boolean(options.voiceSettings),
            continuityContextIgnored,
          }),
          responseBytes: audio.byteLength,
          elapsedMs: Date.now() - started,
        });
      }

      return { audio, timestamps };
    } catch (err) {
      if (ctx) {
        logAiCall({
          ts: new Date().toISOString(),
          projectId: ctx.projectId,
          stage: ctx.stage,
          kind: "speech",
          model: "eleven_v3",
          prompt: JSON.stringify({
            voiceId,
            text,
            voiceSettings: options.voiceSettings,
            previousText,
            nextText,
          }),
          error: (err as Error).message,
          elapsedMs: Date.now() - started,
        });
      }
      throw err;
    }
  }

  async generateMusic(prompt: string, durationMs: number): Promise<Buffer> {
    const started = Date.now();
    const ctx = currentDebug();
    const normalizedPrompt = buildInstrumentalMusicPrompt(prompt);
    try {
      const buffer = await withAiRetries("ElevenLabs music", async () => {
        const stream = await this.client.music.compose({
          prompt: normalizedPrompt,
          musicLengthMs: durationMs,
        });
        return streamToBuffer(stream);
      });
      if (ctx) {
        logAiCall({
          ts: new Date().toISOString(),
          projectId: ctx.projectId,
          stage: ctx.stage,
          kind: "music",
          model: "elevenlabs.music.compose",
          prompt: `durationMs=${durationMs}\n${normalizedPrompt}`,
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
          kind: "music",
          model: "elevenlabs.music.compose",
          prompt: `durationMs=${durationMs}\n${normalizedPrompt}`,
          error: (err as Error).message,
          elapsedMs: Date.now() - started,
        });
      }
      throw err;
    }
  }

  async generateSoundEffect(
    prompt: string,
    durationSeconds: number
  ): Promise<Buffer> {
    const started = Date.now();
    const ctx = currentDebug();
    try {
      const buffer = await withAiRetries("ElevenLabs sound generation", async () => {
        const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
          method: "POST",
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: prompt,
            duration_seconds: durationSeconds,
            prompt_influence: 0.7,
          }),
        });
        if (!res.ok) {
          throw Object.assign(new Error(`ElevenLabs sound generation failed: ${res.status}`), { status: res.status });
        }
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
      });
      if (ctx) {
        logAiCall({
          ts: new Date().toISOString(),
          projectId: ctx.projectId,
          stage: ctx.stage,
          kind: "soundEffect",
          model: "elevenlabs.sound-generation",
          prompt: `durationSeconds=${durationSeconds}\n${prompt}`,
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
          kind: "soundEffect",
          model: "elevenlabs.sound-generation",
          prompt: `durationSeconds=${durationSeconds}\n${prompt}`,
          error: (err as Error).message,
          elapsedMs: Date.now() - started,
        });
      }
      throw err;
    }
  }

  /**
   * Designs a custom voice from a natural-language prompt, materializes it
   * into the user library, and returns the new voiceId plus a preview audio clip.
   */
  async designVoice(
    voiceName: string,
    voiceDescription: string,
  ): Promise<{ voiceId: string; voiceName: string; previewAudio: Buffer }> {
    const started = Date.now();
    const ctx = currentDebug();
    try {
      const designed = await withAiRetries("ElevenLabs voice design", async () =>
        this.client.textToVoice.design({
          voiceDescription,
          modelId: "eleven_ttv_v3",
          autoGenerateText: true,
        })
      );

      const preview = designed.previews?.[0];
      if (!preview) {
        throw new Error("ElevenLabs did not return any voice previews");
      }

      const created = await withAiRetries("ElevenLabs voice create", async () =>
        this.client.textToVoice.create({
          voiceName,
          voiceDescription,
          generatedVoiceId: preview.generatedVoiceId,
        })
      );

      const previewAudio = Buffer.from(preview.audioBase64, "base64");
      if (ctx) {
        logAiCall({
          ts: new Date().toISOString(),
          projectId: ctx.projectId,
          stage: ctx.stage,
          kind: "voiceDesign",
          model: "eleven_ttv_v3",
          prompt: `voiceName=${voiceName}\n${voiceDescription}`,
          response: JSON.stringify({
            voiceId: created.voiceId,
            voiceName: created.name ?? voiceName,
          }),
          responseBytes: previewAudio.byteLength,
          elapsedMs: Date.now() - started,
        });
      }

      return {
        voiceId: created.voiceId,
        voiceName: created.name ?? voiceName,
        previewAudio,
      };
    } catch (err) {
      if (ctx) {
        logAiCall({
          ts: new Date().toISOString(),
          projectId: ctx.projectId,
          stage: ctx.stage,
          kind: "voiceDesign",
          model: "eleven_ttv_v3",
          prompt: `voiceName=${voiceName}\n${voiceDescription}`,
          error: (err as Error).message,
          elapsedMs: Date.now() - started,
        });
      }
      throw err;
    }
  }

  async listVoices(): Promise<Voice[]> {
    const response = await withAiRetries("ElevenLabs list voices", async () =>
      this.client.voices.getAll()
    );
    return response.voices.map((v) => ({
      voiceId: v.voiceId,
      name: v.name ?? "Unknown",
      previewUrl: v.previewUrl ?? undefined,
    }));
  }

  private extractWordTimestamps(
    alignment: {
      characters: string[];
      characterStartTimesSeconds: number[];
      characterEndTimesSeconds: number[];
    }
  ): WordTimestamp[] {
    const { characters, characterStartTimesSeconds, characterEndTimesSeconds } =
      alignment;
    const words: WordTimestamp[] = [];
    let currentWord = "";
    let wordStart = -1;
    let wordEnd = -1;

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      if (char === " " || char === "\n" || char === "\t") {
        if (currentWord) {
          words.push({
            word: currentWord,
            startMs: Math.round(wordStart * 1000),
            endMs: Math.round(wordEnd * 1000),
          });
          currentWord = "";
          wordStart = -1;
          wordEnd = -1;
        }
      } else {
        if (wordStart < 0) wordStart = characterStartTimesSeconds[i];
        wordEnd = characterEndTimesSeconds[i];
        currentWord += char;
      }
    }

    if (currentWord) {
      words.push({
        word: currentWord,
        startMs: Math.round(wordStart * 1000),
        endMs: Math.round(wordEnd * 1000),
      });
    }

    return words;
  }
}
