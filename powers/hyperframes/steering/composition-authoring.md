# HyperFrames Composition Authoring

Complete guide for writing HyperFrames HTML compositions. Covers structure, timing, layout, animation rules, scene transitions, and quality checks.

## Approach

Before writing HTML, think at a high level:

1. **What** — what should the viewer experience? Identify the narrative arc, key moments, and emotional beats.
2. **Structure** — how many compositions, which are sub-compositions vs inline, what tracks carry what (video, audio, overlays, captions).
3. **Timing** — which clips drive the duration, where do transitions land, what's the pacing.
4. **Layout** — build the end-state first (see Layout Before Animation below).
5. **Animate** — then add motion using the rules below.

## Data Attributes

### All Clips

| Attribute | Required | Values |
|-----------|----------|--------|
| `id` | Yes | Unique identifier |
| `data-start` | Yes | Seconds or clip ID reference (`"el-1"`, `"intro + 2"`) |
| `data-duration` | Required for img/div/compositions | Seconds. Video/audio defaults to media duration. |
| `data-track-index` | Yes | Integer. Same-track clips cannot overlap. |
| `data-media-start` | No | Trim offset into source (seconds) |
| `data-volume` | No | 0-1 (default 1) |

`data-track-index` does NOT affect visual layering — use CSS `z-index`.

### Composition Clips

| Attribute | Required | Values |
|-----------|----------|--------|
| `data-composition-id` | Yes | Unique composition ID |
| `data-start` | Yes | Start time (root composition: use `"0"`) |
| `data-duration` | Yes | Takes precedence over GSAP timeline duration |
| `data-width` / `data-height` | Yes | Pixel dimensions (1920x1080 or 1080x1920) |
| `data-composition-src` | No | Path to external HTML file |

## Composition Structure

Sub-compositions loaded via `data-composition-src` use a `<template>` wrapper. Standalone compositions (the main index.html) do NOT use `<template>` — they put the `data-composition-id` div directly in `<body>`.

### Sub-composition structure:

```html
<template id="my-comp-template">
  <div data-composition-id="my-comp" data-width="1920" data-height="1080">
    <!-- content -->
    <style>
      [data-composition-id="my-comp"] { /* scoped styles */ }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      // tweens...
      window.__timelines["my-comp"] = tl;
    </script>
  </div>
</template>
```

Load in root:
```html
<div id="el-1" data-composition-id="my-comp"
     data-composition-src="compositions/my-comp.html"
     data-start="0" data-duration="10" data-track-index="1"></div>
```

## Relative Timing

Reference another clip's ID in `data-start` to mean "start when that clip ends":

```html
<video id="intro" data-start="0" data-duration="10" data-track-index="0" src="..."></video>
<video id="main" data-start="intro" data-duration="20" data-track-index="0" src="..."></video>
<video id="outro" data-start="main" data-duration="5" data-track-index="0" src="..."></video>
```

Offsets for gaps and overlaps:
```html
<video data-start="intro + 2" ...></video>   <!-- 2s gap after intro -->
<video data-start="intro - 0.5" ...></video> <!-- 0.5s overlap -->
```

Rules:
- Same composition only — cannot reference clips in sibling/parent compositions
- No circular references
- Referenced clip must have a known duration
- Keep chains under 3-4 levels

## Video and Audio

Video must be `muted playsinline`. Audio is always a separate `<audio>` element:

```html
<video id="el-v" data-start="0" data-duration="30" data-track-index="0"
       src="video.mp4" muted playsinline></video>
<audio id="el-a" data-start="0" data-duration="30" data-track-index="2"
       src="video.mp4" data-volume="1"></audio>
```

## Layout Before Animation

Position every element where it should be at its most visible moment — the frame where it's fully entered, correctly placed, and not yet exiting. Write this as static HTML+CSS first. No GSAP yet.

### The process:

