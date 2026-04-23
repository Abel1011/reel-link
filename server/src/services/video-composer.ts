import type {
  AssetManifest,
  DialogueLine,
  ScriptSection,
  StoryProject,
  StoryTone,
  WordTimestamp,
} from "../types.js";
import type { DirectedShot, DirectedVideoPlan } from "./video-direction.js";

export interface CompositionSize {
  width: number;
  height: number;
  aspect: string;
}

interface TimedDialogueLine {
  line: DialogueLine;
  speakerName: string;
  speakerPortrait?: string;
  start: number;
  duration: number;
  timestamps: WordTimestamp[];
}

export interface CaptionSegment {
  id: string;
  label?: string;
  start: number;
  duration: number;
  words: string[];
  tone: "narrator" | "dialogue";
}

export interface UiOverlayPlan {
  id: string;
  kind: "meta" | "beat" | "badge" | "title";
  start: number;
  duration: number;
  trackIndex: number;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  badges?: string[];
}

export interface AudioPlan {
  id: string;
  src: string;
  start: number;
  duration: number;
  trackIndex: number;
  volume: number;
}

export interface RuntimeBubbleLine {
  text: string;
  side: "left" | "right";
  variant?: "shout";
  start?: number;
  duration?: number;
}

export interface ScenePlan {
  kind: "kenBurns" | "dialogue" | "heroPose";
  at: number;
  duration: number;
  trackBase: number;
  label: string;
  backdrop: string;
  image?: string;
  headline?: string;
  caption?: string;
  leftImage?: string;
  rightImage?: string;
  leftCaption?: string;
  rightCaption?: string;
  lines?: RuntimeBubbleLine[];
  sfx?: string;
  rain?: boolean;
  /** Layout variant for dialogue scenes: "split" | "overShoulder" | "stacked" | "closeupSwap". */
  variant?: string;
}

export interface TimelineSection {
  section: ScriptSection;
  scenes: ScenePlan[];
  overlays: UiOverlayPlan[];
  captions: CaptionSegment[];
  audioPlans: AudioPlan[];
}

interface GroupingOptions {
  maxWords: number;
  maxChars: number;
  maxDurationMs: number;
}

function toAssetUrl(path?: string): string | undefined {
  if (!path) return undefined;
  return path.startsWith("/assets/") ? path : `/assets/${path}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/<\//g, "<\\/");
}

function formatSeconds(value: number): string {
  return value.toFixed(2);
}

function normalizeText(text?: string): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function sentenceExcerpt(text: string, maxWords: number, maxChars = 82): string {
  const clean = normalizeText(text);
  if (!clean) return "";
  const firstSentence = clean.split(/(?<=[.!?])\s+/)[0] ?? clean;
  const words = firstSentence.split(" ");
  const clippedWords = words.slice(0, maxWords);
  let clipped = clippedWords.join(" ");
  if (words.length > maxWords) clipped += "...";
  if (clipped.length > maxChars) {
    clipped = `${clipped.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
  }
  return clipped;
}

function headlineFromSection(section: ScriptSection, fallback: string): string {
  const narrator = normalizeText(section.narratorText);
  if (narrator) {
    return sentenceExcerpt(narrator, 7, 54).replace(/\.$/, "");
  }
  const firstLine = normalizeText(section.dialogueLines[0]?.lineText);
  if (firstLine) {
    return sentenceExcerpt(firstLine, 6, 48).replace(/\.$/, "");
  }
  return fallback;
}

function captionFromSection(section: ScriptSection, fallback: string): string {
  const firstDialogue = section.dialogueLines[0];
  if (firstDialogue) {
    return `${sentenceExcerpt(firstDialogue.lineText, 10, 72)}${firstDialogue.lineText.endsWith("!") ? "" : ""}`;
  }
  return sentenceExcerpt(section.narratorText ?? fallback, 13, 84);
}

function fxLabelFromCue(cue?: string): string | undefined {
  if (!cue) return undefined;
  // Only surface the big yellow SFX burst when the cue contains an explicit
  // comic-book onomatopoeia written dramatically (ALL CAPS and/or ending with
  // "!"). Describing a sound that is already audible (wind, footsteps,
  // telegraph clicks, "the crunch of boots"…) clutters the frame without
  // adding anything — the user can hear it.
  // Examples that should match: "BAM!", "KABOOM", "WHOOSH!!".
  // Examples that must NOT match: "whip-crack of a rope", "the crunch of footsteps".
  const onomatopoeiaVocabulary = [
    "BAM","BOOM","CRACK","CRASH","POW","WHAM","ZAP","SMASH","THUD","THWACK",
    "CLANG","SNAP","CRUNCH","KABOOM","WHOOSH","SLASH","SPLAT","THUNK","BANG",
    "PING","CLINK","RATTLE","RUMBLE","KAPOW","KERPLUNK","ZOOM","ZOOOOM","WHIZ",
    "SWOOSH","FWIP","FWOOSH","CLICK","BEEP","HONK",
  ];
  const pattern = new RegExp(`\\b(${onomatopoeiaVocabulary.join("|")})!+`, "");
  const exclamatoryMatch = cue.match(pattern);
  if (exclamatoryMatch) {
    return exclamatoryMatch[1].toUpperCase() + "!";
  }
  // Allow ALL-CAPS standalone usage ("a KABOOM echoed") without an exclamation.
  const allCapsPattern = new RegExp(`\\b(${onomatopoeiaVocabulary.join("|")})\\b`);
  const capsMatch = cue.match(allCapsPattern);
  if (capsMatch && capsMatch[1] === capsMatch[1].toUpperCase()) {
    // Guard against accidental matches on normal words that happened to be
    // capitalised at the start of a sentence — require the raw match to be
    // fully uppercase in the source string (i.e. not the result of our own
    // case-insensitive normalisation).
    const rawMatch = cue.match(new RegExp(`(${onomatopoeiaVocabulary.join("|")})`));
    if (rawMatch && rawMatch[0] === rawMatch[0].toUpperCase() && rawMatch[0].length >= 3) {
      return rawMatch[0].toUpperCase();
    }
  }
  return undefined;
}

function backdropForTone(tone: StoryTone | undefined, highEnergy: boolean, dramaticBeat: boolean): string {
  if (highEnergy) return "cyber";
  if (dramaticBeat) return "storm";
  switch (tone) {
    case "whimsical":
      return "dawn";
    case "heroic":
      return "sunset";
    case "melancholic":
      return "melancholy";
    case "funny":
      return "paper";
    case "mysterious":
      return "night";
    case "dramatic":
      return "storm";
    default:
      return "night";
  }
}

function accentColorForTone(tone: StoryTone | undefined): string {
  switch (tone) {
    case "whimsical":
      return "#7de7c7";
    case "heroic":
      return "#ffd36a";
    case "melancholic":
      return "#9fd9ff";
    case "funny":
      return "#ff9a7a";
    case "mysterious":
      return "#bcb3ff";
    case "dramatic":
      return "#ff7a59";
    default:
      return "#ffd36a";
  }
}

function ambientGlowForTone(tone: StoryTone | undefined): string {
  switch (tone) {
    case "whimsical":
      return "rgba(125, 231, 199, 0.22)";
    case "heroic":
      return "rgba(255, 211, 106, 0.24)";
    case "melancholic":
      return "rgba(159, 217, 255, 0.22)";
    case "funny":
      return "rgba(255, 154, 122, 0.22)";
    case "mysterious":
      return "rgba(188, 179, 255, 0.2)";
    case "dramatic":
      return "rgba(255, 122, 89, 0.26)";
    default:
      return "rgba(255, 211, 106, 0.18)";
  }
}

function estimatedDurationFromText(text?: string): number {
  const wordCount = normalizeText(text).split(" ").filter(Boolean).length;
  if (!wordCount) return 0;
  return Math.max(1.2, wordCount * 0.34);
}

