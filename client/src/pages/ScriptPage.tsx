import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  FileText,
  Sparkles,
  Music,
  Volume2,
  MessageSquare,
  BookOpen,
  Headphones,
  CheckCircle,
  MapPin,
  Type,
  Monitor,
  Smartphone,
  Square,
  Clock,
  Mic,
  Captions,
  Image as ImageIcon,
} from "lucide-react";
import { api } from "../lib/api";
import type {
  StoryProject,
  Character,
  Location,
  StyleConfig,
  StoryScript,
  StoryBrief,
  StoryTone,
  StoryLength,
  StoryOrientation,
} from "../lib/types";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Textarea } from "../components/ui/Input";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorToast } from "../components/ui/ErrorToast";
import { PageHeader } from "../components/ui/PageHeader";
import { AudioPlayer } from "../components/ui/AudioPlayer";

const TONES: { value: StoryTone; label: string; emoji: string }[] = [
  { value: "whimsical", label: "Whimsical", emoji: "✨" },
  { value: "mysterious", label: "Mysterious", emoji: "🔮" },
  { value: "heroic", label: "Heroic", emoji: "⚔️" },
  { value: "melancholic", label: "Melancholic", emoji: "🌧️" },
  { value: "funny", label: "Funny", emoji: "🎭" },
  { value: "dramatic", label: "Dramatic", emoji: "🎬" },
];

const LENGTHS: {
  value: StoryLength;
  label: string;
  hint: string;
}[] = [
  { value: "short", label: "Short", hint: "≈30s · 3 scenes" },
  { value: "standard", label: "Standard", hint: "≈60s · 5 scenes" },
  { value: "long", label: "Long", hint: "≈90s · 7 scenes" },
];

const ORIENTATIONS: {
  value: StoryOrientation;
  label: string;
  Icon: typeof Monitor;
  hint: string;
}[] = [
  { value: "landscape", label: "Landscape", Icon: Monitor, hint: "16:9 · YouTube" },
  { value: "portrait", label: "Portrait", Icon: Smartphone, hint: "9:16 · TikTok" },
  { value: "square", label: "Square", Icon: Square, hint: "1:1 · Instagram" },
];

type GenerationStage = "idle" | "script" | "audio";

// Module-level registry so an in-flight story generation survives tab changes
// (the ScriptPage component unmounts when switching to another project tab).
interface InFlightGeneration {
  stage: GenerationStage;
  promise: Promise<StoryProject>;
}
const inFlightGenerations = new Map<string, InFlightGeneration>();
type GenerationListener = (stage: GenerationStage) => void;
const generationListeners = new Map<string, Set<GenerationListener>>();

function notifyGeneration(projectId: string, stage: GenerationStage) {
  const current = inFlightGenerations.get(projectId);
  if (current) current.stage = stage;
  generationListeners.get(projectId)?.forEach((fn) => fn(stage));
}

function subscribeGeneration(projectId: string, fn: GenerationListener): () => void {
  let set = generationListeners.get(projectId);
  if (!set) {
    set = new Set();
    generationListeners.set(projectId, set);
  }
  set.add(fn);
  return () => {
    set?.delete(fn);
    if (set && set.size === 0) generationListeners.delete(projectId);
  };
}

