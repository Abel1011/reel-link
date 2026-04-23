import type { EffectPreset } from "../types.js";

export const effectPresets: EffectPreset[] = [
  // Speaking presets
  {
    id: "speaking-1",
    situationType: "speaking",
    variant: 1,
    gsapCode: `tl.to("{target}", { scaleX: 1.02, scaleY: 0.98, duration: 0.3, ease: "sine.inOut", yoyo: true, repeat: -1 });`,
    description: "Subtle scale pulse simulating mouth and body movement while speaking",
  },
  {
    id: "speaking-2",
    situationType: "speaking",
    variant: 2,
    gsapCode: `tl.to("{target}", { rotation: 1.5, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: -1 }).to("{target}", { y: -3, duration: 0.4, ease: "sine.inOut", yoyo: true, repeat: -1 }, 0);`,
    description: "Gentle sway with slight vertical bob for an animated speaking feel",
  },
  {
    id: "speaking-3",
    situationType: "speaking",
    variant: 3,
    gsapCode: `tl.to("{target}", { scale: 1.015, duration: 0.8, ease: "sine.inOut", yoyo: true, repeat: -1 }).to("{target}", { y: -2, duration: 1.2, ease: "sine.inOut", yoyo: true, repeat: -1 }, 0);`,
    description: "Breathing effect with slow scale and vertical drift while speaking",
  },

  // Scene transition presets
  {
    id: "scene-transition-1",
    situationType: "scene-transition",
    variant: 1,
    gsapCode: `tl.fromTo("{target}", { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power1.inOut" });`,
    description: "Smooth crossfade transition into the new scene",
  },
  {
    id: "scene-transition-2",
    situationType: "scene-transition",
    variant: 2,
    gsapCode: `tl.from("{target}", { x: "100%", duration: 0.8, ease: "power2.out" });`,
    description: "Slide in from the right for a dynamic scene change",
  },
  {
    id: "scene-transition-3",
    situationType: "scene-transition",
    variant: 3,
    gsapCode: `tl.from("{target}", { scale: 0.6, opacity: 0, duration: 1, ease: "back.out(1.4)" });`,
    description: "Zoom in from center with fade for a cinematic scene reveal",
  },

  // Character entrance presets
  {
    id: "character-entrance-1",
    situationType: "character-entrance",
    variant: 1,
    gsapCode: `tl.from("{target}", { opacity: 0, y: 80, duration: 0.8, ease: "power2.out" });`,
    description: "Fade in rising from below the frame",
  },
  {
    id: "character-entrance-2",
    situationType: "character-entrance",
    variant: 2,
    gsapCode: `tl.from("{target}", { scale: 0, opacity: 0, duration: 0.6, ease: "back.out(1.7)" });`,
    description: "Pop in from center with elastic overshoot",
  },
  {
    id: "character-entrance-3",
    situationType: "character-entrance",
    variant: 3,
    gsapCode: `tl.from("{target}", { x: "-100%", opacity: 0, duration: 0.7, ease: "power3.out" });`,
    description: "Slide in from the left side of the frame",
  },

  // Character exit presets
  {
    id: "character-exit-1",
    situationType: "character-exit",
    variant: 1,
    gsapCode: `tl.to("{target}", { opacity: 0, y: -60, duration: 0.7, ease: "power2.in" });`,
    description: "Fade out drifting upward",
  },
  {
    id: "character-exit-2",
    situationType: "character-exit",
    variant: 2,
    gsapCode: `tl.to("{target}", { scale: 0, opacity: 0, duration: 0.5, ease: "power3.in" });`,
    description: "Shrink to center and vanish",
  },
  {
    id: "character-exit-3",
    situationType: "character-exit",
    variant: 3,
    gsapCode: `tl.to("{target}", { x: "100%", opacity: 0, duration: 0.6, ease: "power2.in" });`,
    description: "Slide off to the right side of the frame",
  },

  // Emphasis presets
  {
    id: "emphasis-1",
    situationType: "emphasis",
    variant: 1,
    gsapCode: `tl.to("{target}", { scale: 1.15, duration: 0.15, ease: "power4.out" }).to("{target}", { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.4)" });`,
    description: "Quick zoom pulse for dramatic impact",
  },
  {
    id: "emphasis-2",
    situationType: "emphasis",
    variant: 2,
    gsapCode: `tl.to("{target}", { x: -8, duration: 0.05, ease: "none" }).to("{target}", { x: 8, duration: 0.05, ease: "none", yoyo: true, repeat: 5 }).to("{target}", { x: 0, duration: 0.1, ease: "power1.out" });`,
    description: "Rapid horizontal shake for shock or surprise",
  },
  {
    id: "emphasis-3",
    situationType: "emphasis",
    variant: 3,
    gsapCode: `tl.to("{target}", { filter: "brightness(2)", duration: 0.1, ease: "power4.in" }).to("{target}", { filter: "brightness(1)", duration: 0.6, ease: "power2.out" });`,
    description: "Flash glow effect for a dramatic highlight moment",
  },

  // Idle presets
  {
    id: "idle-1",
    situationType: "idle",
    variant: 1,
    gsapCode: `tl.to("{target}", { y: -6, duration: 2, ease: "sine.inOut", yoyo: true, repeat: -1 });`,
    description: "Gentle floating up and down",
  },
  {
    id: "idle-2",
    situationType: "idle",
    variant: 2,
    gsapCode: `tl.to("{target}", { scale: 1.01, duration: 2.5, ease: "sine.inOut", yoyo: true, repeat: -1 });`,
    description: "Subtle breathing scale for a living feel",
  },
  {
    id: "idle-3",
    situationType: "idle",
    variant: 3,
    gsapCode: `tl.to("{target}", { rotation: 1, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 }).to("{target}", { y: -4, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: -1 }, 0);`,
    description: "Slow sway with gentle vertical drift",
  },
];