function estimatedWordTimestamps(text: string, duration: number): WordTimestamp[] {
  const words = normalizeText(text).split(" ").filter(Boolean);
  if (words.length === 0) return [];

  const durationMs = Math.max(700, Math.round((duration || estimatedDurationFromText(text)) * 1000));
  const weights = words.map((word) => {
    const letters = word.replace(/[^\p{L}\p{N}]+/gu, "");
    let weight = Math.max(1, letters.length || word.length);
    if (/[,:;]$/.test(word)) weight += 1;
    if (/[.!?]$/.test(word)) weight += 2;
    return weight;
  });
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = 0;

  return words.map((word, index) => {
    const slice = (durationMs * weights[index]) / totalWeight;
    const startMs = Math.round(cursor);
    cursor += slice;
    const endMs = index === words.length - 1 ? durationMs : Math.round(cursor);
    return {
      word,
      startMs,
      endMs: Math.max(startMs + 120, endMs),
    };
  });
}

function normalizedWordTimestamps(
  text: string | undefined,
  timestamps: WordTimestamp[] | undefined,
  duration: number,
): WordTimestamp[] {
  if (timestamps && timestamps.length > 0) return timestamps;
  return estimatedWordTimestamps(text ?? "", duration);
}

function groupWordTimestamps(words: WordTimestamp[], options: GroupingOptions): WordTimestamp[][] {
  const groups: WordTimestamp[][] = [];
  let current: WordTimestamp[] = [];
  let currentChars = 0;

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    current.push(word);
    currentChars += word.word.length + (current.length > 1 ? 1 : 0);

    const startMs = current[0]?.startMs ?? 0;
    const endMs = current[current.length - 1]?.endMs ?? startMs;
    const durationMs = endMs - startMs;
    const atBoundary = /[.!?;:]$/.test(word.word);
    const nextWord = words[index + 1];

    const shouldBreak =
      atBoundary ||
      current.length >= options.maxWords ||
      currentChars >= options.maxChars ||
      durationMs >= options.maxDurationMs ||
      !nextWord;

    if (shouldBreak) {
      groups.push(current);
      current = [];
      currentChars = 0;
    }
  }

  if (current.length > 0) groups.push(current);
  return groups;
}

function splitWordsIntoLines(words: string[]): string[][] {
  if (words.length <= 2) return [words];
  if (words.length === 3) return [words.slice(0, 2), words.slice(2)];
  const pivot = Math.ceil(words.length / 2);
  return [words.slice(0, pivot), words.slice(pivot)];
}

function buildCaptionSegments(
  sectionId: string,
  sectionStart: number,
  narratorWords: WordTimestamp[],
): CaptionSegment[] {
  const segments: CaptionSegment[] = [];

  const narratorGroups = groupWordTimestamps(narratorWords, {
    maxWords: 4,
    maxChars: 24,
    maxDurationMs: 1500,
  });
  narratorGroups.forEach((group, index) => {
    const start = sectionStart + group[0].startMs / 1000;
    const end = sectionStart + group[group.length - 1].endMs / 1000;
    segments.push({
      id: `${sectionId}-n-${index}`,
      start,
      duration: Math.max(0.36, end - start),
      words: group.map((entry) => entry.word),
      tone: "narrator",
    });
  });

  return segments.sort((left, right) => left.start - right.start);
}

function uniqueSpeakerIds(section: ScriptSection): string[] {
  const ids: string[] = [];
  for (const line of section.dialogueLines) {
    if (!ids.includes(line.characterId)) ids.push(line.characterId);
  }
  return ids;
}

function findFirstImage(section: ScriptSection, layerType?: "background" | "character"): string | undefined {
  const layer = section.imageLayers.find((item) => (layerType ? item.layerType === layerType : true) && item.imagePath);
  return layer?.imagePath;
}

function pickSceneKind(
  section: ScriptSection,
  narratorDuration: number,
  speakerIds: string[],
  tone: StoryTone | undefined,
  isFinalBeat: boolean,
): ScenePlan["kind"] {
  const sceneText = normalizeText(
    [
      section.narratorText,
      section.musicCue,
      section.soundEffectCue,
      ...section.dialogueLines.map((line) => line.lineText),
    ].join(" "),
  ).toLowerCase();

  const feelsHeroic =
    isFinalBeat ||
    tone === "heroic" ||
    /(hero|victory|triumph|together|brave|rescue|climax|save|legend)/.test(sceneText);
  const feelsKinetic = /(impact|crash|roar|rush|panic|charge|slam|burst|chaos|quake)/.test(sceneText);
  // Prefer the dialogue preset whenever the section has a genuine back-and-forth
  // (2+ distinct speakers, 2+ lines). The narrator and the dialogue play
  // sequentially, not simultaneously, so a leading narrator line should not
  // disqualify the dialogue scene — otherwise every dialogue section falls back
  // to a single-character heroPose.
  const canUseDialoguePreset = speakerIds.length >= 2 && section.dialogueLines.length >= 2;

  if (canUseDialoguePreset) return "dialogue";
  if (feelsHeroic || feelsKinetic) return "heroPose";
  return "kenBurns";
}

function buildDialogueRuntimeLines(timedLines: TimedDialogueLine[], speakerOrder: string[]): RuntimeBubbleLine[] {
  const sideBySpeakerId = new Map<string, "left" | "right">();
  speakerOrder.forEach((speakerId, index) => {
    sideBySpeakerId.set(speakerId, index % 2 === 0 ? "left" : "right");
  });

  return timedLines.flatMap((entry) => {
    const side = sideBySpeakerId.get(entry.line.characterId) ?? "left";
    const groups = groupWordTimestamps(entry.timestamps, {
      maxWords: 8,
      maxChars: 54,
      maxDurationMs: 2200,
    });

    return groups.map((group) => {
      const text = normalizeText(group.map((word) => word.word).join(" "));
      const start = entry.start + group[0].startMs / 1000;
      const end = entry.start + group[group.length - 1].endMs / 1000;

      return {
        text,
        side,
        start,
        duration: Math.max(0.34, end - start),
        ...(/[!¡]/.test(text) ? { variant: "shout" as const } : {}),
      };
    }).filter((segment) => Boolean(segment.text));
  });
}

function rebaseDialogueRuntimeLines(
  lines: RuntimeBubbleLine[] | undefined,
  windowStart: number,
  windowDuration: number,
): RuntimeBubbleLine[] | undefined {
  if (!lines || lines.length === 0) return undefined;

  const windowEnd = windowStart + windowDuration;
  const rebased: RuntimeBubbleLine[] = [];

  lines.forEach((line) => {
    const start = line.start ?? windowStart;
    const end = start + (line.duration ?? 0.9);
    const clippedStart = Math.max(windowStart, start);
    const clippedEnd = Math.min(windowEnd, end);
    if (clippedEnd <= clippedStart) return;

    rebased.push({
      ...line,
      start: Math.max(0, clippedStart - windowStart),
      duration: Math.max(0.24, clippedEnd - clippedStart),
    });
  });

  return rebased.length > 0 ? rebased : undefined;
}

function hasRainAtmosphere(...values: Array<string | undefined>): boolean {
  const sceneText = normalizeText(values.filter(Boolean).join(" ")).toLowerCase();
  if (!sceneText) return false;
  return /(rain|storm|downpour|drizzle|puddle|thunder|lightning|aguacero|lluvia|diluvio|tormenta|charco|trueno|relampago)/.test(sceneText);
}

function hasWeatherResetCue(...values: Array<string | undefined>): boolean {
  const sceneText = normalizeText(values.filter(Boolean).join(" ")).toLowerCase();
  if (!sceneText) return false;
  return /(clear sky|sunlight returns|storm passes|storm passed|rain stops|dry street|clear weather|sun breaks through|cielo despejado|sale el sol|escampa|deja de llover|tormenta termina|lluvia cesa|calle seca)/.test(sceneText);
}

