import { Hono } from "hono";
import { getScriptByProjectId, updateScriptSection, updateDialogueLine } from "../repositories/script-repository.js";
import { getCharactersByProjectId } from "../repositories/character-repository.js";
import { getProject } from "../repositories/project-repository.js";
import { elevenLabsService } from "../services/providers.js";
import { saveAudio } from "../services/asset-storage.js";
import { runWithDebug, withStage } from "../services/debug-logger.js";
import type { SpeechGenerationOptions, SpeechVoiceSettings } from "../types.js";

const DEFAULT_NARRATOR_VOICE_ID = process.env.ELEVENLABS_NARRATOR_VOICE_ID?.trim() || "21m00Tcm4TlvDq8ikWAM";

function normalizeSpeechContextText(text?: string): string | undefined {
  const normalized = text?.replace(/\s+/g, " ").trim();
  if (!normalized) return undefined;
  if (normalized.length <= 220) return normalized;
  return `${normalized.slice(0, 217).trimEnd()}...`;
}

function buildSpeechVoiceSettings(text: string | undefined, mode: "narrator" | "dialogue"): SpeechVoiceSettings {
  const normalized = normalizeSpeechContextText(text)?.toLowerCase() ?? "";
  const intense = /[!¡]|\b(run|hurry|now|danger|panic|fear|attack|crash|storm|explosion|quake|rescue|corre|rápido|ahora|peligro|pánico|miedo|ataque|choque|tormenta|explosión|temblor|rescate)\b/i.test(normalized);
  const tender = /\b(whisper|gently|softly|quiet|tears|sorry|love|hope|secret|gentle|tender|susurra|suave|silencio|lágrimas|perdón|amor|esperanza|secreto|ternura)\b/i.test(normalized);
  const suspense = /\b(dark|shadow|watching|lurking|unknown|ominous|mystery|secret|echo|oscuro|sombra|acecha|misterio|amenaza|eco)\b/i.test(normalized);

  const base = mode === "narrator"
    ? { stability: 0.46, similarityBoost: 0.78, style: 0.42, speed: 0.98, useSpeakerBoost: true }
    : { stability: 0.34, similarityBoost: 0.84, style: 0.58, speed: 1.0, useSpeakerBoost: true };

  if (intense) {
    return {
      ...base,
      stability: mode === "narrator" ? 0.31 : 0.24,
      style: mode === "narrator" ? 0.7 : 0.78,
      speed: mode === "narrator" ? 1.01 : 1.05,
    };
  }

  if (tender) {
    return {
      ...base,
      stability: mode === "narrator" ? 0.5 : 0.4,
      style: mode === "narrator" ? 0.48 : 0.55,
      speed: mode === "narrator" ? 0.93 : 0.95,
    };
  }

  if (suspense) {
    return {
      ...base,
      stability: mode === "narrator" ? 0.39 : 0.31,
      style: mode === "narrator" ? 0.62 : 0.68,
      speed: mode === "narrator" ? 0.95 : 0.97,
    };
  }

  if (/\?/.test(normalized) && mode === "dialogue") {
    return {
      ...base,
      style: 0.64,
      speed: 1.02,
    };
  }

  return base;
}

function buildSpeechOptions(
  text: string | undefined,
  mode: "narrator" | "dialogue",
  previousText?: string,
  nextText?: string,
): SpeechGenerationOptions {
  return {
    voiceSettings: buildSpeechVoiceSettings(text, mode),
    previousText: normalizeSpeechContextText(previousText),
    nextText: normalizeSpeechContextText(nextText),
  };
}

const audioRoutes = new Hono();

