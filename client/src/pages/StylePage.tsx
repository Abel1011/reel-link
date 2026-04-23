import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Palette, Check, Save, Wand2, Plus, X } from "lucide-react";
import { api } from "../lib/api";
import type { StylePreset, StoryProject, StyleGenre } from "../lib/types";
import { Input } from "../components/ui/Input";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorToast } from "../components/ui/ErrorToast";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";

const GENRES: Array<StyleGenre | "All"> = [
  "All",
  "Comic",
  "Anime",
  "Painterly",
  "3D",
  "Retro",
  "Minimal",
];

const GENRE_BADGE: Record<StyleGenre, string> = {
  Comic: "bg-tomato-100 text-tomato-700 border-tomato-400",
  Anime: "bg-ochre-100 text-ochre-600 border-ochre-400",
  Painterly: "bg-sage-50 text-sage-500 border-sage-400",
  "3D": "bg-paper-200 text-ink-700 border-ink-400",
  Retro: "bg-ink-600 text-paper-100 border-ink-600",
  Minimal: "bg-paper-50 text-ink-500 border-ink-300",
};

const SWATCH_LIBRARY: Array<{ label: string; colors: string[] }> = [
  {
    label: "Warm",
    colors: ["#e63946", "#ff7a29", "#f5d76e", "#d4a017", "#c75050", "#f5f0e1"],
  },
  {
    label: "Cool",
    colors: ["#1d3557", "#2a528a", "#2ea3ff", "#a8d8ea", "#7ab87a", "#3a5a40"],
  },
  {
    label: "Neon",
    colors: ["#ff1493", "#00e5ff", "#ff4d8d", "#7b2cbf", "#f2a65a", "#a3d5ff"],
  },
  {
    label: "Earthy",
    colors: ["#8b6f47", "#3a5a40", "#d67c5a", "#bfb07a", "#6b8e7f", "#f4e8c7"],
  },
  {
    label: "Mono",
    colors: ["#0a0a0a", "#2c2c2c", "#708090", "#cfcfcf", "#f5f0e6", "#ffffff"],
  },
];

const LIGHTING_SUGGESTIONS = [
  "Low-key dramatic",
  "Golden hour",
  "Neon glow",
  "Soft ambient",
  "Rim lighting",
  "Overcast flat",
  "Moonlit",
  "Stage spotlight",
];

const MOOD_SUGGESTIONS = [
  "Mysterious",
  "Energetic",
  "Cozy",
  "Heroic",
  "Melancholy",
  "Playful",
  "Tense",
  "Nostalgic",
  "Whimsical",
  "Dreamy",
];

interface StyleForm {
  visualStyle: string;
  artisticMedium: string;
  colorPalette: string;
  lighting: string;
  mood: string;
  presetName?: string;
}

const emptyForm: StyleForm = {
  visualStyle: "",
  artisticMedium: "",
  colorPalette: "",
  lighting: "",
  mood: "",
};

function hexListFromString(s: string): string[] {
  return Array.from(s.matchAll(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})/g)).map((m) => m[0]);
}

