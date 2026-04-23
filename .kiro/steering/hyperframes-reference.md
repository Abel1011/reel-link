---
inclusion: manual
---

# HyperFrames Reference

HyperFrames is an open-source video rendering framework that turns HTML into deterministic, frame-by-frame rendered video. Compositions are plain HTML files with data attributes for timing and GSAP timelines for animation.

Docs: https://hyperframes.heygen.com/introduction
Source: https://github.com/heygen-com/hyperframes

## Composition Structure

Every composition needs a root element with `data-composition-id`:

```html
<div id="root" data-composition-id="my-video"
     data-start="0" data-width="1920" data-height="1080">
  <!-- clips go here -->
</div>
```

Common sizes:
- Landscape: `data-width="1920" data-height="1080"`
- Portrait: `data-width="1080" data-height="1920"`
- Square: `data-width="1080" data-height="1080"`

## Clip Types

- `<video>` — video clips (B-roll, A-roll)
- `<img>` — static images, overlays
- `<audio>` — music, sound effects, narration
- `<div data-composition-id="...">` — nested compositions

## Data Attributes

### Timing
| Attribute | Description |
|-----------|-------------|
| `data-start` | Start time in seconds, or a clip ID for relative timing |
| `data-duration` | Duration in seconds (required for images, optional for video/audio) |
| `data-track-index` | Timeline track number — controls z-ordering (higher = in front) |

### Media
| Attribute | Description |
|-----------|-------------|
| `data-media-start` | Playback offset / trim point in seconds |
| `data-volume` | Volume 0 to 1 |
| `data-has-audio` | Indicates video has an audio track |

### Composition
| Attribute | Description |
|-----------|-------------|
| `data-composition-id` | Unique ID (required on every composition) |
| `data-width` / `data-height` | Composition dimensions in pixels |
| `data-composition-src` | Path to external composition HTML file |
| `data-variable-values` | JSON object of values passed to nested composition |

## Element Visibility

Add `class="clip"` to all timed visible elements:

```html
<h1 id="title" class="clip"
    data-start="0" data-duration="5" data-track-index="0">
  Hello World
</h1>
```

## Relative Timing

Reference another clip's ID in `data-start` to mean "start when that clip ends":

```html
<video id="intro" data-start="0" data-duration="10" data-track-index="0" src="..."></video>
<video id="main" data-start="intro" data-duration="20" data-track-index="0" src="..."></video>
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

## GSAP Animation

Timelines are paused and controlled by the HyperFrames runtime:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script>
  const tl = gsap.timeline({ paused: true });
  tl.to("#title", { opacity: 1, duration: 0.5 }, 0);
  window.__timelines = window.__timelines || {};
  window.__timelines["root"] = tl;
</script>
```

### Key Rules
- Always `{ paused: true }` — the framework controls playback
- Register on `window.__timelines` with `data-composition-id` as key
- Use position parameter (3rd arg) for absolute timing: `tl.to(el, vars, 1.5)`
- Only animate visual properties — never control media playback in scripts
- Composition duration = GSAP timeline duration

### Supported Methods
- `tl.to(target, vars, position)` — animate to values
- `tl.from(target, vars, position)` — animate from values
- `tl.fromTo(target, fromVars, toVars, position)` — animate from/to
- `tl.set(target, vars, position)` — set values instantly

### Animatable Properties
`opacity`, `x`, `y`, `scale`, `scaleX`, `scaleY`, `rotation`, `width`, `height`, `visibility`, `color`, `backgroundColor`, and any CSS-animatable property.

### Extending Timeline Duration
If your composition has media longer than the last animation:
```javascript
tl.set({}, {}, 283); // Extend to 283s without affecting elements
```

### What NOT to Do
```javascript
// WRONG: Playing media in scripts
document.getElementById("el-video").play();

// WRONG: Non-paused timeline
const tl = gsap.timeline(); // missing { paused: true }

// WRONG: Manually nesting sub-timelines
masterTL.add(window.__timelines["intro-anim"], 0);
```

## Nested Compositions

### External (recommended for reusable)
```html
<div data-composition-id="intro-anim"
     data-composition-src="compositions/intro-anim.html"
     data-start="0" data-track-index="3"></div>
```

External file uses `<template>`:
```html
<template id="intro-anim-template">
  <div data-composition-id="intro-anim" data-width="1920" data-height="1080">
    <div class="title">Welcome!</div>
    <script>
      const tl = gsap.timeline({ paused: true });
      tl.from(".title", { opacity: 0, y: -50, duration: 1 });
      window.__timelines["intro-anim"] = tl;
    </script>
  </div>
</template>
```

### Inline (for one-off compositions)
```html
<div id="root" data-composition-id="root" data-start="0" data-width="1920" data-height="1080">
  <div id="el-5" data-composition-id="intro-anim"
       data-start="0" data-track-index="3"
       data-width="1920" data-height="1080">
    <div class="title">Welcome!</div>
  </div>
  <script>
    const introTl = gsap.timeline({ paused: true });
    introTl.from(".title", { opacity: 0, y: -50, duration: 1 });
    window.__timelines["intro-anim"] = introTl;
  </script>
</div>
```

## Captions
Add these attributes to the root for caption compositions:
```html
<div data-composition-id="captions"
     data-timeline-role="captions"
     data-caption-root="true">
```

## Story Motion Kit (Project-Specific)

This project includes `client/public/hyperframes/story-motion-kit.js` — a custom library of scene builders and animation helpers used by the video composition pipeline.

### Scene Builders
`createSurfacePanel`, `createKicker`, `createHeadline`, `createBodyCopy`, `createBadgeRow`, `createQuoteCard`, `createSceneTag`, `createLowerThird`, `createCaptionBand`, `createAmbientOrb`, `createHalftoneOverlay`, `createRainLines`, `createSpeedLines`, `createInkSlash`, `createFilmGrain`, `createVignette`, `createScanlines`, `createGridPaper`, `createRadialBurst`, `createGradientBackdrop`, `createCaptionBubble`, `createCountdown`, `createTicker`, `createComicPanel`, `createTypewriter`, `createTagRibbon`, `createFocusRing`, `createStampBadge`, `createSfxBurst`, `createNarrationBox`, `createChapterMark`, `createScenePlate`, `createPhotoPanel`, `createSpeechBubble`, `createThoughtBubble`, `createActCard`, `createSplitPanel`, `createLabelChip`

### Animation Helpers
`animateReveal`, `animateCascade`, `animateDrift`, `animatePulse`, `animateFlicker`, `animateShake`, `animateScreamShake`, `animateVibrate`, `animateHeartbeat`, `animateZoomPunch`, `animateColorFlash`, `animateSpin`, `animateSlideIn`, `animateSlideOut`, `animateKenBurns`, `animateWipeReveal`, `animateFadeOut`, `animateTypewriter`, `animateGlitch`, `animateFloat`, `animateSwing`, `animateBounceIn`, `animateBlurIn`, `animateTickerScroll`, `animateBurstExpand`

### Utility Functions
`withLabel(tl, root, ctx, ids)` — adds labeled timeline sections
`withExit(tl, ids, at, duration)` — adds exit animations
`sceneCtx(options)` — creates scene context for builders