1. Identify the hero frame for each scene — the moment when the most elements are simultaneously visible.
2. Write static CSS for that frame. Use `width: 100%; height: 100%; padding: Npx;` with `display: flex; flex-direction: column; gap: Npx; box-sizing: border-box`. Use padding to push content inward. Reserve `position: absolute` for decoratives only.
3. Add entrances with `gsap.from()` — animate FROM offscreen/invisible TO the CSS position.
4. Add exits with `gsap.to()` — animate TO offscreen/invisible FROM the CSS position.

```css
.scene-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 120px 160px;
  gap: 24px;
  box-sizing: border-box;
}
```

```js
// Entrances
tl.from(".title", { y: 60, opacity: 0, duration: 0.6, ease: "power3.out" }, 0);
tl.from(".subtitle", { y: 40, opacity: 0, duration: 0.5, ease: "power3.out" }, 0.2);

// Exits
tl.to(".title", { y: -40, opacity: 0, duration: 0.4, ease: "power2.in" }, 3);
tl.to(".subtitle", { y: -30, opacity: 0, duration: 0.3, ease: "power2.in" }, 3.1);
```

## Scene Transitions (Non-Negotiable)

Every multi-scene composition MUST follow ALL of these rules:

1. ALWAYS use transitions between scenes. No jump cuts.
2. ALWAYS use entrance animations on every scene. Every element animates IN via `gsap.from()`.
3. NEVER use exit animations except on the final scene. The transition IS the exit. The outgoing scene's content MUST be fully visible at the moment the transition starts.
4. Final scene only: The last scene may fade elements out (e.g., fade to black).

## Animation Guardrails

- Offset first animation 0.1-0.3s (not t=0)
- Vary eases across entrance tweens — use at least 3 different eases per scene
- Avoid full-screen linear gradients on dark backgrounds (H.264 banding)
- 60px+ headlines, 20px+ body, 16px+ data labels for rendered video
- `font-variant-numeric: tabular-nums` on number columns

## Non-Negotiable Rules

1. **Deterministic** — No `Math.random()`, `Date.now()`, or time-based logic. Use seeded PRNG if needed.
2. **GSAP visuals only** — Only animate `opacity`, `x`, `y`, `scale`, `rotation`, `color`, `backgroundColor`, transforms. Never animate `visibility`, `display`, or call `video.play()`.
3. **No animation conflicts** — Never animate the same property on the same element from multiple timelines.
4. **No `repeat: -1`** — Calculate exact repeat count from duration.
5. **Synchronous timeline construction** — Never build timelines inside `async`/`await`, `setTimeout`, or Promises.
6. **Never use `<br>` in content text** — Let text wrap via `max-width`. Exception: short display titles.

### Never Do:
1. Forget `window.__timelines` registration
2. Use video for audio — always muted video + separate `<audio>`
3. Nest video inside a timed div — use a non-timed wrapper
4. Use `data-layer` (use `data-track-index`) or `data-end` (use `data-duration`)
5. Animate video element dimensions — animate a wrapper div
6. Call play/pause/seek on media — framework owns playback
7. Create a top-level container without `data-composition-id`
8. Use `gsap.set()` on clip elements from later scenes — use `tl.set()` inside the timeline instead

## Captions

Add these attributes to the root for caption compositions:
```html
<div data-composition-id="captions"
     data-timeline-role="captions"
     data-caption-root="true">
```

## Typography and Assets

- Fonts: Write the `font-family` in CSS — the compiler embeds supported fonts automatically
- Add `crossorigin="anonymous"` to external media
- For dynamic text overflow, use `window.__hyperframes.fitTextFontSize(text, { maxWidth, fontFamily, fontWeight })`
- All files live at the project root alongside `index.html`; sub-compositions use `../`

## Output Checklist

- [ ] `npx hyperframes lint` and `npx hyperframes validate` both pass
- [ ] Contrast warnings addressed (WCAG AA: 4.5:1 normal text, 3:1 large text)
- [ ] Animation choreography verified
- [ ] No exit animations before transitions (except final scene)
- [ ] All timelines registered on `window.__timelines`
- [ ] All visible timed elements have `class="clip"`
