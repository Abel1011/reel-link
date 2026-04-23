---
name: "hyperframes"
displayName: "HyperFrames"
description: "Complete guide for creating HTML-based video compositions with HyperFrames. Covers composition authoring, GSAP animation, CLI commands, and the full video production workflow."
keywords: ["hyperframes", "video", "composition", "gsap", "animation", "html-video", "render"]
author: "HeyGen"
---

# HyperFrames

HyperFrames is an open-source video rendering framework that turns HTML into deterministic, frame-by-frame rendered video. Compositions are plain HTML files with `data-*` attributes for timing, GSAP timelines for animation, and CSS for appearance.

Source: https://github.com/heygen-com/hyperframes
Docs: https://hyperframes.heygen.com

## Overview

- HTML-native — compositions are HTML files with data attributes. No React, no proprietary DSL.
- AI-first — agents already speak HTML. The CLI is non-interactive by default.
- Deterministic rendering — same input = identical output.
- Frame Adapter pattern — bring your own animation runtime (GSAP, Lottie, CSS, Three.js).

## Available Steering Files

- **composition-authoring** — Complete guide for writing HyperFrames HTML compositions: data attributes, structure, timing, layout, animation rules, scene transitions, and quality checks.
- **gsap-animation** — GSAP animation reference: tween methods, easing, stagger, timelines, position parameter, performance, and best practices.
- **cli-reference** — HyperFrames CLI commands: init, lint, preview, render, transcribe, tts, doctor, and troubleshooting.

## Getting Started

### Prerequisites
- Node.js >= 22
- FFmpeg (for rendering to MP4)

### Quick Start

```bash
npx hyperframes init my-video
cd my-video
npx hyperframes preview      # preview in browser (live reload)
npx hyperframes render       # render to MP4
```

### Workflow

1. Scaffold with `npx hyperframes init`
2. Author HTML composition (see composition-authoring steering)
3. Lint with `npx hyperframes lint`
4. Preview with `npx hyperframes preview`
5. Render with `npx hyperframes render`

## Composition Basics

Every composition needs a root element with `data-composition-id`:

```html
<div id="root" data-composition-id="my-video"
     data-start="0" data-width="1920" data-height="1080">
  <!-- clips go here -->
</div>
```

### Clip Types
- `<video>` — video clips (must be `muted playsinline`, audio via separate `<audio>`)
- `<img>` — static images, overlays (requires `data-duration`)
- `<audio>` — music, sound effects, narration
- `<div data-composition-id="...">` — nested compositions

### Key Data Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `data-start` | Yes | Start time in seconds, or clip ID for relative timing |
| `data-duration` | Required for img | Duration in seconds |
| `data-track-index` | Yes | Timeline track (higher = in front). Same-track clips cannot overlap |
| `data-volume` | No | Volume 0-1 (default 1) |
| `data-composition-id` | On compositions | Unique composition ID |
| `data-width` / `data-height` | On compositions | Pixel dimensions |

### Timeline Contract

- All timelines start `{ paused: true }` — the player controls playback
- Register every timeline: `window.__timelines["<composition-id>"] = tl`
- Framework auto-nests sub-timelines — do NOT manually add them
- Duration comes from `data-duration`, not from GSAP timeline length

### Common Sizes
- Landscape: `data-width="1920" data-height="1080"`
- Portrait: `data-width="1080" data-height="1920"`
- Square: `data-width="1080" data-height="1080"`

## Non-Negotiable Rules

1. **Deterministic** — No `Math.random()`, `Date.now()`, or time-based logic
2. **GSAP only for visuals** — Only animate `opacity`, `x`, `y`, `scale`, `rotation`, `color`, `backgroundColor`, transforms. Never animate `visibility`, `display`, or call `video.play()`
3. **No `repeat: -1`** — Infinite repeats break the capture engine. Calculate exact repeat count
4. **Synchronous timeline construction** — Never build timelines inside `async`/`await`, `setTimeout`, or Promises
5. **Video must be muted** — Always `muted playsinline` on `<video>`, audio via separate `<audio>` element
6. **Add `class="clip"`** to all timed visible elements for runtime visibility management

## Troubleshooting

### Rendering fails
Run `npx hyperframes doctor` to check environment (Chrome, FFmpeg, Node, memory).

### Composition not playing
- Verify `data-composition-id` on root element
- Check timeline is registered on `window.__timelines`
- Ensure timeline is created with `{ paused: true }`
- Run `npx hyperframes lint` to catch structural issues

### Audio not playing
- Audio must be a separate `<audio>` element, not from `<video>`
- Check `data-volume` is set (default 1)
- Verify `data-start` and `data-duration` are correct

### Animation not working
- Ensure GSAP is loaded before timeline script
- Use position parameter (3rd arg) for absolute timing
- Never animate the same property on the same element from multiple timelines
- Check that clip elements exist in DOM at page load (use `tl.set()` for later clips)