export default function StylePage() {
  const { id } = useParams<{ id: string }>();
  const [presets, setPresets] = useState<StylePreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [activeGenre, setActiveGenre] = useState<StyleGenre | "All">("All");
  const [form, setForm] = useState<StyleForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewTick, setPreviewTick] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveStyle = useCallback(
    async (data: StyleForm) => {
      if (!id) return;
      setSaving(true);
      setSaved(false);
      try {
        await api.post(`/api/projects/${id}/style`, data);
        setSaved(true);
        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSaved(false), 2000);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to save style");
      } finally {
        setSaving(false);
      }
    },
    [id],
  );

  const debouncedSave = useCallback(
    (data: StyleForm) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveStyle(data), 600);
    },
    [saveStyle],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPreviewTick((n) => n + 1), 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [presetsData, project] = await Promise.all([
          api.get<StylePreset[]>("/api/style-presets"),
          api.get<StoryProject>(`/api/projects/${id}`),
        ]);
        setPresets(presetsData);
        if (project.style) {
          setForm({
            visualStyle: project.style.visualStyle || "",
            artisticMedium: project.style.artisticMedium || "",
            colorPalette: project.style.colorPalette || "",
            lighting: project.style.lighting || "",
            mood: project.style.mood || "",
            presetName: project.style.presetName,
          });
          if (project.style.presetName) {
            setSelectedPreset(project.style.presetName);
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function selectPreset(preset: StylePreset) {
    const next: StyleForm = {
      visualStyle: preset.visualStyle,
      artisticMedium: preset.artisticMedium,
      colorPalette: preset.colorPalette,
      lighting: preset.lighting,
      mood: preset.mood,
      presetName: preset.presetName,
    };
    setSelectedPreset(preset.presetName);
    setForm(next);
    debouncedSave(next);
  }

  function updateField(field: keyof StyleForm, value: string) {
    const next = { ...form, [field]: value, presetName: undefined };
    setForm(next);
    setSelectedPreset(null);
    debouncedSave(next);
  }

  function toggleSwatch(hex: string) {
    const current = hexListFromString(form.colorPalette);
    const hasIt = current.some((c) => c.toLowerCase() === hex.toLowerCase());
    const nextColors = hasIt
      ? current.filter((c) => c.toLowerCase() !== hex.toLowerCase())
      : [...current, hex].slice(-6);
    updateField("colorPalette", nextColors.join(", "));
  }

  function addCustomColor(hex: string) {
    const normalized = hex.toLowerCase();
    const current = hexListFromString(form.colorPalette);
    if (current.some((c) => c.toLowerCase() === normalized)) return;
    const nextColors = [...current, normalized].slice(-6);
    updateField("colorPalette", nextColors.join(", "));
  }

  const filteredPresets = useMemo(
    () => (activeGenre === "All" ? presets : presets.filter((p) => p.genre === activeGenre)),
    [presets, activeGenre],
  );

  const selectedHexes = useMemo(() => hexListFromString(form.colorPalette), [form.colorPalette]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
      <PageHeader
        step="Step 01 · Look & Feel"
        title="Pick a visual direction"
        subtitle="Start with a preset or mix your own. Comic, manga, 3D, watercolor — it all lives here."
        icon={Palette}
        right={
          (saving || saved) && (
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-sage-400 bg-sage-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-sage-500">
              <Save className="h-3 w-3" />
              {saving ? "Saving" : "Saved"}
            </span>
          )
        }
      />

      {/* Genre tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {GENRES.map((g) => {
          const active = g === activeGenre;
          return (
            <button
              type="button"
              key={g}
              onClick={() => setActiveGenre(g)}
              className={`rounded-full border-2 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] transition-all ${
                active
                  ? "border-ink-600 bg-ink-600 text-paper-100 shadow-[2px_2px_0_0_var(--color-tomato-500)]"
                  : "border-ink-300 bg-paper-50 text-ink-500 hover:border-ink-500 hover:text-ink-700"
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>

      {/* Preset grid */}
      <div className="mb-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredPresets.map((preset, idx) => {
          const isSelected = selectedPreset === preset.presetName;
          return (
            <div
              key={preset.presetName}
              className={`group relative flex flex-col rounded-xl border-2 bg-paper-50 transition-all ${
                isSelected
                  ? "border-ink-600 shadow-[5px_5px_0_0_var(--color-tomato-500)]"
                  : "border-ink-300 shadow-[3px_3px_0_0_var(--color-ink-200)] hover:-translate-x-px hover:-translate-y-px hover:border-ink-500 hover:shadow-[5px_5px_0_0_var(--color-ink-300)]"
              }`}
            >
              {isSelected && (
                <div className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink-600 bg-tomato-500 text-paper-50 shadow-[2px_2px_0_0_var(--color-ink-600)]">
                  <Check className="h-4 w-4" />
                </div>
              )}

              {/* Preview image area */}
              <button
                type="button"
                onClick={() => selectPreset(preset)}
                className="relative block w-full overflow-hidden rounded-t-[10px] border-b-2 border-ink-300 bg-paper-200"
                style={{ aspectRatio: "4/3" }}
              >
                {preset.previewImagePath ? (
                  (() => {
                    const paths =
                      preset.previewImagePaths && preset.previewImagePaths.length > 0
                        ? preset.previewImagePaths
                        : [preset.previewImagePath];
                    const activeIdx = paths.length > 1 ? previewTick % paths.length : 0;
                    return (
                      <div className="absolute inset-0">
                        {paths.map((p, i) => (
                          <img
                            key={p}
                            src={`/assets/${p}`}
                            alt={`${preset.presetName} preview`}
                            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                              i === activeIdx ? "opacity-100" : "opacity-0"
                            }`}
                          />
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  <div
                    className="flex h-full w-full flex-col items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${preset.swatches[0]} 0%, ${
                        preset.swatches[1] ?? preset.swatches[0]
                      } 50%, ${preset.swatches[2] ?? preset.swatches[0]} 100%)`,
                    }}
                  >
                    <div className="rounded border-2 border-ink-600 bg-paper-50/90 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-600">
                      No preview yet
                    </div>
                  </div>
                )}

                <span className="absolute left-3 top-3 rounded border-2 border-ink-600 bg-paper-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-700 shadow-[2px_2px_0_0_var(--color-ink-600)]">
                  № {(idx + 1).toString().padStart(2, "0")}
                </span>
                <span
                  className={`absolute right-3 top-3 rounded border-2 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] ${GENRE_BADGE[preset.genre]}`}
                >
                  {preset.genre}
                </span>
              </button>

              {/* Body */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-display text-xl font-semibold leading-snug text-ink-700">
                  {preset.presetName}
                </h3>
                <p className="mt-1 flex-1 text-sm text-ink-500">{preset.description}</p>

                {/* Swatches */}
                <div className="mt-3 flex gap-1">
                  {preset.swatches.map((c, i) => (
                    <div
                      key={i}
                      className="h-6 w-6 rounded border-2 border-ink-600"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2 border-t-2 border-dashed border-ink-200 pt-3">
                  <Button
                    size="sm"
                    variant={isSelected ? "primary" : "secondary"}
                    onClick={() => selectPreset(preset)}
                  >
                    {isSelected ? "Selected" : "Use this"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom style builder */}
      <div className="rounded-2xl border-2 border-ink-600 bg-paper-50 p-4 shadow-[5px_5px_0_0_var(--color-ink-600)] sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-ink-600 bg-tomato-500 text-paper-50 shadow-[2px_2px_0_0_var(--color-ink-600)]">
            <Wand2 className="h-4 w-4" />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-tomato-500">
              Fine-tune
            </div>
            <h3 className="font-display text-xl font-semibold text-ink-700">
              Mix your own
            </h3>
          </div>
          <span className="ml-auto h-px flex-1 bg-ink-200" />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="Visual Style"
            placeholder="e.g. Comic book, cel-shaded anime, stylized 3D…"
            value={form.visualStyle}
            onChange={(e) => updateField("visualStyle", e.target.value)}
          />
          <Input
            label="Artistic Medium"
            placeholder="e.g. Ink + halftone, watercolor, CG render"
            value={form.artisticMedium}
            onChange={(e) => updateField("artisticMedium", e.target.value)}
          />
        </div>

        {/* Color palette picker */}
        <div className="mt-6">
          <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
            Color palette
          </label>

          {/* Selected preview + custom color picker */}
          <div className="mb-3 flex min-h-12 flex-wrap items-center gap-2 rounded-lg border-2 border-ink-300 bg-paper-100 px-3 py-2">
            {selectedHexes.length === 0 && (
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                Pick a color &rarr;
              </span>
            )}
            {selectedHexes.map((c, i) => (
              <span
                key={`${c}-${i}`}
                className="group relative inline-flex items-center"
              >
                <span
                  className="block h-7 w-7 rounded border-2 border-ink-600"
                  style={{ backgroundColor: c }}
                  title={c}
                />
                <button
                  type="button"
                  onClick={() => toggleSwatch(c)}
                  className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full border border-ink-600 bg-paper-50 text-ink-600 group-hover:flex"
                  title={`Remove ${c}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}

            {/* Native color picker button */}
            <label
              className="relative inline-flex h-7 cursor-pointer items-center gap-1.5 rounded border-2 border-dashed border-ink-400 bg-paper-50 px-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 hover:border-ink-600 hover:text-ink-700"
              title="Add a custom color"
            >
              <Plus className="h-3 w-3" />
              Custom
              <input
                type="color"
                className="pointer-events-none absolute h-0 w-0 opacity-0"
                onChange={(e) => addCustomColor(e.target.value)}
                disabled={selectedHexes.length >= 6}
              />
            </label>

            {selectedHexes.length >= 6 && (
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-tomato-500">
                Max 6
              </span>
            )}
          </div>

          {/* Swatch library */}
          <div className="space-y-2">
            {SWATCH_LIBRARY.map((group) => (
              <div key={group.label} className="flex items-center gap-3">
                <span className="w-14 shrink-0 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                  {group.label}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {group.colors.map((c) => {
                    const active = selectedHexes.some(
                      (sel) => sel.toLowerCase() === c.toLowerCase(),
                    );
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleSwatch(c)}
                        className={`h-7 w-7 rounded border-2 transition-all ${
                          active
                            ? "border-ink-600 shadow-[2px_2px_0_0_var(--color-tomato-500)]"
                            : "border-ink-300 hover:border-ink-600"
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <Input
            className="mt-3"
            placeholder="e.g. Deep purples, blacks, gold accents — or #rrggbb hex codes"
            value={form.colorPalette}
            onChange={(e) => updateField("colorPalette", e.target.value)}
          />
        </div>

        {/* Lighting & Mood with chips */}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
              Lighting
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {LIGHTING_SUGGESTIONS.map((s) => {
                const active = form.lighting.toLowerCase() === s.toLowerCase();
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateField("lighting", s)}
                    className={`rounded-full border-2 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] transition-all ${
                      active
                        ? "border-ink-600 bg-ochre-300 text-ink-700 shadow-[2px_2px_0_0_var(--color-ink-600)]"
                        : "border-ink-300 bg-paper-50 text-ink-500 hover:border-ink-500"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <Input
              placeholder="Or describe the lighting"
              value={form.lighting}
              onChange={(e) => updateField("lighting", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
              Mood
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {MOOD_SUGGESTIONS.map((s) => {
                const active = form.mood.toLowerCase() === s.toLowerCase();
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateField("mood", s)}
                    className={`rounded-full border-2 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] transition-all ${
                      active
                        ? "border-ink-600 bg-sage-200 text-ink-700 shadow-[2px_2px_0_0_var(--color-ink-600)]"
                        : "border-ink-300 bg-paper-50 text-ink-500 hover:border-ink-500"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <Input
              placeholder="Or describe the mood"
              value={form.mood}
              onChange={(e) => updateField("mood", e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </div>
  );
}
