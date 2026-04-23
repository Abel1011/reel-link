import "@hyperframes/player";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Film,
  Sparkles,
  Play,
  CheckCircle,
  Clock,
  Pause,
  Radio,
  Loader2,
} from "lucide-react";
import type { HyperframesPlayer } from "@hyperframes/player";
import { api } from "../lib/api";
import type { StoryProject } from "../lib/types";
import { Button } from "../components/ui/Button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorToast } from "../components/ui/ErrorToast";
import { PageHeader } from "../components/ui/PageHeader";

interface AiLogEntry {
  stage?: string;
  kind?: string;
  error?: string | null;
  responseBytes?: number;
}

interface AiLogResponse {
  entries: AiLogEntry[];
  nextOffset: number;
}

interface StageStep {
  key: string;
  label: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
}

function describeStage(stage: string): string {
  if (stage === "video.agents.preset-review") return "Reviewing style preset";
  if (stage === "video.agents.critique") return "Critiquing direction";
  if (stage === "video.agents.finalize") return "Finalizing direction";
  if (stage === "video.plan") return "Planning shots";
  if (stage === "video.composition.playbook") return "Drafting playbook";
  if (stage === "video.composition.blueprint") return "Drawing blueprint";
  if (stage === "video.composition.author") return "Writing the reel";
  if (stage === "video.composition.repair") return "Repairing the reel";
  if (stage === "video.composition.fallback") return "Falling back to safe cut";
  const section = stage.match(/^video\.agents\.section\.(\d+)$/);
  if (section) return `Directing scene ${Number(section[1]) + 1}`;
  const image = stage.match(/^video\.image\.(\d+)\.(\d+)$/);
  if (image) return `Painting scene ${Number(image[1]) + 1} · shot ${Number(image[2]) + 1}`;
  return stage;
}

