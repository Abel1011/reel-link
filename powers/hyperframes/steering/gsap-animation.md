# GSAP Animation for HyperFrames

GSAP animation reference covering tween methods, easing, stagger, timelines, position parameter, performance, and best practices.

## Core Tween Methods

- `gsap.to(targets, vars)` — animate from current state to `vars`. Most common.
- `gsap.from(targets, vars)` — animate from `vars` to current state (entrances).
- `gsap.fromTo(targets, fromVars, toVars)` — explicit start and end.
- `gsap.set(targets, vars)` — apply immediately (duration 0).

Always use camelCase property names (e.g. `backgroundColor`, `rotationX`).

## Common vars

| Property | Description |
|----------|-------------|
| `duration` | Seconds (default 0.5) |
| `delay` | Seconds before start |
| `ease` | `"power1.out"` (default), `"power3.inOut"`, `"back.out(1.7)"`, `"elastic.out(1, 0.3)"`, `"none"` |
| `stagger` | Number `0.1` or object: `{ amount: 0.3, from: "center" }` |
| `overwrite` | `false` (default), `true`, or `"auto"` |
| `repeat` | Number or `-1` for infinite. `yoyo` alternates direction |
| `immediateRender` | Default `true` for from()/fromTo(). Set `false` on later tweens targeting same property+element |

## Transform Aliases

Prefer GSAP's transform aliases over raw `transform` string:

| GSAP property | Equivalent |
|---------------|------------|
| `x`, `y`, `z` | translateX/Y/Z (px) |
| `xPercent`, `yPercent` | translateX/Y in % |
| `scale`, `scaleX`, `scaleY` | scale |
| `rotation` | rotate (deg) |
| `rotationX`, `rotationY` | 3D rotate |
| `skewX`, `skewY` | skew |
| `transformOrigin` | transform-origin |

- `autoAlpha` — prefer over `opacity`. At 0: also sets `visibility: hidden`.
- CSS variables — `"--hue": 180`
- Relative values — `"+=20"`, `"-=10"`, `"*=2"`
- Directional rotation — `"360_cw"`, `"-170_short"`, `"90_ccw"`

## Function-Based Values

```javascript
gsap.to(".item", {
  x: (i, target, targets) => i * 50,
  stagger: 0.1,
});
```

## Easing

Built-in eases: `power1`–`power4`, `back`, `bounce`, `circ`, `elastic`, `expo`, `sine`. Each has `.in`, `.out`, `.inOut`.

## Timelines

### Creating a Timeline

```javascript
const tl = gsap.timeline({ defaults: { duration: 0.5, ease: "power2.out" } });
tl.to(".a", { x: 100 })
  .to(".b", { y: 50 })
  .to(".c", { opacity: 0 });
```

### Position Parameter

Third argument controls placement:

| Syntax | Meaning |
|--------|---------|
| `1` | Absolute: at 1 second |
| `"+=0.5"` | Relative: after end |
| `"-=0.2"` | Relative: before end |
| `"intro"` | At label |
| `"intro+=0.3"` | 0.3s after label |
| `"<"` | Same start as previous tween |
| `">"` | After previous tween ends |
| `"<0.2"` | 0.2s after previous starts |

```javascript
tl.to(".a", { x: 100 }, 0);
tl.to(".b", { y: 50 }, "<");      // same start as .a
tl.to(".c", { opacity: 0 }, "<0.2"); // 0.2s after .b starts
```

### Labels

```javascript
tl.addLabel("intro", 0);
tl.to(".a", { x: 100 }, "intro");
tl.addLabel("outro", "+=0.5");
tl.play("outro");
tl.tweenFromTo("intro", "outro");
```

### Timeline Options

- `paused: true` — create paused; call `.play()` to start
- `repeat`, `yoyo` — apply to whole timeline
- `defaults` — vars merged into every child tween

### Nesting Timelines

```javascript
const master = gsap.timeline();
const child = gsap.timeline();
child.to(".a", { x: 100 }).to(".b", { y: 50 });
master.add(child, 0);
```

### Playback Control

`tl.play()`, `tl.pause()`, `tl.reverse()`, `tl.restart()`, `tl.time(2)`, `tl.progress(0.5)`, `tl.kill()`

## HyperFrames-Specific Rules

In HyperFrames compositions:

1. Always create timelines with `{ paused: true }` — the framework controls playback
2. Register on `window.__timelines` with `data-composition-id` as key
3. Use position parameter (3rd arg) for absolute timing
4. Only animate visual properties — never control media playback
5. Duration comes from `data-duration`, not GSAP timeline length
6. Framework auto-nests sub-timelines — do NOT manually add them
7. No `repeat: -1` — calculate exact repeat count from composition duration

```javascript
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });

tl.from("#title", { y: 50, opacity: 0, duration: 0.7, ease: "power3.out" }, 0.3);
tl.from("#subtitle", { y: 30, opacity: 0, duration: 0.5, ease: "power2.out" }, 0.6);

window.__timelines["root"] = tl;
```

## Performance

### Prefer Transform and Opacity
Animating `x`, `y`, `scale`, `rotation`, `opacity` stays on the compositor. Avoid `width`, `height`, `top`, `left` when transforms achieve the same effect.

### will-change
```css
will-change: transform;
```
Only on elements that actually animate.

### Stagger > Many Tweens
Use `stagger` instead of separate tweens with manual delays.

## Best Practices

- Use camelCase property names; prefer transform aliases and autoAlpha
- Prefer timelines over chaining with delay; use the position parameter
- Add labels with `addLabel()` for readable sequencing
- Pass defaults into timeline constructor
- Store tween/timeline return value when controlling playback
- Offset first animation 0.1-0.3s (not t=0)
- Vary eases across entrance tweens — at least 3 different eases per scene

## Do Not

- Animate layout properties (width/height/top/left) when transforms suffice
- Use both svgOrigin and transformOrigin on the same SVG element
- Chain animations with delay when a timeline can sequence them
- Create tweens before the DOM exists
- Skip cleanup — always kill tweens when no longer needed
- Use `gsap.set()` on clip elements from later scenes — use `tl.set()` inside the timeline instead