export default function ScriptPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [style, setStyle] = useState<StyleConfig | undefined>();
  const [script, setScript] = useState<StoryScript | undefined>();

  const [brief, setBrief] = useState<StoryBrief>({
    premise: "",
    tone: "whimsical",
    lengthPreset: "standard",
    orientation: "landscape",
    subtitlesEnabled: true,
    narratorEnabled: true,
  });
  const [savingBrief, setSavingBrief] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState<GenerationStage>("idle");

  const charMap = useCallback(
    () => new Map(characters.map((c) => [c.id, c.name])),
    [characters],
  );
  const locMap = useCallback(
    () => new Map(locations.map((l) => [l.id, l.name])),
    [locations],
  );

  useEffect(() => {
    api
      .get<StoryProject>(`/api/projects/${id}`)
      .then((p) => {
        setCharacters(p.characters);
        setLocations(p.locations);
        setStyle(p.style);
        setScript(p.script);
        if (p.brief) {
          setBrief((prev) => ({ ...prev, ...p.brief }));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Re-attach to an in-flight generation after remount (e.g. user switched tabs).
  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeGeneration(id, (s) => setStage(s));
    const existing = inFlightGenerations.get(id);
    if (existing) {
      setGenerating(true);
      setStage(existing.stage);
      existing.promise
        .then(async () => {
          try {
            const full = await api.get<StoryProject>(`/api/projects/${id}`);
            setScript(full.script);
          } catch {
            /* ignored: refetch on remount is best-effort */
          }
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : "Failed to generate story");
        })
        .finally(() => {
          setGenerating(false);
          setStage("idle");
        });
    }
    return unsubscribe;
  }, [id]);

  const canGenerate =
    characters.length >= 1 &&
    locations.length >= 1 &&
    !!style &&
    (brief.premise?.trim().length ?? 0) >= 10;

  async function persistBrief(next: StoryBrief) {
    setBrief(next);
    setSavingBrief(true);
    try {
      await api.put<StoryProject>(`/api/projects/${id}`, { brief: next });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save brief");
    } finally {
      setSavingBrief(false);
    }
  }

  async function handleGenerateStory() {
    if (!canGenerate || !id) return;
    // Avoid double-launch if another mount started one already.
    if (inFlightGenerations.get(id)) return;

    setGenerating(true);
    setStage("script");

    const run = (async (): Promise<StoryProject> => {
      // Save brief first
      await api.put<StoryProject>(`/api/projects/${id}`, { brief });

      // Step 1: script
      notifyGeneration(id, "script");
      const afterScript = await api.post<StoryProject>(
        `/api/projects/${id}/generate-script`,
      );

      // Step 2: audio
      notifyGeneration(id, "audio");
      await api.post<StoryProject>(`/api/projects/${id}/generate-audio`);

      // generate-audio response shape varies; refetch full project to be safe.
      const full = await api.get<StoryProject>(`/api/projects/${id}`);
      return full;
    })();

    inFlightGenerations.set(id, { stage: "script", promise: run });

    try {
      const full = await run;
      setScript(full.script);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate story");
    } finally {
      inFlightGenerations.delete(id);
      notifyGeneration(id, "idle");
      setStage("idle");
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const cMap = charMap();
  const lMap = locMap();
  const premiseLen = brief.premise?.trim().length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
      <PageHeader
        step="Step 04 · The Brief"
        title="The story"
        subtitle="Tell us what it's about. We'll draft the screenplay, record the voices, and prep every scene."
        icon={FileText}
      />

      {/* Prerequisites gate */}
      {(!characters.length || !locations.length || !style) && (
        <Card className="mb-8 py-8 text-center">
          <p className="text-ink-500">
            Add at least{" "}
            <span className="font-semibold text-ink-700">one character</span>,
            one location, and pick a style before drafting the story.
          </p>
        </Card>
      )}

      {/* Brief form */}
      <Card className="mb-8">
        <div className="flex flex-col gap-6">
          {/* Premise */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
              <Type className="h-3 w-3" />
              Story premise
              <span className="ml-auto text-ink-300">
                {premiseLen} / 2000
              </span>
            </label>
            <Textarea
              value={brief.premise ?? ""}
              onChange={(e) =>
                setBrief({ ...brief, premise: e.target.value.slice(0, 2000) })
              }
              onBlur={() => brief.premise && persistBrief(brief)}
              placeholder="Two siblings find a worn map in their grandma's attic that leads to a forgotten garden where the seasons never change..."
              rows={4}
            />
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
              Minimum 10 characters. The more vivid, the better.
            </p>
          </div>

          {/* Tone */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
              <Sparkles className="h-3 w-3" />
              Tone
            </label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => {
                const active = brief.tone === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => persistBrief({ ...brief, tone: t.value })}
                    className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition ${
                      active
                        ? "border-tomato-500 bg-tomato-50 text-tomato-600 shadow-[2px_2px_0_0_var(--color-tomato-500)]"
                        : "border-ink-300 bg-paper-50 text-ink-500 hover:border-ink-500"
                    }`}
                  >
                    <span>{t.emoji}</span>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Length */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
              <Clock className="h-3 w-3" />
              Length
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              {LENGTHS.map((l) => {
                const active = brief.lengthPreset === l.value;
                return (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() =>
                      persistBrief({ ...brief, lengthPreset: l.value })
                    }
                    className={`rounded-lg border-2 px-4 py-3 text-left transition ${
                      active
                        ? "border-tomato-500 bg-tomato-50 shadow-[3px_3px_0_0_var(--color-tomato-500)]"
                        : "border-ink-300 bg-paper-50 hover:border-ink-500"
                    }`}
                  >
                    <div className="font-display text-base font-semibold text-ink-700">
                      {l.label}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                      {l.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orientation */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
              <Monitor className="h-3 w-3" />
              Orientation
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              {ORIENTATIONS.map((o) => {
                const active = brief.orientation === o.value;
                const Icon = o.Icon;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() =>
                      persistBrief({ ...brief, orientation: o.value })
                    }
                    className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition ${
                      active
                        ? "border-tomato-500 bg-tomato-50 shadow-[3px_3px_0_0_var(--color-tomato-500)]"
                        : "border-ink-300 bg-paper-50 hover:border-ink-500"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        active ? "text-tomato-500" : "text-ink-400"
                      }`}
                    />
                    <div>
                      <div className="font-display text-sm font-semibold text-ink-700">
                        {o.label}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                        {o.hint}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles */}
          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleCard
              icon={<Captions className="h-4 w-4" />}
              label="Subtitles"
              hint="Burn captions on every line"
              active={!!brief.subtitlesEnabled}
              onToggle={() =>
                persistBrief({
                  ...brief,
                  subtitlesEnabled: !brief.subtitlesEnabled,
                })
              }
            />
            <ToggleCard
              icon={<Mic className="h-4 w-4" />}
              label="Narrator"
              hint="Voice-over between dialogue"
              active={brief.narratorEnabled !== false}
              onToggle={() =>
                persistBrief({
                  ...brief,
                  narratorEnabled: brief.narratorEnabled === false,
                })
              }
            />
          </div>

          {/* Action */}
          <div className="flex flex-wrap items-center gap-3 border-t-2 border-dashed border-ink-200 pt-5">
            <Button
              loading={generating}
              disabled={!canGenerate || generating}
              onClick={handleGenerateStory}
            >
              <Sparkles className="h-4 w-4" />
              {script ? "Rewrite the story" : "Generate the story"}
            </Button>
            {savingBrief && (
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
                Saving brief…
              </span>
            )}
            {!canGenerate && (
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                Write a premise of at least 10 characters to continue.
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Progress states */}
      {generating && (
        <div className="flex flex-col items-center gap-4 py-16">
          <LoadingSpinner size="lg" />
          <p className="font-display italic text-ink-500">
            {stage === "script"
              ? "The writers' room is brewing coffee…"
              : "Rolling tape in the booth…"}
          </p>
        </div>
      )}

      {/* Read-only screenplay preview */}
      {!generating && script && script.sections.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ink-700">
              Screenplay preview
            </h3>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink-600 bg-paper-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
              <Headphones className="h-3 w-3" />
              {script.sections.length.toString().padStart(2, "0")} scenes
            </span>
          </div>

          <div className="flex flex-col gap-6">
            {script.sections
              .sort((a, b) => a.sectionOrder - b.sectionOrder)
              .map((section) => {
                const slug = `SCENE ${section.sectionOrder
                  .toString()
                  .padStart(2, "0")}${
                  section.locationId && lMap.has(section.locationId)
                    ? ` — ${(lMap.get(section.locationId) ?? "").toUpperCase()}`
                    : ""
                }`;
                return (
                  <div
                    key={section.id}
                    className="relative overflow-hidden rounded-2xl border-2 border-ink-600 bg-paper-50 shadow-[5px_5px_0_0_var(--color-ink-600)]"
                  >
                    {/* Slugline */}
                    <div className="flex flex-col gap-1 border-b-2 border-ink-600 bg-ink-600 px-3 py-2 text-paper-100 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-2.5">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em]">
                        {slug}
                      </span>
                      {section.locationId && (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.22em] text-paper-200">
                          <MapPin className="h-3 w-3" />
                          EXT./INT.
                        </span>
                      )}
                    </div>

                    <div className="space-y-5 p-4 sm:p-6">
                      {/* Image layers preview (excluding overlays, which aren't real images) */}
                      {(() => {
                        const visibleLayers = section.imageLayers
                          .filter((l) => l.layerType !== "overlay")
                          .slice()
                          .sort((a, b) => a.layerOrder - b.layerOrder);
                        if (visibleLayers.length === 0) return null;
                        return (
                          <div>
                            <label className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                              <ImageIcon className="h-3 w-3" />
                              Visual layers
                            </label>
                            <div className="flex flex-wrap gap-3">
                              {visibleLayers.map((layer) => (
                                <div
                                  key={layer.id}
                                  className="flex w-36 flex-col overflow-hidden rounded-lg border-2 border-ink-300 bg-paper-100"
                                >
                                  <div className="relative aspect-square bg-ink-100">
                                    {layer.imagePath ? (
                                      <img
                                        src={toAssetUrl(layer.imagePath)}
                                        alt={layer.description ?? layer.layerType}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-ink-300">
                                        <ImageIcon className="h-6 w-6" />
                                      </div>
                                    )}
                                    <span className="absolute left-1.5 top-1.5 rounded-full border border-ink-600 bg-paper-50/90 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-600">
                                      {layer.layerType}
                                    </span>
                                  </div>
                                  {layer.description && (
                                    <p className="border-t-2 border-ink-200 px-2 py-1.5 text-[11px] leading-snug text-ink-500">
                                      {layer.description}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {brief.narratorEnabled !== false && section.narratorText && (
                        <div>
                          <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                            <BookOpen className="h-3 w-3" />
                            Narration
                          </label>
                          <p className="text-sm leading-relaxed text-ink-600">
                            {section.narratorText}
                          </p>
                          {section.narratorAudioPath && (
                            <AudioPlayer src={toAssetUrl(section.narratorAudioPath)} className="mt-2" />
                          )}
                        </div>
                      )}

                      {section.dialogueLines.length > 0 && (
                        <div>
                          <label className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                            <MessageSquare className="h-3 w-3" />
                            Dialogue
                          </label>
                          <div className="space-y-4 rounded-lg border-2 border-dashed border-ink-200 bg-paper-100 bg-ruled px-3 py-3 sm:px-5 sm:py-4">
                            {section.dialogueLines
                              .slice()
                              .sort((a, b) => a.lineOrder - b.lineOrder)
                              .map((line) => (
                                <div key={line.id} className="text-center">
                                  <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-tomato-600">
                                    {cMap.get(line.characterId) ?? "Unknown"}
                                  </div>
                                  <p className="mx-auto max-w-md font-display text-[15px] italic leading-snug text-ink-700">
                                    {line.lineText}
                                  </p>
                                  {line.audioPath && (
                                    <AudioPlayer
                                      src={toAssetUrl(line.audioPath)}
                                      className="mx-auto mt-2 max-w-md"
                                    />
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                        {(section.musicCue || section.musicAudioPath) && (
                          <div>
                            <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                              <Music className="h-3 w-3" />
                              Music cue
                            </label>
                            {section.musicCue && (
                              <p className="text-xs text-ink-500">
                                {section.musicCue}
                              </p>
                            )}
                            {section.musicAudioPath && (
                              <AudioPlayer src={toAssetUrl(section.musicAudioPath)} className="mt-2" />
                            )}
                          </div>
                        )}
                        {(section.soundEffectCue || section.sfxAudioPath) && (
                          <div>
                            <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                              <Volume2 className="h-3 w-3" />
                              Sound effect
                            </label>
                            {section.soundEffectCue && (
                              <p className="text-xs text-ink-500">
                                {section.soundEffectCue}
                              </p>
                            )}
                            {section.sfxAudioPath && (
                              <AudioPlayer src={toAssetUrl(section.sfxAudioPath)} className="mt-2" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 border-t-2 border-dashed border-ink-200 pt-4">
                        <AudioBadge
                          present={!!section.narratorAudioPath}
                          label="Narrator"
                        />
                        <AudioBadge
                          present={
                            section.dialogueLines.length > 0 &&
                            section.dialogueLines.every((d) => !!d.audioPath)
                          }
                          label="Dialogue"
                        />
                        <AudioBadge
                          present={!!section.musicAudioPath}
                          label="Music"
                        />
                        <AudioBadge present={!!section.sfxAudioPath} label="SFX" />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </div>
  );
}

function ToggleCard({
  icon,
  label,
  hint,
  active,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition ${
        active
          ? "border-sage-500 bg-sage-50 shadow-[3px_3px_0_0_var(--color-sage-500)]"
          : "border-ink-300 bg-paper-50 hover:border-ink-500"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-md border-2 ${
          active
            ? "border-sage-500 bg-paper-50 text-sage-500"
            : "border-ink-300 bg-paper-100 text-ink-400"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-display text-sm font-semibold text-ink-700">
          {label}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
          {hint}
        </div>
      </div>
      <div
        className={`relative h-6 w-10 rounded-full border-2 transition ${
          active
            ? "border-sage-500 bg-sage-500"
            : "border-ink-300 bg-paper-100"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-paper-50 transition-all ${
            active ? "left-4.5" : "left-0.5"
          }`}
        />
      </div>
    </button>
  );
}

function AudioBadge({ present, label }: { present: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] ${
        present
          ? "border-sage-400 bg-sage-50 text-sage-500"
          : "border-ink-200 bg-paper-100 text-ink-400"
      }`}
    >
      {present ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <span className="inline-block h-2 w-2 rounded-full border border-ink-300" />
      )}
      {label}
    </span>
  );
}

function toAssetUrl(path: string): string {
  return path.startsWith("/assets/") ? path : `/assets/${path}`;
}