function buildTimeline(entries: AiLogEntry[]): StageStep[] {
  const byStage = new Map<string, StageStep>();
  const order: string[] = [];
  for (const entry of entries) {
    const key = entry.stage;
    if (!key || !key.startsWith("video.")) continue;
    if (!byStage.has(key)) {
      order.push(key);
      byStage.set(key, { key, label: describeStage(key), status: "active" });
    }
    const step = byStage.get(key)!;
    if (entry.kind === "response") {
      step.status = entry.error ? "error" : "done";
      if (entry.error) step.detail = entry.error;
    } else if (entry.kind === "request" && step.status !== "done" && step.status !== "error") {
      step.status = "active";
    }
  }
  return order.map((k) => byStage.get(k)!);
}

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const playerRef = useRef<HyperframesPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<StoryProject | null>(null);
  const [generating, setGenerating] = useState(false);
  const [timeline, setTimeline] = useState<StageStep[]>([]);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerPlaying, setPlayerPlaying] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [playerDuration, setPlayerDuration] = useState(0);
  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);

  useEffect(() => {
    api
      .get<StoryProject>(`/api/projects/${id}`)
      .then(setProject)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const sections = project?.script?.sections ?? [];
  const totalSections = sections.length;
  const hasScript = totalSections > 0;
  const composition = project?.composition;
  const hasComposition = !!composition;
  const style = project?.style;
  const orientation = project?.brief?.orientation ?? "landscape";
  const aspectRatio =
    orientation === "portrait" ? "9/16" : orientation === "square" ? "1/1" : "16/9";
  const compositionWidth = orientation === "landscape" ? 1920 : 1080;
  const compositionHeight = orientation === "portrait" ? 1920 : 1080;
  const previewMaxWidth =
    orientation === "portrait" ? "max-w-[280px] sm:max-w-[360px]" : orientation === "square" ? "max-w-[400px] sm:max-w-[520px]" : "";
  const orientationLabel =
    orientation === "portrait"
      ? "9:16 vertical"
      : orientation === "square"
        ? "1:1 square"
        : "16:9 cinematic";

  const playerSrc = hasComposition
    ? composition.htmlPath.startsWith("/assets/")
      ? composition.htmlPath
      : `/assets/${composition.htmlPath}`
    : "";

  const playerStatusLabel = playerError
    ? "Preview issue"
    : playerReady
      ? "Ready"
      : "Loading";
  const playerStatusClass = playerError
    ? "border-crimson-400/40 bg-crimson-500/20 text-crimson-100"
    : playerReady
      ? "border-sage-300/40 bg-sage-400/20 text-sage-50"
      : "border-ochre-300/40 bg-ochre-400/20 text-ochre-50";

  // Poll the AI debug log while generating to render live pipeline progress.
  useEffect(() => {
    if (!generating || !id) return;
    let cancelled = false;
    let timer: number | undefined;

    async function tick() {
      try {
        const res = await api.get<AiLogResponse>(`/api/debug/ai-log/${id}?since=0`);
        if (cancelled) return;
        const videoEntries = res.entries.filter((e) => e.stage?.startsWith("video."));
        setTimeline(buildTimeline(videoEntries));
      } catch {
        // ignore polling errors; the POST will surface any real failure
      } finally {
        if (!cancelled) {
          timer = window.setTimeout(tick, 2000);
        }
      }
    }

    tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [generating, id]);

  useEffect(() => {
    if (!hasComposition) return;
    const activePlayer = playerRef.current;
    if (!activePlayer) return;
    const player = activePlayer;

    setPlayerReady(player.ready);
    setPlayerPlaying(!player.paused);
    setPlayerDuration(player.duration || 0);
    setPlayerCurrentTime(player.currentTime || 0);
    setPlayerError(null);

    function handleReady(event: Event) {
      const detail = (event as CustomEvent<{ duration?: number }>).detail;
      setPlayerReady(true);
      setPlayerDuration(detail?.duration ?? player.duration ?? 0);
      setPlayerError(null);
    }

    function handleTimeUpdate(event: Event) {
      const detail = (event as CustomEvent<{ currentTime?: number }>).detail;
      setPlayerCurrentTime(detail?.currentTime ?? player.currentTime ?? 0);
      setPlayerDuration(player.duration || 0);
    }

    function handlePlay() {
      setPlayerPlaying(true);
    }

    function handlePause() {
      setPlayerPlaying(false);
    }

    function handleError(event: Event) {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setPlayerError(detail?.message ?? "HyperFrames preview failed to load");
      setPlayerReady(false);
      setPlayerPlaying(false);
    }

    function handlePlaybackError() {
      setPlayerError("Playback was blocked before the composition became interactive.");
    }

    player.addEventListener("ready", handleReady);
    player.addEventListener("timeupdate", handleTimeUpdate);
    player.addEventListener("play", handlePlay);
    player.addEventListener("pause", handlePause);
    player.addEventListener("error", handleError);
    player.addEventListener("playbackerror", handlePlaybackError as EventListener);

    return () => {
      player.removeEventListener("ready", handleReady);
      player.removeEventListener("timeupdate", handleTimeUpdate);
      player.removeEventListener("play", handlePlay);
      player.removeEventListener("pause", handlePause);
      player.removeEventListener("error", handleError);
      player.removeEventListener("playbackerror", handlePlaybackError as EventListener);
    };
  }, [playerSrc, hasComposition]);

  function formatPlayerTime(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function handleTogglePreviewPlayback() {
    const player = playerRef.current;
    if (!player) return;
    setPlayerError(null);
    if (player.paused) {
      const result = player.play() as unknown;
      if (result && typeof (result as Promise<void>).catch === "function") {
        (result as Promise<void>).catch(() => {
          /* browser blocked playback; user will retry */
        });
      }
    } else {
      player.pause();
    }
  }

  async function handleGenerateVideo() {
    setGenerating(true);
    setTimeline([]);
    try {
      const updated = await api.post<StoryProject>(`/api/projects/${id}/generate-video`);
      setProject(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate video");
    } finally {
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

  const ctaLabel = hasComposition ? "Recut the reel" : "Generate my reel";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
      <PageHeader
        step="Step 05 · Final Cut"
        title="The final reel"
        subtitle="Compose every scene into a single animated short. Press the button, shout &ldquo;action&rdquo;."
        icon={Film}
      />

      {!hasScript && (
        <div className="rounded-xl border-2 border-dashed border-ink-300 bg-paper-50 py-14 text-center">
          <Film className="mx-auto h-6 w-6 text-ink-300" />
          <p className="mt-3 font-display text-lg font-semibold text-ink-600">
            No script yet
          </p>
          <p className="mt-1 text-sm text-ink-400">
            Write the screenplay and record audio before cutting the reel.
          </p>
        </div>
      )}

      {/* Pre-generation CTA: shown when we have a script and no in-flight job. */}
      {hasScript && !generating && !hasComposition && (
        <div className="mb-8 rounded-2xl border-2 border-ink-600 bg-paper-50 p-4 shadow-[5px_5px_0_0_var(--color-ink-600)] sm:p-6 md:p-8">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-ink-600 bg-tomato-50 text-tomato-500">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-[240px]">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                Ready to roll
              </div>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink-700">
                Ready to generate your reel with the styles you picked?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                We&rsquo;ll assemble {totalSections} scene{totalSections === 1 ? "" : "s"} into a
                single animated short using your locked-in look and audio. This takes a minute or
                two.
              </p>

              <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-lg border-2 border-ink-200 bg-paper-100 px-3 py-2">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                    Style
                  </dt>
                  <dd className="mt-0.5 font-display text-sm font-semibold text-ink-700">
                    {style?.presetName ?? style?.visualStyle ?? "Custom look"}
                  </dd>
                </div>
                <div className="rounded-lg border-2 border-ink-200 bg-paper-100 px-3 py-2">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                    Orientation
                  </dt>
                  <dd className="mt-0.5 font-display text-sm font-semibold text-ink-700">
                    {orientationLabel}
                  </dd>
                </div>
                <div className="rounded-lg border-2 border-ink-200 bg-paper-100 px-3 py-2">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                    Scenes
                  </dt>
                  <dd className="mt-0.5 font-display text-sm font-semibold text-ink-700">
                    {totalSections}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="ml-auto">
              <Button onClick={handleGenerateVideo}>
                <Sparkles className="h-4 w-4" />
                {ctaLabel}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Live pipeline progress while generating. */}
      {generating && (
        <div className="mb-8 rounded-2xl border-2 border-ink-600 bg-paper-50 p-6 shadow-[5px_5px_0_0_var(--color-ink-600)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-ink-600 bg-ochre-100 text-ochre-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                Splicing the reel
              </div>
              <p className="font-display text-lg font-semibold text-ink-700">
                Building your final cut…
              </p>
            </div>
          </div>

          <ol className="mt-6 space-y-2">
            {timeline.length === 0 && (
              <li className="flex items-center gap-3 rounded-lg border-2 border-dashed border-ink-200 bg-paper-100 px-3 py-2 text-sm text-ink-500">
                <Loader2 className="h-4 w-4 animate-spin text-ink-400" />
                Warming up the pipeline…
              </li>
            )}
            {timeline.map((step) => (
              <li
                key={step.key}
                className="flex items-center gap-3 rounded-lg border-2 border-ink-200 bg-paper-100 px-3 py-2 text-sm text-ink-600"
              >
                {step.status === "done" && (
                  <CheckCircle className="h-4 w-4 text-sage-500" />
                )}
                {step.status === "active" && (
                  <Loader2 className="h-4 w-4 animate-spin text-ochre-500" />
                )}
                {step.status === "error" && (
                  <span className="h-4 w-4 rounded-full bg-crimson-500" />
                )}
                {step.status === "pending" && (
                  <span className="h-4 w-4 rounded-full border-2 border-ink-300" />
                )}
                <span className="font-display font-medium">{step.label}</span>
                {step.detail && (
                  <span className="ml-2 truncate text-xs text-crimson-600">{step.detail}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* HyperFrames preview — only shown once a real composition exists. */}
      {!generating && hasComposition && (
        <div className="overflow-hidden rounded-4xl border-2 border-ink-600 bg-paper-50 shadow-[6px_6px_0_0_var(--color-ink-600)]">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink-200 bg-[linear-gradient(135deg,var(--color-paper-50)_0%,var(--color-paper-100)_58%,rgba(217,58,35,0.08)_100%)] px-4 py-5 sm:px-8 sm:py-6">
            <div className="max-w-2xl">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-400">
                Final cut preview
              </div>
              <h2 className="mt-2 font-display text-3xl font-semibold text-ink-700">
                {project?.name ?? "Your reel"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                Your reel is ready. Press play to watch the final cut.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-300 bg-paper-100 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
                <Film className="h-3 w-3" />
                Generated cut
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-300 bg-paper-100 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
                {orientationLabel}
              </span>
              {composition && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-300 bg-paper-100 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
                  <Clock className="h-3 w-3" />
                  {new Date(composition.createdAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="bg-[radial-gradient(circle_at_top,rgba(217,58,35,0.08),transparent_55%)] px-3 py-6 sm:px-6 sm:py-10 md:px-10">
            <div className="mx-auto w-full max-w-3xl">
              <div className="relative overflow-hidden rounded-3xl border-2 border-ink-700 bg-[linear-gradient(180deg,#0f1424_0%,#070a14_100%)] p-3 shadow-[0_30px_80px_-30px_rgba(8,12,24,0.6),6px_6px_0_0_var(--color-ink-700)]">
                <span
                  className={`pointer-events-none absolute right-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] backdrop-blur-md ${playerStatusClass}`}
                >
                  <Radio className="h-3 w-3" />
                  {playerStatusLabel}
                </span>

                <div className={`mx-auto ${previewMaxWidth}`}>
                  <hyperframes-player
                    ref={playerRef}
                    src={playerSrc}
                    width={compositionWidth}
                    height={compositionHeight}
                    controls
                    loop
                    className="block overflow-hidden rounded-2xl bg-[#090d17]"
                    style={{ width: "100%", aspectRatio, display: "block" }}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <Button
                  onClick={handleTogglePreviewPlayback}
                  disabled={!playerReady}
                >
                  {playerPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {playerPlaying ? "Pause" : "Play"}
                </Button>

                <div className="flex items-center gap-3">
                  <span className="rounded-full border-2 border-ink-600 bg-paper-50 px-4 py-1.5 font-mono text-xs tracking-[0.18em] text-ink-600 shadow-[2px_2px_0_0_var(--color-ink-600)]">
                    {formatPlayerTime(playerCurrentTime)} / {formatPlayerTime(playerDuration)}
                  </span>
                  <Button variant="secondary" onClick={handleGenerateVideo}>
                    <Sparkles className="h-4 w-4" />
                    Recut
                  </Button>
                </div>
              </div>

              {playerError && (
                <p className="mt-4 rounded-2xl border-2 border-crimson-500 bg-crimson-50 px-4 py-3 text-sm leading-relaxed text-crimson-700 shadow-[3px_3px_0_0_var(--color-crimson-500)]">
                  {playerError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </div>
  );
}