function inferSectionStormStates(
  project: StoryProject,
  locationsById: Map<string, StoryProject["locations"][number]>,
): boolean[] {
  const sections = project.script?.sections ?? [];
  const states: boolean[] = [];
  let previousStormActive = false;
  let previousLocationId: string | undefined;

  for (const section of sections) {
    const location = section.locationId ? locationsById.get(section.locationId) : undefined;
    const locationWeatherText = [location?.name, location?.description, location?.imagePrompt];
    const sectionWeatherText = [
      section.narratorText,
      section.soundEffectCue,
      section.musicCue,
      ...section.dialogueLines.map((line) => line.lineText),
      ...locationWeatherText,
    ];
    const directStorm = hasRainAtmosphere(...sectionWeatherText);
    const resetStorm = hasWeatherResetCue(...sectionWeatherText);
    const sameLocation = Boolean(section.locationId && section.locationId === previousLocationId);
    const stormActive: boolean = directStorm || (!resetStorm && previousStormActive && sameLocation);
    states.push(stormActive);
    previousStormActive = stormActive;
    previousLocationId = section.locationId;
  }

  return states;
}

function allocateShotDurations(totalDuration: number, shots: DirectedShot[]): number[] {
  if (shots.length <= 1) return [Math.max(0.9, totalDuration)];

  const count = shots.length;
  const minDuration = Math.min(1.1, totalDuration / count);
  const totalWeight = shots.reduce((sum, shot) => sum + Math.max(1, shot.emphasis), 0);
  const distributable = Math.max(0, totalDuration - minDuration * count);
  let cursor = 0;

  return shots.map((shot, index) => {
    if (index === shots.length - 1) {
      return Math.max(0.6, totalDuration - cursor);
    }
    const weighted = distributable * (Math.max(1, shot.emphasis) / totalWeight);
    const duration = minDuration + weighted;
    cursor += duration;
    return duration;
  });
}

function splitDialogueLinesIntoShotChunks(
  timedLines: TimedDialogueLine[],
  totalDialogueShots: number,
): TimedDialogueLine[][] {
  if (timedLines.length === 0) return [];
  if (totalDialogueShots <= 1) return [timedLines];

  const chunkSize = Math.max(1, Math.ceil(timedLines.length / totalDialogueShots));
  return Array.from({ length: totalDialogueShots }, (_, shotIndex) => {
    const start = Math.min(timedLines.length - 1, shotIndex * chunkSize);
    const end = Math.min(timedLines.length, start + chunkSize);
    const subset = timedLines.slice(start, end);
    return subset.length > 0 ? subset : timedLines.slice(-1);
  });
}

function pickDialogueLinesForShot(
  timedLines: TimedDialogueLine[],
  speakerOrder: string[],
  shotIndex: number,
  totalDialogueShots: number,
): ScenePlan["lines"] {
  if (timedLines.length === 0) return [];
  const chunks = splitDialogueLinesIntoShotChunks(timedLines, totalDialogueShots);
  const subset = chunks[shotIndex] ?? timedLines;
  return buildDialogueRuntimeLines(subset.length > 0 ? subset : timedLines, speakerOrder);
}

