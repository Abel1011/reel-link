import { useState, useEffect } from "react";
import { NavLink, Outlet, useParams, useLocation } from "react-router-dom";
import {
  Palette,
  Users,
  MapPin,
  FileText,
  Film,
  Clapperboard,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";

const steps = [
  { path: "style", label: "Style", icon: Palette, slug: "Look & Feel" },
  { path: "characters", label: "Cast", icon: Users, slug: "Characters" },
  { path: "locations", label: "Sets", icon: MapPin, slug: "Locations" },
  { path: "script", label: "Script", icon: FileText, slug: "Screenplay" },
  { path: "video", label: "Reel", icon: Film, slug: "Final Cut" },
];

export default function ProjectLayout() {
  const { id } = useParams();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const sidebarContent = (
    <>
      {/* Clapboard header */}
      <div className="relative border-b-2 border-ink-600 bg-paper-50 px-5 pb-5 pt-6">
        <div className="absolute inset-x-0 top-0 flex h-4 overflow-hidden">
          {Array.from({ length: 10 }).map((_, i) => (
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

        <div className="flex items-center justify-between">
          <NavLink
            to="/"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400 transition-colors hover:text-tomato-500"
          >
            <ChevronLeft className="h-3 w-3" />
            Back to reel
          </NavLink>
          {/* Close button — mobile only */}
          <button
            onClick={() => setDrawerOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-400 transition-colors hover:text-ink-700 md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-600 shadow-[2px_2px_0_0_var(--color-tomato-500)]">
            <Clapperboard className="h-4 w-4 text-paper-100" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold text-ink-700">
              Reel<span className="text-tomato-500">&amp;</span>Ink
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-300">
              Production in progress
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-3 px-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
          The workflow
        </div>
        <ul className="space-y-1.5">
          {steps.map(({ path, label, icon: Icon, slug }, i) => (
            <li key={path}>
              <NavLink
                to={`/project/${id}/${path}`}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "border-ink-600 bg-tomato-50 text-ink-700 shadow-[3px_3px_0_0_var(--color-tomato-500)]"
                      : "border-transparent text-ink-500 hover:border-ink-200 hover:bg-paper-50"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-md border-2 transition-all ${
                        isActive
                          ? "border-ink-600 bg-paper-50 text-tomato-500"
                          : "border-ink-200 bg-paper-50 text-ink-400 group-hover:border-ink-300 group-hover:text-ink-600"
                      }`}
                    >
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`font-display font-semibold leading-tight ${
                          isActive ? "text-ink-700" : "text-ink-600"
                        }`}
                      >
                        {label}
                      </div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-300">
                        {slug}
                      </div>
                    </div>
                    <span
                      className={`font-mono text-[10px] font-semibold tabular-nums ${
                        isActive ? "text-tomato-500" : "text-ink-300"
                      }`}
                    >
                      {(i + 1).toString().padStart(2, "0")}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-dashed border-ink-200 px-5 py-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
          Production №
        </div>
        <div className="mt-1 break-all font-mono text-xs text-ink-500">
          {id}
        </div>
      </div>
    </>
  );

  return (
    <div className="relative min-h-screen bg-paper text-ink-600 font-body">
      <svg className="absolute -z-10 h-0 w-0" aria-hidden>
        <defs>
          <filter id="rough">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
            <feDisplacementMap in="SourceGraphic" scale="1.2" />
          </filter>
        </defs>
      </svg>

      {/* ===== Mobile top bar ===== */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b-2 border-ink-600 bg-paper-100 px-4 py-3 md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-ink-600 bg-paper-50 text-ink-700 shadow-[2px_2px_0_0_var(--color-tomato-500)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <Clapperboard className="h-4 w-4 text-ink-600" />
          <span className="font-display text-base font-semibold text-ink-700">
            Reel<span className="text-tomato-500">&amp;</span>Ink
          </span>
        </div>
        {/* Mobile step indicator */}
        <MobileStepIndicator id={id} />
      </header>

      <div className="flex">
        {/* ===== Desktop sidebar ===== */}
        <aside className="hidden w-72 shrink-0 md:block">
          <div className="fixed top-0 left-0 h-screen w-72 flex flex-col border-r-2 border-ink-600 bg-paper-100">
            {sidebarContent}
          </div>
        </aside>

        {/* ===== Mobile drawer overlay ===== */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer panel */}
            <div className="absolute inset-y-0 left-0 w-72 flex flex-col border-r-2 border-ink-600 bg-paper-100 shadow-xl animate-slide-in-left">
              {sidebarContent}
            </div>
          </div>
        )}

        {/* ===== Content ===== */}
        <main className="min-h-screen flex-1 overflow-y-auto bg-paper">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* Compact step indicator for the mobile top bar */
function MobileStepIndicator({ id }: { id: string | undefined }) {
  const location = useLocation();
  const current = steps.findIndex((s) =>
    location.pathname.endsWith(`/${s.path}`)
  );
  if (current < 0) return null;
  const step = steps[current];
  return (
    <div className="ml-auto flex items-center gap-2">
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === current
                ? "w-4 bg-tomato-500"
                : i < current
                  ? "w-1.5 bg-ink-400"
                  : "w-1.5 bg-ink-200"
            }`}
          />
        ))}
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-400">
        {step.label}
      </span>
    </div>
  );
}
