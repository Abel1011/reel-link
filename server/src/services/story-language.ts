import type { StoryProject } from "../types.js";

const FALLBACK_LANGUAGE = "the same language as the original story idea";

const SPANISH_MARKERS = [
  " el ",
  " la ",
  " los ",
  " las ",
  " una ",
  " un ",
  " que ",
  " de ",
  " y ",
  " en ",
  " con ",
  " para ",
  " mientras ",
  " descubre ",
  " viaja ",
  " historia ",
];

const ENGLISH_MARKERS = [
  " the ",
  " a ",
  " an ",
  " and ",
  " in ",
  " with ",
  " while ",
  " discovers ",
  " travels ",
  " story ",
  " space ",
  " robot ",
];

function normalizeText(text?: string): string {
  return ` ${text ?? ""}`.replace(/\s+/g, " ").toLowerCase().trimEnd() + " ";
}

function countMarkers(text: string, markers: string[]): number {
  return markers.reduce((total, marker) => total + (text.includes(marker) ? 1 : 0), 0);
}

export function inferStoryLanguageLabel(...samples: Array<string | undefined>): string {
  const text = normalizeText(samples.filter(Boolean).join(" "));
  if (!text.trim()) return FALLBACK_LANGUAGE;

  const spanishScore = countMarkers(text, SPANISH_MARKERS) + (/[\u00c0-\u017f¿¡]/.test(text) ? 2 : 0);
  const englishScore = countMarkers(text, ENGLISH_MARKERS);

  if (spanishScore > englishScore) return "Spanish";
  if (englishScore > spanishScore) return "English";
  return FALLBACK_LANGUAGE;
}

export function inferProjectStoryLanguage(project: Pick<StoryProject, "prompt" | "brief">): string {
  return inferStoryLanguageLabel(project.prompt, project.brief?.premise);
}

export function buildSameLanguageInstruction(languageLabel: string, scope: string): string {
  if (languageLabel === FALLBACK_LANGUAGE) {
    return `Use the exact same language as the original story idea for ${scope}. Do not mix languages.`;
  }

  return `Use ${languageLabel} for ${scope}. Do not mix languages or translate any part of the output into another language.`;
}