audioRoutes.post("/:id/generate-audio", async (c) => {
  const projectId = c.req.param("id");
  return runWithDebug({ projectId, stage: "audio" }, async () => {
    const project = getProject(projectId);
    const script = getScriptByProjectId(projectId);
    if (!script) {
      return c.json({ error: "No script found for this project" }, 404);
    }

    const narratorEnabled = project?.brief?.narratorEnabled !== false;
  const narratorVoiceId = DEFAULT_NARRATOR_VOICE_ID;

    const characters = getCharactersByProjectId(projectId);
    const voiceMap = new Map<string, string>();
    for (const ch of characters) {
      if (ch.voiceId) {
        voiceMap.set(ch.id, ch.voiceId);
      }
    }
    const musicPathByCue = new Map<string, string>();
    const narratorTexts = script.sections.map((section) => normalizeSpeechContextText(section.narratorText));

    for (const [sectionIndex, section] of script.sections.entries()) {
      // Narrator audio
      const narratorText = section.narratorText;
      if (narratorEnabled && narratorText) {
        const previousNarratorText = narratorTexts.slice(0, sectionIndex).reverse().find(Boolean);
        const nextNarratorText = narratorTexts.slice(sectionIndex + 1).find(Boolean);
        const { audio, timestamps } = await withStage(`audio.narrator.section${section.sectionOrder}`, () =>
          elevenLabsService.generateSpeech(
            narratorText,
            narratorVoiceId,
            buildSpeechOptions(narratorText, "narrator", previousNarratorText, nextNarratorText)
          )
        );
        const narratorAudioPath = saveAudio(audio);
        updateScriptSection(section.id, {
          narratorAudioPath,
          narratorTimestampsJson: timestamps ? JSON.stringify(timestamps) : undefined,
        });
      }

      // Dialogue audio
      for (const [lineIndex, line] of section.dialogueLines.entries()) {
        const configuredVoiceId = voiceMap.get(line.characterId);
        const voiceId = configuredVoiceId ?? narratorVoiceId;
        if (!configuredVoiceId) {
          console.warn(
            `[audio] character ${line.characterId} has no voiceId; falling back to narrator voice ${narratorVoiceId}`
          );
        }
        try {
          const previousLineText = section.dialogueLines[lineIndex - 1]?.lineText;
          const nextLineText = section.dialogueLines[lineIndex + 1]?.lineText;
          const { audio, timestamps } = await withStage(`audio.dialogue.section${section.sectionOrder}.line${line.lineOrder}`, () =>
            elevenLabsService.generateSpeech(
              line.lineText,
              voiceId,
              buildSpeechOptions(line.lineText, "dialogue", previousLineText, nextLineText)
            )
          );
          const audioPath = saveAudio(audio);
          updateDialogueLine(line.id, {
            audioPath,
            timestampsJson: timestamps ? JSON.stringify(timestamps) : undefined,
          });
        } catch (err) {
          console.warn(
            `[audio] dialogue TTS failed for line ${line.id}: ${(err as Error)?.message ?? err}`
          );
        }
      }

      // Music
      if (section.musicCue) {
        const normalizedCue = section.musicCue.trim();
        let musicAudioPath = musicPathByCue.get(normalizedCue);
        if (!musicAudioPath) {
          const musicBuffer = await withStage(`audio.music.section${section.sectionOrder}`, () =>
            elevenLabsService.generateMusic(normalizedCue, 30000)
          );
          musicAudioPath = saveAudio(musicBuffer);
          musicPathByCue.set(normalizedCue, musicAudioPath);
        }
        updateScriptSection(section.id, { musicAudioPath });
      }

      // Sound effects
      const soundEffectCue = section.soundEffectCue;
      if (soundEffectCue) {
        const sfxBuffer = await withStage(`audio.sfx.section${section.sectionOrder}`, () =>
          elevenLabsService.generateSoundEffect(soundEffectCue, 5)
        );
        const sfxAudioPath = saveAudio(sfxBuffer);
        updateScriptSection(section.id, { sfxAudioPath });
      }
    }

    const updatedScript = getScriptByProjectId(projectId);
    return c.json(updatedScript);
  });
});

export { audioRoutes };
