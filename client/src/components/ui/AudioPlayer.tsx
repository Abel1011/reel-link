import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  label?: string;
  className?: string;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, label, className = "" }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrent(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
    };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
  }, [src]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    audio.currentTime = ratio * duration;
    setCurrent(audio.currentTime);
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      className={`flex w-full min-w-0 items-center gap-2 rounded-full border-2 border-ink-600 bg-paper-100 px-2 py-1.5 shadow-[2px_2px_0_0_var(--color-ink-600)] ${className}`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink-600 bg-tomato-500 text-paper-50 transition-transform hover:scale-105 active:scale-95"
      >
        {playing ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="ml-0.5 h-3.5 w-3.5" />
        )}
      </button>

      <div
        className="relative h-1.5 min-w-0 flex-1 cursor-pointer rounded-full bg-ink-200"
        onClick={seek}
      >
        <div
          className="h-full rounded-full bg-tomato-500 transition-[width] duration-75"
          style={{ width: `${progress}%` }}
        />
        <div
          className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-ink-600 bg-paper-50 shadow-[1px_1px_0_0_var(--color-ink-600)] transition-opacity"
          style={{ left: `calc(${progress}% - 6px)`, opacity: playing || current > 0 ? 1 : 0 }}
        />
      </div>

      <span
        className="shrink-0 font-mono text-[10px] tabular-nums uppercase tracking-normal text-ink-500"
        title={label}
      >
        {formatTime(current)}/{formatTime(duration)}
      </span>

      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
    </div>
  );
}
