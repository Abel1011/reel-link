import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Wrench,
  Film,
  ArrowRight,
  Clapperboard,
  BookOpen,
  Loader2,
} from "lucide-react";
import { api } from "../lib/api";
import type { StoryProject } from "../lib/types";
import { ErrorToast } from "../components/ui/ErrorToast";

/* Deterministic poster palette (paper-era) per project */
const POSTERS: Array<{ bg: string; ink: string; accent: string }> = [
  { bg: "#f0d9a3", ink: "#1b2133", accent: "#d93a23" }, // mustard paper + tomato
  { bg: "#dde7d6", ink: "#1b2133", accent: "#b92a16" }, // sage paper
  { bg: "#f4c9b5", ink: "#1b2133", accent: "#242b40" }, // peach
  { bg: "#c9d4e4", ink: "#141828", accent: "#d93a23" }, // pale blue
  { bg: "#ead7ff", ink: "#141828", accent: "#b88411" }, // lilac
  { bg: "#f8e3a5", ink: "#1b2133", accent: "#3c633a" }, // sunflower
  { bg: "#e9d3c0", ink: "#141828", accent: "#d93a23" }, // cream
  { bg: "#cfe3d8", ink: "#141828", accent: "#b92a16" }, // mint
];
function posterFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return POSTERS[h % POSTERS.length];
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<StoryProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline creation state (no modal, no hero)
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api
      .get<StoryProject[]>("/api/projects")
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingProjects(false));
  }, []);

  const sorted = useMemo(
    () =>
      [...projects].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [projects]
  );

  async function handleCreate() {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const body: { name: string; mode: string; prompt?: string } = {
        name: name.trim(),
        mode,
      };
      if (mode === "ai" && prompt.trim()) body.prompt = prompt.trim();
      const project = await api.post<StoryProject>("/api/projects", body);
      navigate(
        mode === "ai"
          ? `/project/${project.id}/ai-generate`
          : `/project/${project.id}/style`
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo crear el proyecto");
      setCreating(false);
    }
  }

  const canSubmit = name.trim().length > 0 && !creating;

  return (
    <div className="relative min-h-screen bg-paper text-ink-600 font-body">
      {/* SVG filters used for paper/ink feel */}
      <svg className="absolute -z-10 h-0 w-0" aria-hidden>
        <defs>
          <filter id="rough">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
            <feDisplacementMap in="SourceGraphic" scale="1.2" />
          </filter>
        </defs>
      </svg>

      {/* ===== Top bar ===== */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-ink-600 shadow-[3px_3px_0_0_var(--color-tomato-500)]">
            <Clapperboard className="h-5 w-5 text-paper-100" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-[22px] font-semibold text-ink-700">
              Reel<span className="text-tomato-500">&amp;</span>Ink
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-300">
              Animated Story Studio
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-300">
            {sorted.length.toString().padStart(2, "0")} in the reel
          </span>
          <span className="h-3 w-px bg-ink-200" />
          <span className="font-display italic text-sm text-ink-400">
            Every great picture starts on a blank page.
          </span>
        </div>
      </header>

      {/* ===== Main grid: Create card + Recent ===== */}
      <main className="mx-auto max-w-6xl px-6 pb-24 md:px-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* ---- Create (primary) ---- */}
          <section className="relative">
            {/* Clapboard stripe */}
            <div className="absolute -top-2 left-0 right-0 flex h-5 overflow-hidden rounded-t-2xl">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1"
                  style={{
                    background: i % 2 === 0 ? "#141828" : "#f8f2e3",
                    transform: "skewX(-18deg)",
                  }}
                />
              ))}
            </div>

            <div className="relative rounded-2xl border-2 border-ink-600 bg-paper-50 pt-8 shadow-[10px_12px_0_0_var(--color-ink-600)]">
              {/* Tape stickers */}
              <div className="tape -top-2 left-10 rotate-[-4deg]" />
              <div className="tape -top-2 right-10 rotate-3" />

              <div className="px-8 pb-8 pt-2 md:px-10">
                <div className="mb-1 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-tomato-500">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-tomato-500" />
                  New production
                </div>
                <h1 className="font-display text-4xl font-semibold leading-[1.05] text-ink-700 md:text-5xl">
                  What story are we{" "}
                  <span className="highlight italic">filming</span> today?
                </h1>
                <p className="mt-3 max-w-xl text-[15px] text-ink-400">
                  Name your picture, pick how you want to build it, and roll.
                  Nothing is locked in&nbsp;&mdash;&nbsp;you review every step
                  along the way.
                </p>

                {/* Title input */}
                <label className="mt-7 block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
                    Working Title
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canSubmit) handleCreate();
                    }}
                    placeholder="The Fox Who Drew the Moon"
                    className="mt-1 w-full border-0 border-b-2 border-dashed border-ink-300 bg-transparent px-0 py-2 font-display text-2xl font-semibold text-ink-700 placeholder-ink-200 outline-none transition focus:border-tomato-500"
                  />
                </label>

                {/* Mode switch - two stamped cards */}
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <ModeCard
                    active={mode === "ai"}
                    onClick={() => setMode("ai")}
                    icon={<Sparkles className="h-4 w-4" />}
                    label="Guided by AI"
                    hint={
                      <>
                        Give an idea. AI drafts the story, cast and scenes
                        &mdash; you approve each step.
                      </>
                    }
                    activeColor="tomato"
                  />
                  <ModeCard
                    active={mode === "manual"}
                    onClick={() => setMode("manual")}
                    icon={<Wrench className="h-4 w-4" />}
                    label="Handcrafted"
                    hint={
                      <>
                        Build it yourself: style, cast, locations and script,
                        one piece at a time.
                      </>
                    }
                    activeColor="sage"
                  />
                </div>

                {/* Prompt area (AI only) */}
                {mode === "ai" && (
                  <label className="mt-5 block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
                      Logline / Idea
                    </span>
                    <div className="mt-1 rounded-xl border-2 border-ink-600 bg-paper-100 bg-ruled p-4 shadow-[4px_4px_0_0_var(--color-ink-600)]">
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A brave fox embarks on a journey through an enchanted forest where colors have gone silent..."
                        rows={3}
                        className="w-full resize-none bg-transparent font-display text-[17px] italic leading-8 text-ink-700 placeholder-ink-300 outline-none"
                      />
                    </div>
                  </label>
                )}

                {/* CTA */}
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <button
                    onClick={handleCreate}
                    disabled={!canSubmit}
                    className="group inline-flex items-center gap-3 rounded-full bg-tomato-500 px-7 py-3.5 font-display text-base font-semibold text-paper-50 shadow-[4px_4px_0_0_var(--color-ink-600)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-ink-600)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_0_var(--color-ink-600)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Clapperboard className="h-4 w-4" />
                    )}
                    Roll camera
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-300">
                    press Enter
                  </span>
                </div>
              </div>
            </div>

            {/* Tiny footer motto */}
            <div className="mt-6 flex items-center gap-3 text-ink-300">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
                Draft
              </span>
              <span className="h-px w-8 bg-ink-200" />
              <span className="font-display italic text-sm">
                Nothing renders until you say &ldquo;action&rdquo;.
              </span>
            </div>
          </section>

          {/* ---- Recent Projects (sidebar on desktop) ---- */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
                  Archive
                </div>
                <h2 className="font-display text-2xl font-semibold text-ink-700">
                  Your reel
                </h2>
              </div>
              <div className="font-mono text-[11px] text-ink-300">
                {sorted.length.toString().padStart(2, "0")} films
              </div>
            </div>

            {loadingProjects ? (
              <div className="flex items-center gap-2 py-10 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading reel
              </div>
            ) : sorted.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-ink-300 bg-paper-50 p-6 text-center">
                <BookOpen className="mx-auto h-6 w-6 text-ink-300" />
                <p className="mt-3 font-display text-lg font-semibold text-ink-600">
                  Blank slate
                </p>
                <p className="mt-1 text-sm text-ink-400">
                  Your first short will appear here.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {sorted.map((p, i) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    index={i}
                    onOpen={() => navigate(`/project/${p.id}`)}
                  />
                ))}
              </ul>
            )}
          </aside>
        </div>
      </main>

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </div>
  );
}

