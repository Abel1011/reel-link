import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Palette,
  Users,
  Image,
  Mic,
  MapPin,
  CheckCircle2,
  Clapperboard,
  Loader2,
  FileText,
} from "lucide-react";
import { api } from "../lib/api";
import { ErrorToast } from "../components/ui/ErrorToast";

const steps = [
  { label: "Lighting the set", detail: "Choosing style & palette", icon: Palette },
  { label: "Casting call", detail: "Inventing the characters", icon: Users },
  { label: "Makeup & wardrobe", detail: "Drawing portraits", icon: Image },
  { label: "Voice lab", detail: "Designing custom voices", icon: Mic },
  { label: "Scouting locations", detail: "Sketching settings", icon: MapPin },
  { label: "Matte paintings", detail: "Rendering backgrounds", icon: Image },
  { label: "Writing the brief", detail: "Drafting premise & tone", icon: FileText },
];

export default function AiModePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const postSent = useRef(false);

  useEffect(() => {
    if (!id) return;

    let pollInterval: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    async function pollProgress() {
      try {
        const res = await api.get<{
          step: number;
          total: number;
          label: string;
          done: boolean;
          error?: string;
        }>(`/api/projects/${id}/ai-generate/progress`);
        if (cancelled) return;
        if (res.error) {
          if (pollInterval) clearInterval(pollInterval);
          setError(res.error);
          return;
        }
        const next = Math.min(res.step, steps.length - 1);
        setCurrentStep((s) => (next > s ? next : s));
        if (res.done) {
          if (pollInterval) clearInterval(pollInterval);
          setDone(true);
          setTimeout(() => {
            if (!cancelled) navigate(`/project/${id}/script`);
          }, 1800);
        }
      } catch {
        // Ignore transient polling errors; the POST is the source of truth
      }
    }

    // Always (re)start polling on every mount so StrictMode remounts recover.
    pollInterval = setInterval(pollProgress, 1000);
    pollProgress();

    // Fire the POST only once across the component's lifetime.
    if (!postSent.current) {
      postSent.current = true;
      api.post(`/api/projects/${id}/ai-generate`).catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Pre-production failed");
      });
    }

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id, navigate]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-12 text-ink-600">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink-600 shadow-[3px_3px_0_0_var(--color-tomato-500)]">
          <Clapperboard className="h-5 w-5 text-paper-100" />
        </div>
        <div className="leading-tight">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-tomato-500">
            Pre-production
          </div>
          <h1 className="font-display text-3xl font-semibold text-ink-700">
            Setting the stage…
          </h1>
        </div>
      </div>

      <div className="w-full max-w-lg rounded-2xl border-2 border-ink-600 bg-paper-50 p-6 shadow-[6px_6px_0_0_var(--color-ink-600)]">
        <div className="mb-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
          <span>Call sheet</span>
          <span>
            {(Math.min(currentStep + (done ? 1 : 1), steps.length))
              .toString()
              .padStart(2, "0")}{" "}
            / {steps.length.toString().padStart(2, "0")}
          </span>
        </div>

        <ol className="space-y-2">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = !done && i === currentStep;
            const isComplete = done || i < currentStep;

            return (
              <li
                key={step.label}
                className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all ${
                  isComplete
                    ? "border-sage-400 bg-sage-50"
                    : isActive
                      ? "border-tomato-500 bg-tomato-50 shadow-[3px_3px_0_0_var(--color-tomato-500)]"
                      : "border-ink-200 bg-paper-50 opacity-60"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 ${
                    isComplete
                      ? "border-sage-400 bg-paper-50 text-sage-500"
                      : isActive
                        ? "border-ink-600 bg-paper-50 text-tomato-500"
                        : "border-ink-200 bg-paper-100 text-ink-300"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 size={18} />
                  ) : isActive ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Icon size={18} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={`font-display font-semibold ${
                      isComplete ? "text-sage-500" : "text-ink-700"
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
                    {step.detail}
                  </div>
                </div>
                <span
                  className={`font-mono text-[10px] font-semibold tabular-nums ${
                    isActive ? "text-tomato-500" : "text-ink-300"
                  }`}
                >
                  {(i + 1).toString().padStart(2, "0")}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {done && (
        <p className="mt-8 font-display italic text-sage-500">
          &ldquo;That&rsquo;s a wrap on pre-pro&rdquo; &mdash; taking you to the writers&rsquo; room…
        </p>
      )}

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </div>
  );
}