function findCharacterLayerImage(section: ScriptSection, occurrence = 0): string | undefined {
  const layers = section.imageLayers.filter((layer) => layer.layerType === "character" && layer.imagePath);
  return layers[occurrence]?.imagePath;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectCharacterIdFromSceneText(
  text: string,
  characters: StoryProject["characters"],
): string | undefined {
  const sceneText = normalizeText(text).toLowerCase();
  if (!sceneText) return undefined;

  let bestMatch: { id: string; score: number } | undefined;
  let secondBestScore = 0;

  for (const character of characters) {
    const normalizedName = normalizeText(character.name).toLowerCase();
    const aliases = Array.from(new Set([
      normalizedName,
      ...normalizedName.split(/\s+/).filter((token) => token.length > 2),
    ]));

    const score = aliases.reduce((total, alias) => {
      if (!alias) return total;
      const matcher = new RegExp(`(^|\\W)${escapeRegExp(alias)}(?=$|\\W)`, "g");
      const matches = sceneText.match(matcher);
      return total + (matches?.length ?? 0) * Math.max(alias.length, 3);
    }, 0);

    if (score <= 0) continue;

    if (!bestMatch || score > bestMatch.score) {
      secondBestScore = bestMatch?.score ?? 0;
      bestMatch = { id: character.id, score };
      continue;
    }

    if (score > secondBestScore) secondBestScore = score;
  }

  if (!bestMatch) return undefined;
  if (secondBestScore > 0 && bestMatch.score === secondBestScore) return undefined;
  return bestMatch.id;
}

function inferSceneFocusCharacterId(
  shot: DirectedShot,
  section: ScriptSection,
  characters: StoryProject["characters"],
  allTimedDialogueLines: TimedDialogueLine[],
  speakerIds: string[],
  firstSpeaker: TimedDialogueLine | undefined,
  secondSpeaker: TimedDialogueLine | undefined,
  dialogueLinesForScene?: TimedDialogueLine[],
): string | undefined {
  const explicitIds = [shot.leftCharacterId, shot.rightCharacterId]
    .filter((characterId): characterId is string => Boolean(characterId));

  if (shot.imageStrategy === "reuse-secondary") {
    if (explicitIds.length > 1) return explicitIds[1];
    if (explicitIds.length === 1) return explicitIds[0];
  }

  if (explicitIds.length > 0) return explicitIds[0];

  const effectiveLines = dialogueLinesForScene && dialogueLinesForScene.length > 0
    ? dialogueLinesForScene
    : allTimedDialogueLines;
  const firstDialogueSpeakerId = effectiveLines[0]?.line.characterId;
  const alternateDialogueSpeakerId = effectiveLines.find((line) => line.line.characterId !== firstDialogueSpeakerId)?.line.characterId;

  if (shot.imageStrategy === "reuse-secondary" && alternateDialogueSpeakerId) {
    return alternateDialogueSpeakerId;
  }

  if (firstDialogueSpeakerId) return firstDialogueSpeakerId;

  const sceneText = [
    shot.headline,
    shot.caption,
    shot.sfxLabel,
    shot.rationale,
    section.narratorText,
    ...section.dialogueLines.map((line) => line.lineText),
  ]
    .filter(Boolean)
    .join(" ");
  const mentionedCharacterId = detectCharacterIdFromSceneText(sceneText, characters);
  if (mentionedCharacterId) return mentionedCharacterId;

  if (shot.imageStrategy === "reuse-secondary") {
    return secondSpeaker?.line.characterId ?? speakerIds[1] ?? firstSpeaker?.line.characterId ?? speakerIds[0];
  }

  return firstSpeaker?.line.characterId ?? speakerIds[0];
}

function distinctSpeakerIdsForTimedLines(timedLines: TimedDialogueLine[]): string[] {
  return Array.from(
    new Set(
      timedLines
        .map((entry) => entry.line.characterId)
        .filter((speakerId): speakerId is string => Boolean(speakerId)),
    ),
  );
}

function findDialogueLinesOverlappingWindow(
  timedLines: TimedDialogueLine[],
  start: number,
  end: number,
): TimedDialogueLine[] {
  return timedLines.filter((entry) => entry.start < end && entry.start + entry.duration > start);
}

function dialogueCoverageDuration(
  timedLines: TimedDialogueLine[],
  start: number,
  end: number,
): number {
  return timedLines.reduce((total, entry) => {
    const overlapStart = Math.max(start, entry.start);
    const overlapEnd = Math.min(end, entry.start + entry.duration);
    return overlapEnd > overlapStart ? total + (overlapEnd - overlapStart) : total;
  }, 0);
}

function resolveShotImage(
  shot: DirectedShot,
  backgroundImage: string | undefined,
  leadImage: string | undefined,
  secondaryImage: string | undefined,
  focusImage: string | undefined,
  preferFocusImage = false,
): string | undefined {
  if (preferFocusImage && focusImage) return toAssetUrl(focusImage);
  if (shot.imagePath) return toAssetUrl(shot.imagePath);

  switch (shot.imageStrategy) {
    case "reuse-lead":
      return toAssetUrl(focusImage ?? leadImage ?? backgroundImage);
    case "reuse-secondary":
      return toAssetUrl(focusImage ?? secondaryImage ?? leadImage ?? backgroundImage);
    case "generate":
      return toAssetUrl(shot.imagePath ?? focusImage ?? backgroundImage ?? leadImage);
    default:
      return toAssetUrl(backgroundImage ?? focusImage ?? leadImage ?? secondaryImage);
  }
}

function buildScenePlans(
  project: StoryProject,
  section: ScriptSection,
  sectionIndex: number,
  sectionStart: number,
  sectionDuration: number,
  narratorDuration: number,
  speakerIds: string[],
  timedDialogueLines: TimedDialogueLine[],
  directionShots: DirectedShot[] | undefined,
  characterNameById: Map<string, string>,
  characterPortraitById: Map<string, string>,
  ambientStormActive: boolean,
): ScenePlan[] {
  const backgroundImage = findFirstImage(section, "background") ?? findFirstImage(section);
  const leadCharacterImage = findCharacterLayerImage(section, 0) ?? backgroundImage;
  const secondaryCharacterImage = findCharacterLayerImage(section, 1) ?? leadCharacterImage ?? backgroundImage;
  const firstSpeaker = timedDialogueLines[0];
  const secondSpeaker = timedDialogueLines.find((line) => line.line.characterId !== firstSpeaker?.line.characterId);
  const isFinalBeat = project.script ? sectionIndex === project.script.sections.length - 1 : false;
  // Rotate through dialogue layout variants so every conversation doesn't look
  // identical. Order picked to alternate energy: default split → over-shoulder →
  // stacked (energetic/diagonal) → close-up swap.
  const DIALOGUE_VARIANTS = ["split", "overShoulder", "stacked", "closeupSwap"] as const;
  const dialogueVariant = DIALOGUE_VARIANTS[sectionIndex % DIALOGUE_VARIANTS.length];
  const sceneText = normalizeText(
    [
      section.narratorText,
      section.soundEffectCue,
      ...section.dialogueLines.map((line) => line.lineText),
    ].join(" "),
  ).toLowerCase();

  const createSceneFromShot = (
    shot: DirectedShot,
    shotOrder: number,
    at: number,
    duration: number,
    localStart: number,
    dialogueLinesForScene?: TimedDialogueLine[],
  ): ScenePlan => {
    const effectiveDialogueLines = dialogueLinesForScene && dialogueLinesForScene.length > 0
      ? dialogueLinesForScene
      : findDialogueLinesOverlappingWindow(timedDialogueLines, localStart, localStart + duration);
    const activeSpeakerIds = distinctSpeakerIdsForTimedLines(effectiveDialogueLines);
    const dialogueCoverage = dialogueCoverageDuration(effectiveDialogueLines, localStart, localStart + duration);
    const shotSpeakerIds = [shot.leftCharacterId, shot.rightCharacterId].filter(
      (speakerId): speakerId is string => Boolean(speakerId),
    );
    const focusCharacterId = inferSceneFocusCharacterId(
      shot,
      section,
      project.characters,
      timedDialogueLines,
      speakerIds,
      firstSpeaker,
      secondSpeaker,
      effectiveDialogueLines,
    );
    const focusCharacterImage = focusCharacterId
      ? characterPortraitById.get(focusCharacterId)
      : undefined;
    const shouldForceSpeakerReference = effectiveDialogueLines.length > 0
      && Boolean(focusCharacterImage)
      && !activeSpeakerIds.some((speakerId) => shotSpeakerIds.includes(speakerId));
    const rain = ambientStormActive || hasRainAtmosphere(
      section.narratorText,
      section.soundEffectCue,
      section.musicCue,
      shot.headline,
      shot.caption,
      shot.sfxLabel,
      shot.rationale,
      ...section.dialogueLines.map((line) => line.lineText),
    );
    const bubbleSpeakerOrder = shotSpeakerIds.length > 0
      ? shotSpeakerIds
      : activeSpeakerIds.length > 0
        ? activeSpeakerIds
        : focusCharacterId
          ? [focusCharacterId]
          : speakerIds;
    const bubbleLines = effectiveDialogueLines.length > 0
      ? rebaseDialogueRuntimeLines(
        buildDialogueRuntimeLines(effectiveDialogueLines, bubbleSpeakerOrder),
        localStart,
        duration,
      )
      : undefined;
    const scene: ScenePlan = {
      kind: shot.kind,
      at,
      duration,
      trackBase: 200 + sectionIndex * 200 + shotOrder * 20,
      label: `Scene ${sectionIndex + 1}${String.fromCharCode(65 + shotOrder)}`,
      backdrop: backdropForTone(
        project.brief?.tone,
        shot.kind === "heroPose" || ambientStormActive,
        ambientStormActive || shot.kind === "heroPose" || /(storm|panic|collapse|impact|secret|fear|dark)/.test(sceneText),
      ),
      rain,
    };

    if (
      shot.kind === "dialogue"
      || (
        effectiveDialogueLines.length > 1
        && activeSpeakerIds.length > 1
        && dialogueCoverage >= Math.min(1.1, duration * 0.45)
      )
    ) {
      const leftSpeakerId = shot.leftCharacterId ?? firstSpeaker?.line.characterId ?? speakerIds[0];
      const fallbackLeftSpeakerId = activeSpeakerIds[0] ?? leftSpeakerId;
      const fallbackRightSpeakerId = activeSpeakerIds.find((speakerId) => speakerId !== fallbackLeftSpeakerId)
        ?? shot.rightCharacterId
        ?? secondSpeaker?.line.characterId
        ?? speakerIds[1]
        ?? fallbackLeftSpeakerId;
      const resolvedLeftSpeakerId = shot.leftCharacterId ?? fallbackLeftSpeakerId;
      const resolvedRightSpeakerId = fallbackRightSpeakerId;
      if (!resolvedLeftSpeakerId || !resolvedRightSpeakerId || resolvedLeftSpeakerId === resolvedRightSpeakerId) {
        scene.kind = "heroPose";
        scene.image = resolveShotImage(
          shot,
          backgroundImage,
          leadCharacterImage,
          secondaryCharacterImage,
          focusCharacterImage,
          shouldForceSpeakerReference,
        );
        scene.lines = bubbleLines;
        scene.sfx = shot.sfxLabel || fxLabelFromCue(section.soundEffectCue);
        return scene;
      }

      scene.kind = "dialogue";
      scene.variant = dialogueVariant;
      scene.leftImage = characterPortraitById.get(resolvedLeftSpeakerId) ?? toAssetUrl(leadCharacterImage);
      scene.rightImage = characterPortraitById.get(resolvedRightSpeakerId)
        ?? toAssetUrl(secondaryCharacterImage)
        ?? scene.leftImage;
      scene.leftCaption = characterNameById.get(resolvedLeftSpeakerId) ?? "Lead";
      scene.rightCaption = characterNameById.get(resolvedRightSpeakerId) ?? "Partner";
      scene.lines = rebaseDialogueRuntimeLines(
        buildDialogueRuntimeLines(effectiveDialogueLines, [resolvedLeftSpeakerId, resolvedRightSpeakerId]),
        localStart,
        duration,
      );
      return scene;
    }

    scene.image = resolveShotImage(
      shot,
      backgroundImage,
      leadCharacterImage,
      secondaryCharacterImage,
      focusCharacterImage,
      shouldForceSpeakerReference,
    );
    scene.lines = bubbleLines;

    if (shot.kind === "heroPose") {
      scene.sfx = shot.sfxLabel || fxLabelFromCue(section.soundEffectCue);
      return scene;
    }

    scene.headline = shot.headline || headlineFromSection(section, "Unknown Location");
    scene.caption = shot.caption || captionFromSection(section, "Unknown Location");
    return scene;
  };

  if (!directionShots || directionShots.length === 0) {
    const sceneKind = pickSceneKind(section, narratorDuration, speakerIds, project.brief?.tone, isFinalBeat);
    const scene: ScenePlan = {
      kind: sceneKind,
      at: sectionStart,
      duration: sectionDuration,
      trackBase: 200 + sectionIndex * 200,
      label: `Scene ${sectionIndex + 1}`,
      backdrop: backdropForTone(
        project.brief?.tone,
        sceneKind === "heroPose" || ambientStormActive,
        ambientStormActive || /(storm|panic|collapse|impact|secret|fear|dark)/.test(sceneText),
      ),
      rain: ambientStormActive || hasRainAtmosphere(
        section.narratorText,
        section.soundEffectCue,
        section.musicCue,
        ...section.dialogueLines.map((line) => line.lineText),
      ),
    };

    if (sceneKind === "dialogue") {
      const leftSpeaker = firstSpeaker ?? timedDialogueLines[0];
      const rightSpeaker = secondSpeaker ?? timedDialogueLines[1] ?? leftSpeaker;
      scene.variant = dialogueVariant;
      scene.leftImage = leftSpeaker?.speakerPortrait ?? toAssetUrl(leadCharacterImage);
      scene.rightImage = rightSpeaker?.speakerPortrait ?? toAssetUrl(backgroundImage) ?? toAssetUrl(leadCharacterImage);
      scene.leftCaption = leftSpeaker?.speakerName ?? "Lead";
      scene.rightCaption = rightSpeaker?.speakerName ?? "Partner";
      scene.lines = rebaseDialogueRuntimeLines(
        buildDialogueRuntimeLines(
          timedDialogueLines,
          [leftSpeaker?.line.characterId, rightSpeaker?.line.characterId].filter(
            (speakerId): speakerId is string => Boolean(speakerId),
          ),
        ),
        0,
        sectionDuration,
      );
      return [scene];
    }

    if (sceneKind === "heroPose") {
      scene.image = firstSpeaker?.speakerPortrait
        ?? characterPortraitById.get(speakerIds[0])
        ?? toAssetUrl(leadCharacterImage)
        ?? toAssetUrl(backgroundImage);
      scene.lines = timedDialogueLines.length > 0
        ? rebaseDialogueRuntimeLines(buildDialogueRuntimeLines(timedDialogueLines, speakerIds), 0, sectionDuration)
        : undefined;
      scene.sfx = fxLabelFromCue(section.soundEffectCue);
      return [scene];
    }

    scene.image = toAssetUrl(backgroundImage) ?? toAssetUrl(leadCharacterImage);
    scene.lines = timedDialogueLines.length > 0
      ? rebaseDialogueRuntimeLines(buildDialogueRuntimeLines(timedDialogueLines, speakerIds), 0, sectionDuration)
      : undefined;
    scene.headline = headlineFromSection(section, "Unknown Location");
    scene.caption = captionFromSection(section, "Unknown Location");
    return [scene];
  }

  const totalDialogueShots = directionShots.filter((shot) => shot.kind === "dialogue").length;
  const hasNarratedSetup = narratorDuration > 0.12 && totalDialogueShots > 0;
  if (hasNarratedSetup) {
    const nonDialogueShots = directionShots.filter((shot) => shot.kind !== "dialogue");
    const dialogueShots = directionShots.filter((shot) => shot.kind === "dialogue");
    const dialogueChunks = splitDialogueLinesIntoShotChunks(timedDialogueLines, dialogueShots.length);
    const scenes: ScenePlan[] = [];
    let sceneOrder = 0;

    if (nonDialogueShots.length === 0) {
      scenes.push(createSceneFromShot({
        id: `${section.id}-lead-in`,
        kind: "kenBurns",
        emphasis: 1,
        imageStrategy: "reuse-background",
        headline: headlineFromSection(section, "Unknown Location"),
        caption: captionFromSection(section, "Unknown Location"),
      }, sceneOrder, sectionStart, Math.max(0.6, narratorDuration), 0));
      sceneOrder += 1;
    } else {
      const introDurations = allocateShotDurations(Math.max(0.6, narratorDuration), nonDialogueShots);
      let introCursor = 0;
      nonDialogueShots.forEach((shot, shotIndex) => {
        const duration = introDurations[shotIndex] ?? Math.max(0.6, narratorDuration / nonDialogueShots.length);
        scenes.push(createSceneFromShot(shot, sceneOrder, sectionStart + introCursor, duration, introCursor));
        introCursor += duration;
        sceneOrder += 1;
      });
    }

    dialogueShots.forEach((shot, dialogueIndex) => {
      const chunk = dialogueChunks[dialogueIndex] ?? [];
      const chunkStart = chunk[0]?.start ?? narratorDuration;
      const chunkEnd = chunk.length > 0
        ? chunk[chunk.length - 1].start + chunk[chunk.length - 1].duration
        : sectionDuration;
      scenes.push(createSceneFromShot(
        shot,
        sceneOrder,
        sectionStart + chunkStart,
        Math.max(0.6, chunkEnd - chunkStart),
        chunkStart,
        chunk,
      ));
      sceneOrder += 1;
    });

    return scenes;
  }

  const durations = allocateShotDurations(sectionDuration, directionShots);
  const dialogueChunks = splitDialogueLinesIntoShotChunks(timedDialogueLines, totalDialogueShots || 1);
  let dialogueShotIndex = 0;
  let shotCursor = 0;

  return directionShots.map((shot, shotIndex) => {
    const duration = durations[shotIndex] ?? Math.max(0.9, sectionDuration / directionShots.length);
    const at = sectionStart + shotCursor;
    const localStart = shotCursor;
    shotCursor += duration;
    const chunk = shot.kind === "dialogue"
      ? dialogueChunks[dialogueShotIndex++]
      : undefined;
    return createSceneFromShot(shot, shotIndex, at, duration, localStart, chunk);
  });
}

function buildSectionOverlays(
  project: StoryProject,
  section: ScriptSection,
  scenes: ScenePlan[],
  start: number,
  duration: number,
  index: number,
  locationName: string,
): UiOverlayPlan[] {
  const beatText = sentenceExcerpt(section.narratorText || section.dialogueLines[0]?.lineText || "", 14, 92);
  const toneLabel = project.brief?.tone ? project.brief.tone.toUpperCase() : "EDITORIAL CUT";
  const primaryKind = scenes[0]?.kind ?? "kenBurns";
  const presetLabel = scenes.length > 1
    ? `${scenes.length} SHOT CUT`
    : primaryKind === "dialogue"
      ? "DUO FRAME"
      : primaryKind === "heroPose"
        ? "IMPACT FRAME"
        : "CINEMATIC FRAME";
  const overlays: UiOverlayPlan[] = [
    {
      id: `meta-${section.id}`,
      kind: "meta",
      start,
      duration,
      trackIndex: 3000 + index * 20,
      eyebrow: `Scene ${String(index + 1).padStart(2, "0")}`,
      title: locationName,
      subtitle: presetLabel,
    },
    {
      id: `badge-${section.id}`,
      kind: "badge",
      start,
      duration,
      trackIndex: 3001 + index * 20,
      badges: [toneLabel, `${scenes.length} SHOTS`, section.musicCue ? "SCORED" : "DRY CUT"],
    },
  ];

  if (beatText) {
    overlays.push({
      id: `beat-${section.id}`,
      kind: "beat",
      start: start + Math.min(0.5, duration * 0.15),
      duration: Math.min(Math.max(1.2, duration * 0.55), 2.8),
      trackIndex: 3002 + index * 20,
      body: beatText,
    });
  }

  return overlays;
}

function buildIntroOverlay(project: StoryProject, totalDuration: number): UiOverlayPlan[] {
  const introDuration = Math.min(2.8, Math.max(1.9, totalDuration * 0.14));
  return [
    {
      id: `title-${project.id}`,
      kind: "title",
      start: 0,
      duration: introDuration,
      trackIndex: 3900,
      eyebrow: project.brief?.tone ? `${project.brief.tone.toUpperCase()} STORY` : "FINAL REEL",
      title: project.name,
      subtitle: sentenceExcerpt(project.brief?.premise ?? "", 12, 86),
    },
  ];
}

export function buildTimeline(
  project: StoryProject,
  manifest: AssetManifest,
  subtitlesEnabled: boolean,
  direction?: DirectedVideoPlan,
): TimelineSection[] {
  const script = project.script;
  if (!script) return [];

  const charactersById = new Map(project.characters.map((character) => [character.id, character] as const));
  const characterNameById = new Map(project.characters.map((character) => [character.id, character.name] as const));
  const characterPortraitById = new Map(
    project.characters
      .filter((character) => Boolean(character.portraitPath))
      .map((character) => [character.id, toAssetUrl(character.portraitPath)!] as const),
  );
  const locationsById = new Map(project.locations.map((location) => [location.id, location] as const));
  const sectionStormStates = inferSectionStormStates(project, locationsById);
  const narratorEnabled = project.brief?.narratorEnabled !== false;
  let cursor = 0;

  return script.sections.map((section, index) => {
    const speakerIds = uniqueSpeakerIds(section);
    const narratorDuration = narratorEnabled
      ? manifest.durations[`narrator-${section.id}`] ?? estimatedDurationFromText(section.narratorText)
      : 0;
    const narratorWords = narratorEnabled
      ? normalizedWordTimestamps(section.narratorText, section.narratorTimestamps, narratorDuration)
      : [];

    let dialogueCursor = narratorDuration;
    const timedDialogueLines: TimedDialogueLine[] = section.dialogueLines.map((line) => {
      const duration = manifest.durations[`dialogue-${line.id}`] ?? estimatedDurationFromText(line.lineText);
      const timestamps = normalizedWordTimestamps(line.lineText, line.timestamps, duration);
      const speaker = charactersById.get(line.characterId);
      const timedLine: TimedDialogueLine = {
        line,
        speakerName: speaker?.name ?? "Speaker",
        speakerPortrait: speaker?.portraitPath ? `/assets/${speaker.portraitPath}` : undefined,
        start: dialogueCursor,
        duration,
        timestamps,
      };
      dialogueCursor += duration;
      return timedLine;
    });

    const duration = Math.max(0.9, dialogueCursor || narratorDuration || estimatedDurationFromText(section.narratorText));
    const locationName = section.locationId ? locationsById.get(section.locationId)?.name ?? "Unknown Location" : "Unknown Location";
    const scenes = buildScenePlans(
      project,
      section,
      index,
      cursor,
      duration,
      narratorDuration,
      speakerIds,
      timedDialogueLines,
      direction?.[section.id],
      characterNameById,
      characterPortraitById,
      sectionStormStates[index] ?? false,
    ).map((scene) => ({
      ...scene,
      headline: scene.kind === "kenBurns" ? scene.headline || headlineFromSection(section, locationName) : scene.headline,
      caption: scene.kind === "kenBurns" ? scene.caption || captionFromSection(section, locationName) : scene.caption,
    }));

    const overlays = buildSectionOverlays(project, section, scenes, cursor, duration, index, locationName);
    const captions = subtitlesEnabled
      ? buildCaptionSegments(section.id, cursor, narratorWords)
      : [];
    const audioPlans: AudioPlan[] = [];

    if (narratorEnabled && section.narratorAudioPath && narratorDuration > 0) {
      audioPlans.push({
        id: `audio-narrator-${section.id}`,
        src: `/assets/${section.narratorAudioPath}`,
        start: cursor,
        duration: narratorDuration,
        trackIndex: 10 + index * 10,
        volume: 1,
      });
    }
    timedDialogueLines.forEach((entry, lineIndex) => {
      if (!entry.line.audioPath) return;
      audioPlans.push({
        id: `audio-dialogue-${entry.line.id}`,
        src: `/assets/${entry.line.audioPath}`,
        start: cursor + entry.start,
        duration: entry.duration,
        trackIndex: 11 + index * 10 + lineIndex,
        volume: 1,
      });
    });
    if (section.musicAudioPath) {
      audioPlans.push({
        id: `audio-music-${section.id}`,
        src: `/assets/${section.musicAudioPath}`,
        start: cursor,
        duration,
        trackIndex: 18 + index * 10,
        volume: 0.15,
      });
    }
    if (section.sfxAudioPath) {
      const sfxDuration = Math.min(duration, manifest.durations[`sfx-${section.id}`] ?? 1.8);
      audioPlans.push({
        id: `audio-sfx-${section.id}`,
        src: `/assets/${section.sfxAudioPath}`,
        start: cursor + Math.min(0.35, duration * 0.18),
        duration: Math.max(0.4, sfxDuration),
        trackIndex: 19 + index * 10,
        volume: 0.28,
      });
    }

    const timelineSection: TimelineSection = {
      section,
      scenes,
      overlays,
      captions,
      audioPlans,
    };

    cursor += duration;
    return timelineSection;
  });
}

function renderOverlay(plan: UiOverlayPlan): string {
  if (plan.kind === "title") {
    return [
      `<div id="${escapeHtml(plan.id)}" class="story-title-card" data-start="${formatSeconds(plan.start)}" data-duration="${formatSeconds(plan.duration)}" data-track-index="${plan.trackIndex}">`,
      plan.eyebrow ? `<div class="story-title-card__eyebrow">${escapeHtml(plan.eyebrow)}</div>` : "",
      plan.title ? `<div class="story-title-card__title">${escapeHtml(plan.title)}</div>` : "",
      plan.subtitle ? `<div class="story-title-card__subtitle">${escapeHtml(plan.subtitle)}</div>` : "",
      `</div>`,
    ].join("");
  }

  if (plan.kind === "meta") {
    return [
      `<div id="${escapeHtml(plan.id)}" class="story-meta-chip" data-start="${formatSeconds(plan.start)}" data-duration="${formatSeconds(plan.duration)}" data-track-index="${plan.trackIndex}">`,
      plan.eyebrow ? `<span class="story-meta-chip__eyebrow">${escapeHtml(plan.eyebrow)}</span>` : "",
      plan.title ? `<strong class="story-meta-chip__title">${escapeHtml(plan.title)}</strong>` : "",
      plan.subtitle ? `<span class="story-meta-chip__subtitle">${escapeHtml(plan.subtitle)}</span>` : "",
      `</div>`,
    ].join("");
  }

  if (plan.kind === "badge") {
    return [
      `<div id="${escapeHtml(plan.id)}" class="story-badge-row-custom" data-start="${formatSeconds(plan.start)}" data-duration="${formatSeconds(plan.duration)}" data-track-index="${plan.trackIndex}">`,
      ...(plan.badges ?? []).map((badge) => `<span class="story-badge-row-custom__badge">${escapeHtml(badge)}</span>`),
      `</div>`,
    ].join("");
  }

  return [
    `<div id="${escapeHtml(plan.id)}" class="story-beat-card" data-start="${formatSeconds(plan.start)}" data-duration="${formatSeconds(plan.duration)}" data-track-index="${plan.trackIndex}">`,
    plan.body ? `<p>${escapeHtml(plan.body)}</p>` : "",
    `</div>`,
  ].join("");
}

function renderCaption(segment: CaptionSegment, trackIndex: number): string {
  const lines = splitWordsIntoLines(segment.words);
  const accentIndex = segment.words.length - 1;
  let absoluteWordIndex = 0;

  const body = lines
    .map((lineWords) => {
      const lineHtml = lineWords
        .map((word) => {
          const className = absoluteWordIndex === accentIndex
            ? "story-tiktok-caption__word is-accent"
            : "story-tiktok-caption__word";
          absoluteWordIndex += 1;
          return `<span class="${className}">${escapeHtml(word)}</span>`;
        })
        .join("");
      return `<span class="story-tiktok-caption__line">${lineHtml}</span>`;
    })
    .join("");

  return [
    `<div id="caption-${escapeHtml(segment.id)}" class="story-tiktok-caption story-tiktok-caption--${segment.tone}" data-start="${formatSeconds(segment.start)}" data-duration="${formatSeconds(segment.duration)}" data-track-index="${trackIndex}">`,
    segment.label ? `<span class="story-tiktok-caption__label">${escapeHtml(segment.label)}</span>` : "",
    `<span class="story-tiktok-caption__body">${body}</span>`,
    `</div>`,
  ].join("");
}

function renderAudio(plan: AudioPlan): string {
  return `<audio id="${escapeHtml(plan.id)}" src="${escapeHtml(plan.src)}" data-start="${formatSeconds(plan.start)}" data-duration="${formatSeconds(plan.duration)}" data-track-index="${plan.trackIndex}" data-volume="${plan.volume.toFixed(2)}"></audio>`;
}

function compositionStyles(project: StoryProject): string {
  const accent = accentColorForTone(project.brief?.tone);
  const glow = ambientGlowForTone(project.brief?.tone);

  return `
    :root {
      --story-accent: ${accent};
      --story-glow: ${glow};
      --story-card: rgba(10, 14, 27, 0.72);
      --story-card-border: rgba(255, 255, 255, 0.18);
      --story-caption-bg: rgba(9, 13, 24, 0.9);
      --story-caption-shadow: rgba(0, 0, 0, 0.48);
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      width: 100%;
      height: 100%;
      background: #060913;
      overflow: hidden;
      font-family: "Outfit", system-ui, sans-serif;
    }

    [data-composition-id] {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background:
        radial-gradient(circle at 18% 18%, var(--story-glow), transparent 36%),
        linear-gradient(180deg, rgba(5, 8, 17, 0.92) 0%, rgba(7, 10, 20, 0.98) 100%);
      isolation: isolate;
    }

    .story-global-vignette {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(circle at center, transparent 38%, rgba(6, 9, 19, 0.36) 80%, rgba(6, 9, 19, 0.88) 100%),
        linear-gradient(180deg, rgba(6, 9, 19, 0.04) 0%, rgba(6, 9, 19, 0.4) 100%);
      mix-blend-mode: screen;
    }

    .story-title-card {
      position: absolute;
      left: 7%;
      right: 7%;
      top: 7%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 28px 34px;
      border-radius: 28px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: linear-gradient(135deg, rgba(8, 12, 24, 0.9) 0%, rgba(13, 17, 31, 0.68) 100%);
      box-shadow: 0 22px 80px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(18px);
    }

    .story-title-card__eyebrow,
    .story-meta-chip__eyebrow,
    .story-tiktok-caption__label {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: clamp(10px, 0.9vw, 16px);
      letter-spacing: 0.28em;
      text-transform: uppercase;
    }

    .story-title-card__eyebrow,
    .story-meta-chip__eyebrow {
      color: rgba(255, 255, 255, 0.58);
    }

    .story-title-card__title {
      font-family: "Fraunces", Georgia, serif;
      font-size: clamp(42px, 4.5vw, 86px);
      font-weight: 700;
      line-height: 0.95;
      letter-spacing: -0.04em;
      color: #f8f2df;
      overflow-wrap: anywhere;
    }

    .story-title-card__subtitle {
      max-width: 60ch;
      font-size: clamp(15px, 1.35vw, 24px);
      line-height: 1.35;
      color: rgba(244, 245, 248, 0.78);
      overflow-wrap: anywhere;
    }

    .story-meta-chip {
      position: absolute;
      left: 6.5%;
      top: 6.5%;
      display: inline-flex;
      flex-direction: column;
      gap: 6px;
      padding: 16px 18px;
      border-radius: 18px;
      border: 1px solid var(--story-card-border);
      background: var(--story-card);
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(14px);
    }

    .story-meta-chip__title {
      font-family: "Fraunces", Georgia, serif;
      font-size: clamp(22px, 2.2vw, 38px);
      line-height: 1;
      color: #f8f2df;
      overflow-wrap: anywhere;
    }

    .story-meta-chip__subtitle {
      font-size: clamp(12px, 1vw, 18px);
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.64);
      overflow-wrap: anywhere;
    }

    .story-badge-row-custom {
      position: absolute;
      right: 6.5%;
      top: 7.5%;
      display: inline-flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 10px;
      max-width: 38%;
    }

    .story-badge-row-custom__badge {
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: rgba(7, 11, 21, 0.72);
      color: rgba(255, 255, 255, 0.86);
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: clamp(10px, 0.85vw, 14px);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      box-shadow: 0 14px 30px rgba(0, 0, 0, 0.2);
    }

    .story-beat-card {
      position: absolute;
      left: 6.5%;
      bottom: 19%;
      max-width: min(42%, 700px);
      padding: 20px 24px;
      border-radius: 22px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(249, 241, 223, 0.94);
      color: #111723;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.28);
    }

    .story-beat-card p {
      margin: 0;
      font-family: "Fraunces", Georgia, serif;
      font-size: clamp(18px, 1.65vw, 30px);
      line-height: 1.25;
      overflow-wrap: anywhere;
    }

    .story-tiktok-caption {
      position: absolute;
      left: 50%;
      bottom: 7.5%;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      max-width: min(78%, 960px);
      transform: translateX(-50%);
      text-align: center;
      pointer-events: none;
      z-index: 40;
    }

    .story-tiktok-caption--dialogue {
      bottom: 12.5%;
    }

    .story-tiktok-caption__label {
      padding: 7px 12px;
      border-radius: 999px;
      background: rgba(7, 11, 21, 0.86);
      color: rgba(255, 255, 255, 0.72);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.26);
    }

    .story-tiktok-caption__body {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      max-width: 100%;
      transform-origin: 50% 100%;
    }

    .story-tiktok-caption__line {
      display: inline-flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.18em;
      padding: 0.08em 0.22em;
      max-width: 100%;
    }

    .story-tiktok-caption__word {
      display: inline-flex;
      align-items: center;
      padding: 0.18em 0.28em 0.16em;
      border-radius: 0.22em;
      background: var(--story-caption-bg);
      color: #ffffff;
      font-family: "Outfit", system-ui, sans-serif;
      font-size: clamp(34px, 3.2vw, 68px);
      font-weight: 900;
      line-height: 0.9;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      box-shadow: 0 14px 28px var(--story-caption-shadow);
      -webkit-text-stroke: 1.2px rgba(4, 7, 14, 0.95);
      paint-order: stroke fill;
      overflow-wrap: anywhere;
    }

    .story-tiktok-caption__word.is-accent {
      color: #0d1322;
      background: var(--story-accent);
      -webkit-text-stroke: 0 transparent;
    }

    .story-root--portrait .story-badge-row-custom {
      max-width: 54%;
    }

    .story-root--portrait .story-beat-card {
      max-width: 54%;
      bottom: 22%;
    }

    .story-root--portrait .story-tiktok-caption,
    .story-root--square .story-tiktok-caption {
      max-width: 86%;
    }

    .story-root--portrait .story-tiktok-caption__word,
    .story-root--square .story-tiktok-caption__word {
      font-size: clamp(34px, 4.5vw, 74px);
    }
  `;
}

function renderSceneAndOverlayScript(timeline: TimelineSection[], projectId: string): string {
  const scenePlans = timeline.flatMap((entry) => entry.scenes);
  const overlayAnimations = timeline.flatMap((entry) =>
    entry.overlays.map((plan) => ({ id: plan.id, start: plan.start, end: plan.start + plan.duration })),
  );
  const captionAnimations = timeline.flatMap((entry) =>
    entry.captions.map((caption) => ({
      id: `caption-${caption.id}`,
      start: caption.start,
      end: caption.start + caption.duration,
    })),
  );

  return `
    window.__timelines = window.__timelines || {};
    (() => {
      const compositionId = ${jsonForScript(`story-${projectId}`)};
      const root = document.querySelector('[data-composition-id="' + compositionId + '"]');
      if (!root || !window.gsap || !window.storyMotionKit) return;

      const tl = gsap.timeline({ paused: true });
      window.__timelines[compositionId] = tl;
      const kit = window.storyMotionKit;
      kit.ensureStyles();

      const scenePlans = ${jsonForScript(scenePlans)};
      scenePlans.forEach((scene) => {
        if (scene.kind === "dialogue") {
          kit.scenes.dialogue(tl, root, {
            at: scene.at,
            duration: scene.duration,
            trackBase: scene.trackBase,
            label: scene.label,
            backdrop: scene.backdrop,
            rain: scene.rain,
            variant: scene.variant,
            leftImage: scene.leftImage,
            rightImage: scene.rightImage,
            leftCaption: scene.leftCaption,
            rightCaption: scene.rightCaption,
            lines: scene.lines,
          });
          return;
        }

        if (scene.kind === "heroPose") {
          kit.scenes.heroPose(tl, root, {
            at: scene.at,
            duration: scene.duration,
            trackBase: scene.trackBase,
            label: scene.label,
            backdrop: scene.backdrop,
            rain: scene.rain,
            image: scene.image,
            lines: scene.lines,
            sfx: scene.sfx,
          });
          return;
        }

        kit.scenes.kenBurns(tl, root, {
          at: scene.at,
          duration: scene.duration,
          trackBase: scene.trackBase,
          label: scene.label,
          backdrop: scene.backdrop,
          rain: scene.rain,
          image: scene.image,
          headline: scene.headline,
          caption: scene.caption,
          lines: scene.lines,
        });
      });

      const overlayAnimations = ${jsonForScript(overlayAnimations)};
      const fitFontWithinParent = (selector, minRatio = 0.68) => {
        root.querySelectorAll(selector).forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          const parent = node.parentElement;
          if (!parent) return;

          node.style.fontSize = '';
          const computed = window.getComputedStyle(node);
          const baseFontSize = Number.parseFloat(computed.fontSize);
          if (!Number.isFinite(baseFontSize) || baseFontSize <= 0) return;

          node.style.fontSize = baseFontSize + 'px';
          const minFontSize = Math.max(12, baseFontSize * minRatio);
          let nextFontSize = baseFontSize;
          let attempts = 0;

          while (
            attempts < 18
            && (node.scrollWidth > parent.clientWidth + 1 || node.scrollHeight > parent.clientHeight + 1)
            && nextFontSize > minFontSize
          ) {
            nextFontSize *= 0.94;
            node.style.fontSize = nextFontSize + 'px';
            attempts += 1;
          }
        });
      };

      const fitCaptionBodies = () => {
        root.querySelectorAll('.story-tiktok-caption').forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          const body = node.querySelector('.story-tiktok-caption__body');
          if (!(body instanceof HTMLElement)) return;

          body.style.transform = 'scale(1)';
          const maxWidth = node.clientWidth || root.clientWidth * 0.78;
          const maxHeight = Math.max(110, root.clientHeight * (scenePlans.length > 0 && root.classList.contains('story-root--portrait') ? 0.2 : 0.14));
          let scale = 1;
          let attempts = 0;

          while (
            attempts < 12
            && (body.scrollWidth > maxWidth + 1 || body.scrollHeight > maxHeight + 1)
            && scale > 0.7
          ) {
            scale -= 0.04;
            body.style.transform = 'scale(' + scale + ')';
            attempts += 1;
          }
        });
      };

      const fitBlocksToViewport = (selector, minRatio = 0.62, margin = 28) => {
        const rootBox = root.getBoundingClientRect();
        root.querySelectorAll(selector).forEach((node) => {
          if (!(node instanceof HTMLElement)) return;

          node.style.fontSize = '';
          const baseFontSize = Number.parseFloat(window.getComputedStyle(node).fontSize);
          if (!Number.isFinite(baseFontSize) || baseFontSize <= 0) return;

          let nextFontSize = baseFontSize;
          const minFontSize = Math.max(12, baseFontSize * minRatio);
          let attempts = 0;

          while (attempts < 18 && nextFontSize > minFontSize) {
            const box = node.getBoundingClientRect();
            const fitsViewport = box.left >= rootBox.left + margin
              && box.right <= rootBox.right - margin
              && box.top >= rootBox.top + margin
              && box.bottom <= rootBox.bottom - margin;
            const fitsOwnWidth = node.scrollWidth <= node.clientWidth + 1 || node.clientWidth === 0;

            if (fitsViewport && fitsOwnWidth) break;

            nextFontSize *= 0.94;
            node.style.fontSize = nextFontSize + 'px';
            attempts += 1;
          }
        });
      };

      const fitCompositionText = () => {
        fitFontWithinParent('.story-title-card__title', 0.62);
        fitFontWithinParent('.story-title-card__subtitle', 0.72);
        fitFontWithinParent('.story-meta-chip__title', 0.7);
        fitFontWithinParent('.story-meta-chip__subtitle', 0.74);
        fitFontWithinParent('.story-beat-card p', 0.72);
        fitFontWithinParent('.story-photo-caption', 0.74);
        fitBlocksToViewport('.story-headline', 0.6, 34);
        fitBlocksToViewport('.story-caption-band span', 0.68, 42);
        fitBlocksToViewport('.story-sfx', 0.52, 54);
        fitBlocksToViewport('.story-speech-bubble', 0.72, 38);
        fitCaptionBodies();
      };

      requestAnimationFrame(fitCompositionText);
      window.addEventListener('resize', fitCompositionText);

      overlayAnimations.forEach((entry) => {
        const selector = '#' + entry.id;
        tl.fromTo(
          selector,
          { autoAlpha: 0, y: 24, scale: 0.96 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: "power2.out" },
          entry.start,
        );
        tl.to(
          selector,
          { autoAlpha: 0, y: -14, duration: 0.28, ease: "power1.in" },
          Math.max(entry.start + 0.25, entry.end - 0.3),
        );
      });

      const captionAnimations = ${jsonForScript(captionAnimations)};
      captionAnimations.forEach((entry) => {
        const selector = '#' + entry.id;
        tl.fromTo(
          selector,
          { autoAlpha: 0, y: 18, scale: 0.92 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.16, ease: "power2.out" },
          entry.start,
        );
        tl.to(
          selector,
          { autoAlpha: 0, y: -10, duration: 0.14, ease: "power1.in" },
          Math.max(entry.start + 0.18, entry.end - 0.14),
        );
      });
    })();
  `;
}

function finalSceneEnd(timeline: TimelineSection[]): number {
  const lastSection = timeline[timeline.length - 1];
  const lastScene = lastSection?.scenes[lastSection.scenes.length - 1];
  return lastScene ? lastScene.at + lastScene.duration : 0;
}

export function orientationToSize(orientation?: string): CompositionSize {
  if (orientation === "portrait") return { width: 1080, height: 1920, aspect: "9:16" };
  if (orientation === "square") return { width: 1080, height: 1080, aspect: "1:1" };
  return { width: 1920, height: 1080, aspect: "16:9" };
}

export function buildDeterministicComposition(
  project: StoryProject,
  manifest: AssetManifest,
  size: CompositionSize,
  options: {
    subtitlesEnabled?: boolean;
    direction?: DirectedVideoPlan;
  } = {},
): string {
  const timeline = buildTimeline(
    project,
    manifest,
    options.subtitlesEnabled !== false,
    options.direction,
  );
  const totalDuration = finalSceneEnd(timeline);
  const introOverlay = buildIntroOverlay(project, totalDuration);
  const allOverlays = [
    ...introOverlay,
    ...timeline.flatMap((entry) => entry.overlays),
  ];
  const overlayMarkup = allOverlays.map(renderOverlay).join("\n      ");
  const captionMarkup = timeline
    .flatMap((entry, sectionIndex) =>
      entry.captions.map((caption, captionIndex) =>
        renderCaption(caption, 3400 + sectionIndex * 100 + captionIndex),
      ),
    )
    .join("\n      ");
  const audioMarkup = timeline.flatMap((entry) => entry.audioPlans.map(renderAudio)).join("\n      ");
  const rootClass =
    project.brief?.orientation === "portrait"
      ? "story-root--portrait"
      : project.brief?.orientation === "square"
        ? "story-root--square"
        : "story-root--landscape";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(project.name)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=JetBrains+Mono:wght@500;700&family=Outfit:wght@500;700;900&display=swap" rel="stylesheet" />
    <style>
      ${compositionStyles(project)}
    </style>
  </head>
  <body>
    <div data-composition-id="story-${escapeHtml(project.id)}" data-start="0" data-duration="${formatSeconds(totalDuration)}" data-width="${size.width}" data-height="${size.height}" class="${rootClass}">
      <div class="story-global-vignette" data-start="0" data-duration="${formatSeconds(totalDuration)}" data-track-index="1"></div>
      ${audioMarkup}
      ${overlayMarkup}
      ${captionMarkup}
    </div>

    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@hyperframes/core/dist/hyperframe.runtime.iife.js"></script>
    <script src="/assets/vendor/story-motion-kit.js"></script>
    <script>
      ${renderSceneAndOverlayScript(timeline, project.id)}
    </script>
  </body>
</html>`;
}