/* ------------------------------------------------------------ */
/* Mode card (stamped, paper style) */
function ModeCard({
  active,
  onClick,
  icon,
  label,
  hint,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: React.ReactNode;
  activeColor: "tomato" | "sage";
}) {
  const activeRing =
    activeColor === "tomato"
      ? "border-tomato-500 bg-tomato-50 shadow-[4px_4px_0_0_var(--color-tomato-500)]"
      : "border-sage-400 bg-sage-50 shadow-[4px_4px_0_0_var(--color-sage-400)]";
  const activeText =
    activeColor === "tomato" ? "text-tomato-600" : "text-sage-500";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all ${
        active
          ? activeRing
          : "border-ink-300 bg-paper-50 shadow-[3px_3px_0_0_var(--color-ink-200)] hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--color-ink-300)]"
      }`}
    >
      <div
        className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] ${
          active ? activeText : "text-ink-300"
        }`}
      >
        {icon}
        {active ? "Selected" : "Option"}
      </div>
      <div className="font-display text-lg font-semibold text-ink-700">
        {label}
      </div>
      <div className="text-[13px] text-ink-400">{hint}</div>
    </button>
  );
}

/* ------------------------------------------------------------ */
/* Poster-style project card */
function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: StoryProject;
  index: number;
  onOpen: () => void;
}) {
  const p = posterFor(project.id);
  const date = new Date(project.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  return (
    <li>
      <button
        onClick={onOpen}
        className="group flex w-full items-stretch gap-4 rounded-xl border-2 border-ink-600 bg-paper-50 p-3 text-left shadow-[4px_4px_0_0_var(--color-ink-600)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--color-ink-600)]"
      >
        {/* Poster */}
        <div
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md"
          style={{ backgroundColor: p.bg }}
        >
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(rgba(20,24,40,0.18) 1px, transparent 1.5px)",
              backgroundSize: "5px 5px",
            }}
          />
          <div
            className="absolute bottom-1.5 left-1.5 right-1.5 h-0.75 rounded-full"
            style={{ backgroundColor: p.accent }}
          />
          <div
            className="absolute left-1.5 top-1.5 font-mono text-[9px] font-bold uppercase tracking-widest"
            style={{ color: p.ink }}
          >
            â„–{(index + 1).toString().padStart(2, "0")}
          </div>
          <Film
            className="absolute bottom-1.5 right-1.5 h-4 w-4"
            style={{ color: p.accent }}
          />
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
              {project.mode === "ai" ? "Auto-Script" : "Scene by Scene"}
            </div>
            <div className="truncate font-display text-[17px] font-semibold leading-tight text-ink-700 group-hover:text-tomato-600">
              {project.name}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-300">
              {date}
            </span>
            <ArrowRight className="h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-1 group-hover:text-tomato-500" />
          </div>
        </div>
      </button>
    </li>
  );
}
