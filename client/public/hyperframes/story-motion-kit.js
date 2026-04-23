(function () {
  const STYLE_ID = "story-motion-kit";
  const STYLE_TEXT = `
    :root {
      color-scheme: dark;
    }

    .story-stage {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background:
        radial-gradient(circle at top left, rgba(90, 196, 255, 0.22), transparent 30%),
        radial-gradient(circle at 82% 76%, rgba(255, 122, 89, 0.18), transparent 26%),
        linear-gradient(180deg, #0e1322 0%, #080c18 100%);
      color: #f7f6fb;
    }

    .story-stage::before {
      content: "";
      position: absolute;
      inset: -12%;
      background:
        radial-gradient(circle at 24% 18%, rgba(155, 220, 255, 0.16), transparent 24%),
        radial-gradient(circle at 72% 28%, rgba(255, 211, 106, 0.15), transparent 20%),
        radial-gradient(circle at 62% 82%, rgba(255, 122, 89, 0.14), transparent 22%);
      opacity: 0.9;
      animation: storyAurora 18s ease-in-out infinite;
      pointer-events: none;
    }

    .story-stage::after {
      content: "";
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(to right, rgba(255, 255, 255, 0.045) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
      background-size: 48px 48px;
      opacity: 0.08;
      mix-blend-mode: screen;
      pointer-events: none;
    }

    .clip {
      position: absolute;
    }

    .story-shell {
      border-radius: 42px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: linear-gradient(180deg, rgba(13, 18, 33, 0.92) 0%, rgba(8, 12, 24, 0.82) 100%);
      box-shadow: 0 40px 120px rgba(0, 0, 0, 0.4);
      overflow: hidden;
      backdrop-filter: blur(12px);
    }

    .story-shell::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(140deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 48%),
        radial-gradient(circle at 80% 20%, rgba(255, 211, 106, 0.12), transparent 28%);
      pointer-events: none;
    }

    .story-kicker {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 26px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #9fd9ff;
    }

    .story-headline {
      font-family: "Fraunces", Georgia, serif;
      font-size: 110px;
      line-height: 0.93;
      letter-spacing: -0.05em;
      color: #f7f7fb;
      text-wrap: balance;
    }

    .story-body {
      font-family: "Outfit", system-ui, sans-serif;
      font-size: 32px;
      line-height: 1.45;
      color: rgba(239, 242, 249, 0.82);
    }

    .story-badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .story-badge {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 18px 26px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(255, 255, 255, 0.06);
      color: #f6f7fb;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 22px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .story-badge::before {
      content: "";
      width: 12px;
      height: 12px;
      border-radius: 999px;
      background: #ff925d;
      box-shadow: 0 0 18px rgba(255, 146, 93, 0.65);
    }

    .story-quote-card {
      padding: 30px 32px;
      border-radius: 30px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(7, 11, 21, 0.76);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 24px 80px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(12px);
    }

    .story-quote-eyebrow {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 18px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #9fd9ff;
    }

    .story-quote-text {
      margin-top: 18px;
      font-family: "Fraunces", Georgia, serif;
      font-size: 42px;
      line-height: 1.16;
      color: #f7f7fb;
    }

    .story-quote-meta {
      margin-top: 20px;
      font-size: 22px;
      line-height: 1.4;
      color: rgba(230, 234, 244, 0.72);
    }

    .story-scene-tag {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 18px 22px;
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(8, 12, 23, 0.74);
      backdrop-filter: blur(12px);
      box-shadow: 0 18px 60px rgba(0, 0, 0, 0.22);
    }

    .story-scene-label {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 18px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: rgba(160, 217, 255, 0.84);
    }

    .story-scene-meta {
      font-size: 30px;
      font-weight: 600;
      color: #f7f7fb;
    }

    .story-lower-third {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 24px 30px;
      border-radius: 26px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: linear-gradient(135deg, rgba(12, 16, 29, 0.9), rgba(18, 24, 43, 0.82));
      box-shadow: 0 18px 70px rgba(0, 0, 0, 0.24);
      backdrop-filter: blur(12px);
    }

    .story-lower-third::before {
      content: "";
      width: 10px;
      height: 64px;
      border-radius: 999px;
      background: linear-gradient(180deg, #ffd36a 0%, #ff7a59 100%);
      box-shadow: 0 0 24px rgba(255, 122, 89, 0.42);
      flex: 0 0 auto;
    }

    .story-lower-third-title {
      font-size: 30px;
      font-weight: 700;
      color: #f7f7fb;
    }

    .story-lower-third-subtitle {
      margin-top: 4px;
      font-size: 22px;
      line-height: 1.36;
      color: rgba(233, 237, 246, 0.76);
    }

    .story-caption-band {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px 30px;
      border-radius: 22px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(8, 12, 24, 0.78);
      box-shadow: 0 18px 70px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(12px);
    }

    .story-caption-band span {
      max-width: 1120px;
      font-size: 30px;
      font-weight: 600;
      line-height: 1.32;
      text-align: center;
      color: #ffffff;
      text-shadow: 0 2px 14px rgba(0, 0, 0, 0.55);
    }

    .story-orb {
      border-radius: 999px;
      filter: blur(2px);
      opacity: 0.88;
      background: radial-gradient(circle at 30% 30%, var(--story-orb-a, #ffd36a) 0%, var(--story-orb-b, #ff7a59) 42%, var(--story-orb-c, #3c50ff) 100%);
      box-shadow: 0 0 140px rgba(255, 122, 89, 0.26);
    }

    @keyframes storyAurora {
      0% {
        transform: translate3d(-8%, -5%, 0) scale(1);
      }

      50% {
        transform: translate3d(8%, 5%, 0) scale(1.14);
      }

      100% {
        transform: translate3d(-8%, -5%, 0) scale(1);
      }
    }

    .story-halftone {
      background-image: radial-gradient(circle, rgba(255, 255, 255, 0.92) 0 1.4px, transparent 1.6px);
      background-size: 14px 14px;
      mix-blend-mode: screen;
      opacity: 0.09;
      pointer-events: none;
    }

    .story-rain-lines {
      background-image: repeating-linear-gradient(
        104deg,
        rgba(255, 255, 255, 0.18) 0 2px,
        transparent 2px 22px
      );
      mix-blend-mode: screen;
      pointer-events: none;
      opacity: 0.5;
    }

    .story-speed-lines {
      background: radial-gradient(
        circle at 50% 50%,
        transparent 0 20%,
        rgba(255, 255, 255, 0.72) 20% 21%,
        transparent 21% 24%,
        rgba(255, 255, 255, 0.5) 24% 24.6%,
        transparent 24.6% 28%,
        rgba(255, 255, 255, 0.36) 28% 28.4%,
        transparent 28.4% 33%,
        rgba(255, 255, 255, 0.28) 33% 33.4%,
        transparent 33.4% 40%,
        rgba(255, 255, 255, 0.2) 40% 40.3%,
        transparent 40.3% 100%
      );
      mask: radial-gradient(circle at 50% 50%, transparent 0 16%, black 28% 100%);
      -webkit-mask: radial-gradient(circle at 50% 50%, transparent 0 16%, black 28% 100%);
      mix-blend-mode: screen;
      pointer-events: none;
    }

    .story-ink-slash {
      background: linear-gradient(
        130deg,
        transparent 0 18%,
        rgba(255, 255, 255, 0.92) 18% 22%,
        transparent 22% 100%
      );
      mix-blend-mode: screen;
      pointer-events: none;
      opacity: 0.18;
    }

    .story-film-grain {
      background-image:
        radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
        radial-gradient(rgba(0, 0, 0, 0.12) 1px, transparent 1px);
      background-size: 3px 3px, 5px 5px;
      background-position: 0 0, 1px 2px;
      mix-blend-mode: overlay;
      opacity: 0.4;
      pointer-events: none;
    }

    .story-vignette {
      background: radial-gradient(
        ellipse at center,
        transparent 0 55%,
        rgba(6, 9, 18, 0.75) 100%
      );
      pointer-events: none;
    }

    .story-scanlines {
      background-image: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.35) 0 2px,
        transparent 2px 4px
      );
      mix-blend-mode: multiply;
      opacity: 0.4;
      pointer-events: none;
    }

    .story-grid-paper {
      background-color: rgba(247, 240, 222, 0.04);
      background-image:
        linear-gradient(rgba(247, 240, 222, 0.12) 1px, transparent 1px),
        linear-gradient(90deg, rgba(247, 240, 222, 0.12) 1px, transparent 1px);
      background-size: 54px 54px;
      pointer-events: none;
    }

    .story-radial-burst {
      background: radial-gradient(
        circle at var(--burst-x, 50%) var(--burst-y, 50%),
        var(--burst-color, rgba(255, 122, 89, 0.55)) 0 var(--burst-inner, 180px),
        transparent var(--burst-outer, 360px)
      );
      filter: blur(2px);
      pointer-events: none;
    }

    .story-gradient-backdrop {
      pointer-events: none;
    }

    .story-backdrop-night {
      background:
        radial-gradient(circle at 16% 24%, rgba(74, 102, 180, 0.45) 0%, transparent 45%),
        radial-gradient(circle at 82% 76%, rgba(184, 74, 120, 0.35) 0%, transparent 50%),
        linear-gradient(180deg, #0a0f22 0%, #16182f 100%);
    }

    .story-backdrop-sunset {
      background:
        radial-gradient(circle at 76% 14%, rgba(255, 196, 128, 0.55) 0%, transparent 42%),
        linear-gradient(180deg, #3d1a2b 0%, #722a36 60%, #b55a3a 100%);
    }

    .story-backdrop-cyber {
      background:
        radial-gradient(circle at 20% 80%, rgba(124, 82, 255, 0.38) 0%, transparent 42%),
        radial-gradient(circle at 78% 20%, rgba(80, 220, 255, 0.28) 0%, transparent 42%),
        linear-gradient(135deg, #0b0c1a 0%, #1b0f2a 100%);
    }

    .story-backdrop-paper {
      background:
        radial-gradient(circle at 30% 20%, rgba(218, 184, 126, 0.34) 0%, transparent 45%),
        linear-gradient(180deg, #f4e8d0 0%, #e6d4b0 100%);
    }

    .story-backdrop-mono {
      background: linear-gradient(180deg, #131419 0%, #22242d 100%);
    }

    .story-backdrop-dawn {
      background:
        radial-gradient(circle at 50% 110%, rgba(255, 211, 128, 0.55) 0%, transparent 52%),
        linear-gradient(180deg, #1a2446 0%, #4a3a6a 60%, #d9926a 100%);
    }

    .story-backdrop-storm {
      background:
        radial-gradient(circle at 30% 10%, rgba(110, 130, 170, 0.35) 0%, transparent 50%),
        linear-gradient(180deg, #0b1220 0%, #1a2236 60%, #2a2f40 100%);
    }

    .story-backdrop-melancholy {
      background:
        radial-gradient(circle at 40% 20%, rgba(126, 154, 196, 0.35) 0%, transparent 55%),
        linear-gradient(180deg, #10162a 0%, #1b2240 60%, #2a2d50 100%);
    }

    .story-backdrop-sepia {
      background:
        radial-gradient(circle at 30% 30%, rgba(230, 186, 130, 0.38) 0%, transparent 55%),
        linear-gradient(180deg, #3a2518 0%, #5a3c28 100%);
    }

    .story-sepia-overlay {
      background: linear-gradient(180deg, rgba(210, 160, 88, 0.22) 0%, rgba(120, 70, 30, 0.28) 100%);
      mix-blend-mode: multiply;
      pointer-events: none;
    }

    .story-caption-bubble {
      padding: 14px 18px;
      border-radius: 14px;
      background: rgba(247, 240, 222, 0.96);
      color: #141726;
      font-family: "Outfit", sans-serif;
      font-size: 22px;
      line-height: 1.35;
      border: 3px solid rgba(11, 15, 28, 0.9);
      box-shadow: 6px 8px 0 rgba(11, 15, 28, 0.9);
    }

    .story-caption-bubble .story-caption-label {
      display: block;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 12px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: rgba(20, 23, 38, 0.65);
      margin-bottom: 6px;
    }

    .story-countdown {
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: "Fraunces", Georgia, serif;
      font-weight: 700;
      font-size: 320px;
      line-height: 1;
      color: #ffd36a;
      text-shadow: 0 0 40px rgba(255, 211, 106, 0.45), 8px 8px 0 rgba(11, 15, 28, 0.9);
      letter-spacing: -0.04em;
      will-change: transform, opacity;
    }

    .story-ticker {
      display: flex;
      align-items: center;
      gap: 44px;
      padding: 14px 24px;
      border-top: 2px solid rgba(247, 240, 222, 0.28);
      border-bottom: 2px solid rgba(247, 240, 222, 0.28);
      background: rgba(8, 12, 23, 0.78);
      color: #f7f7fb;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 18px;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
    }

    .story-ticker .story-ticker-track {
      display: flex;
      gap: 44px;
      will-change: transform;
    }

    .story-ticker .story-ticker-item::before {
      content: "◆  ";
      color: #ffd36a;
    }

    .story-comic-panel {
      border: 6px solid rgba(11, 15, 28, 0.95);
      border-radius: 10px;
      background-size: cover;
      background-position: center;
      box-shadow: 0 0 0 3px rgba(247, 240, 222, 0.9), 10px 14px 0 rgba(11, 15, 28, 0.85);
      overflow: hidden;
      transform-origin: 50% 50%;
    }

    .story-comic-panel::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(8, 12, 24, 0) 55%, rgba(8, 12, 24, 0.5) 100%);
    }

    .story-typewriter {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 32px;
      line-height: 1.4;
      color: #f7f7fb;
      white-space: pre-wrap;
    }

    .story-typewriter::after {
      content: "▍";
      margin-left: 4px;
      color: #ffd36a;
      animation: storyCaret 0.8s steps(2) infinite;
    }

    @keyframes storyCaret {
      50% { opacity: 0; }
    }

    .story-tag-ribbon {
      padding: 10px 22px;
      background: #ff7a59;
      color: #0b0f1c;
      font-family: "Outfit", sans-serif;
      font-weight: 700;
      font-size: 22px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      clip-path: polygon(0 0, 100% 0, 92% 50%, 100% 100%, 0 100%, 8% 50%);
    }

    .story-focus-ring {
      border: 2px solid rgba(255, 255, 255, 0.38);
      border-radius: 38px;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 0 140px rgba(0, 0, 0, 0.48);
      pointer-events: none;
    }

    .story-focus-ring::before {
      content: "";
      position: absolute;
      inset: -14px;
      border-radius: 44px;
      border: 1px dashed rgba(255, 255, 255, 0.18);
      pointer-events: none;
    }

    .story-stamp {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 18px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.28);
      background: rgba(8, 12, 23, 0.82);
      color: #f7f7fb;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 15px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      backdrop-filter: blur(10px);
      white-space: nowrap;
    }

    .story-stamp::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #ff7a59;
      box-shadow: 0 0 14px rgba(255, 122, 89, 0.85);
    }

    .story-sfx {
      font-family: "Fraunces", Georgia, serif;
      font-weight: 700;
      font-style: italic;
      font-size: 136px;
      letter-spacing: 0.04em;
      color: #ffd36a;
      line-height: 0.9;
      white-space: nowrap;
      -webkit-text-stroke: 6px rgba(11, 15, 28, 0.95);
      paint-order: stroke fill;
      text-shadow:
        10px 10px 0 rgba(11, 15, 28, 0.95),
        0 0 30px rgba(255, 211, 106, 0.55),
        0 0 14px rgba(0, 0, 0, 0.55);
      transform-origin: 50% 50%;
    }

    .story-narration {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 20px 24px;
      border-radius: 20px;
      border: 2px solid rgba(11, 15, 28, 0.92);
      background: rgba(247, 240, 222, 0.96);
      color: #101422;
      box-shadow: 8px 10px 0 rgba(11, 15, 28, 0.92), 0 20px 60px rgba(0, 0, 0, 0.32);
    }

    .story-narration-label {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 13px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: rgba(16, 20, 34, 0.6);
    }

    .story-narration-text {
      font-family: "Fraunces", Georgia, serif;
      font-size: 26px;
      line-height: 1.3;
      color: #101422;
    }

    .story-chapter-mark {
      display: inline-flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 16px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: rgba(8, 12, 23, 0.72);
      color: #f7f7fb;
      backdrop-filter: blur(10px);
    }

    .story-chapter-label {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 12px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: rgba(160, 217, 255, 0.82);
    }

    .story-chapter-value {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: 0.08em;
    }

    .story-scene-plate {
      border-radius: 30px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      box-shadow: 0 32px 90px rgba(0, 0, 0, 0.42), inset 0 0 140px rgba(4, 7, 16, 0.55);
      overflow: hidden;
      transform-origin: 50% 50%;
      will-change: transform, opacity;
    }

    .story-scene-plate::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(8, 12, 24, 0.08) 0%, rgba(8, 12, 24, 0.55) 100%);
      pointer-events: none;
    }

    .story-photo-panel {
      border-radius: 24px;
      border: 4px solid rgba(11, 15, 28, 0.95);
      outline: 2px solid rgba(247, 240, 222, 0.82);
      outline-offset: -2px;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      box-shadow: 10px 12px 0 rgba(11, 15, 28, 0.88), 0 24px 60px rgba(0, 0, 0, 0.4);
      overflow: hidden;
      transform-origin: 50% 50%;
      will-change: transform, filter, opacity;
    }

    .story-photo-panel::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(8, 12, 24, 0) 55%, rgba(8, 12, 24, 0.55) 100%);
      pointer-events: none;
    }

    .story-photo-caption {
      position: absolute;
      left: 14px;
      right: 14px;
      bottom: 12px;
      padding: 8px 12px;
      border-radius: 10px;
      background: rgba(11, 15, 28, 0.78);
      color: #f7f7fb;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 14px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      backdrop-filter: blur(6px);
    }

    .story-speech-bubble {
      padding: 20px 26px 22px;
      border-radius: 26px;
      border: 3px solid rgba(11, 15, 28, 0.95);
      background: rgba(247, 240, 222, 0.98);
      color: #101422;
      font-family: "Fraunces", Georgia, serif;
      font-size: 30px;
      line-height: 1.24;
      box-shadow: 8px 10px 0 rgba(11, 15, 28, 0.92), 0 18px 50px rgba(0, 0, 0, 0.28);
    }

    .story-speech-bubble::after {
      content: "";
      position: absolute;
      width: 32px;
      height: 32px;
      background: inherit;
      border-right: 3px solid rgba(11, 15, 28, 0.95);
      border-bottom: 3px solid rgba(11, 15, 28, 0.95);
      left: 48px;
      bottom: -16px;
      transform: rotate(45deg);
      border-bottom-right-radius: 6px;
    }

    .story-speech-bubble[data-tail="right"]::after {
      left: auto;
      right: 48px;
    }

    .story-speech-bubble[data-tail="top"]::after {
      bottom: auto;
      top: -16px;
      transform: rotate(-135deg);
    }

    .story-speech-bubble.shout {
      background: #ffd36a;
      color: #101422;
      border-width: 5px;
      transform: rotate(-2deg);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .story-speech-bubble.shout::after {
      background: #ffd36a;
    }

    .story-thought-bubble {
      padding: 22px 28px;
      border-radius: 40px;
      border: 3px dashed rgba(247, 240, 222, 0.85);
      background: rgba(8, 12, 23, 0.72);
      color: #f7f7fb;
      font-family: "Fraunces", Georgia, serif;
      font-style: italic;
      font-size: 28px;
      line-height: 1.3;
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
    }

    .story-thought-bubble::before,
    .story-thought-bubble::after {
      content: "";
      position: absolute;
      border-radius: 999px;
      background: rgba(8, 12, 23, 0.72);
      border: 3px dashed rgba(247, 240, 222, 0.85);
    }

    .story-thought-bubble::before {
      width: 22px;
      height: 22px;
      left: 48px;
      bottom: -30px;
    }

    .story-thought-bubble::after {
      width: 12px;
      height: 12px;
      left: 32px;
      bottom: -52px;
    }

    .story-act-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 18px;
      text-align: center;
      background: linear-gradient(180deg, rgba(12, 16, 29, 0.9) 0%, rgba(8, 12, 24, 0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 42px;
      backdrop-filter: blur(10px);
    }

    .story-act-eyebrow {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 24px;
      letter-spacing: 0.36em;
      text-transform: uppercase;
      color: #9fd9ff;
    }

    .story-act-title {
      font-family: "Fraunces", Georgia, serif;
      font-size: 180px;
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 0.9;
      color: #f7f7fb;
    }

    .story-act-sub {
      font-family: "Outfit", sans-serif;
      font-size: 28px;
      color: rgba(230, 234, 244, 0.72);
      letter-spacing: 0.08em;
    }

    .story-split-panel {
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      border-radius: 0;
      overflow: hidden;
      filter: saturate(0.96);
    }

    .story-split-panel::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(8, 12, 24, 0.05) 40%, rgba(8, 12, 24, 0.55) 100%);
    }

    .story-vignette-label {
      position: absolute;
      left: 50%;
      bottom: 28px;
      transform: translateX(-50%);
      padding: 10px 18px;
      border-radius: 999px;
      background: rgba(11, 15, 28, 0.88);
      color: #f7f7fb;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 14px;
      letter-spacing: 0.26em;
      text-transform: uppercase;
    }

    .story-label-chip {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 18px;
      border-radius: 999px;
      border: 1px solid rgba(255, 211, 106, 0.72);
      background: rgba(11, 15, 28, 0.78);
      color: #ffd36a;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 13px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      backdrop-filter: blur(10px);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.42);
    }

    .story-label-chip::before {
      content: "◉";
      font-size: 16px;
      line-height: 1;
    }
  `;

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    document.head.appendChild(style);
  }

  function toCssValue(value) {
    return typeof value === "number" ? `${value}px` : value;
  }

  function setLayout(el, options) {
    if (options.inset !== undefined) el.style.inset = toCssValue(options.inset);
    if (options.x !== undefined) el.style.left = toCssValue(options.x);
    if (options.y !== undefined) el.style.top = toCssValue(options.y);
    if (options.right !== undefined) el.style.right = toCssValue(options.right);
    if (options.bottom !== undefined) el.style.bottom = toCssValue(options.bottom);
    if (options.width !== undefined) el.style.width = toCssValue(options.width);
    if (options.height !== undefined) el.style.height = toCssValue(options.height);
    if (options.maxWidth !== undefined) el.style.maxWidth = toCssValue(options.maxWidth);
  }

  function applyClipAttributes(el, options) {
    el.classList.add("clip");
    if (options.id) el.id = options.id;
    if (options.start !== undefined) el.dataset.start = String(options.start);
    if (options.duration !== undefined) el.dataset.duration = String(options.duration);
    if (options.trackIndex !== undefined) el.dataset.trackIndex = String(options.trackIndex);
    setLayout(el, options);
    if (options.styles) Object.assign(el.style, options.styles);
  }

  function createElement(tagName, className, options) {
    const el = document.createElement(tagName);
    if (className) el.className = className;
    applyClipAttributes(el, options || {});
    if (options && options.text) el.textContent = options.text;
    if (options && options.html) el.innerHTML = options.html;
    return el;
  }

  function append(root, el) {
    root.appendChild(el);
    return el;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function createSurfacePanel(root, options) {
    return append(root, createElement("div", "story-shell", options));
  }

  function createKicker(root, options) {
    return append(root, createElement("div", "story-kicker", options));
  }

  function createHeadline(root, options) {
    return append(root, createElement("div", "story-headline", options));
  }

  function createBodyCopy(root, options) {
    return append(root, createElement("div", "story-body", options));
  }

  function createBadgeRow(root, options) {
    const row = createElement("div", "story-badge-row", options);
    const items = options.items || [];

    items.forEach(function (item, index) {
      const badge = document.createElement("span");
      badge.className = "story-badge";
      badge.textContent = item;
      if (options.id) {
        badge.id = `${options.id}-item-${index}`;
      }
      row.appendChild(badge);
    });

    return append(root, row);
  }

  function createQuoteCard(root, options) {
    const card = createElement("div", "story-quote-card", options);
    card.innerHTML = [
      `<div class="story-quote-eyebrow">${escapeHtml(options.eyebrow || "Narrator beat")}</div>`,
      `<div class="story-quote-text">${escapeHtml(options.quote || "")}</div>`,
      options.meta
        ? `<div class="story-quote-meta">${escapeHtml(options.meta)}</div>`
        : "",
    ].join("");
    return append(root, card);
  }

  function createSceneTag(root, options) {
    const tag = createElement("div", "story-scene-tag", options);
    tag.innerHTML = [
      `<div class="story-scene-label">${escapeHtml(options.label || "Scene")}</div>`,
      `<div class="story-scene-meta">${escapeHtml(options.meta || "")}</div>`,
    ].join("");
    return append(root, tag);
  }

  function createLowerThird(root, options) {
    const lowerThird = createElement("div", "story-lower-third", options);
    lowerThird.innerHTML = [
      "<div>",
      `<div class="story-lower-third-title">${escapeHtml(options.title || "")}</div>`,
      `<div class="story-lower-third-subtitle">${escapeHtml(options.subtitle || "")}</div>`,
      "</div>",
    ].join("");
    return append(root, lowerThird);
  }

  function createCaptionBand(root, options) {
    const band = createElement("div", "story-caption-band", options);
    band.innerHTML = `<span>${escapeHtml(options.text || "")}</span>`;
    return append(root, band);
  }

  function createAmbientOrb(root, options) {
    const orb = createElement("div", "story-orb", options);
    const palette = options.palette || [];
    if (palette[0]) orb.style.setProperty("--story-orb-a", palette[0]);
    if (palette[1]) orb.style.setProperty("--story-orb-b", palette[1]);
    if (palette[2]) orb.style.setProperty("--story-orb-c", palette[2]);
    if (options.opacity !== undefined) orb.style.opacity = String(options.opacity);
    return append(root, orb);
  }

  function createHalftoneOverlay(root, options) {
    const settings = Object.assign({}, options || {});
    if (settings.inset === undefined) settings.inset = 0;
    const overlay = createElement("div", "story-halftone", settings);
    if (settings.opacity !== undefined) overlay.style.opacity = String(settings.opacity);
    return append(root, overlay);
  }

  function createRainLines(root, options) {
    const settings = Object.assign({ inset: 0 }, options || {});
    const el = createElement("div", "story-rain-lines", settings);
    if (settings.angle !== undefined) {
      el.style.backgroundImage = `repeating-linear-gradient(${settings.angle}deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 22px)`;
    }
    if (settings.opacity !== undefined) el.style.opacity = String(settings.opacity);
    return append(root, el);
  }

  function createSpeedLines(root, options) {
    const settings = Object.assign({ inset: 0 }, options || {});
    const el = createElement("div", "story-speed-lines", settings);
    if (settings.opacity !== undefined) el.style.opacity = String(settings.opacity);
    return append(root, el);
  }

  function createInkSlash(root, options) {
    const settings = Object.assign({}, options || {});
    const el = createElement("div", "story-ink-slash", settings);
    if (settings.angle !== undefined) {
      el.style.background = `linear-gradient(${settings.angle}deg, transparent 0 18%, rgba(255,255,255,0.92) 18% 22%, transparent 22% 100%)`;
    }
    if (settings.opacity !== undefined) el.style.opacity = String(settings.opacity);
    return append(root, el);
  }

  function createFilmGrain(root, options) {
    const settings = Object.assign({ inset: 0 }, options || {});
    const el = createElement("div", "story-film-grain", settings);
    if (settings.opacity !== undefined) el.style.opacity = String(settings.opacity);
    return append(root, el);
  }

  function createVignette(root, options) {
    const settings = Object.assign({ inset: 0 }, options || {});
    const el = createElement("div", "story-vignette", settings);
    if (settings.opacity !== undefined) el.style.opacity = String(settings.opacity);
    return append(root, el);
  }

  function createScanlines(root, options) {
    const settings = Object.assign({ inset: 0 }, options || {});
    const el = createElement("div", "story-scanlines", settings);
    if (settings.opacity !== undefined) el.style.opacity = String(settings.opacity);
    return append(root, el);
  }

  function createGridPaper(root, options) {
    const settings = Object.assign({ inset: 0 }, options || {});
    const el = createElement("div", "story-grid-paper", settings);
    if (settings.size !== undefined) {
      el.style.backgroundSize = `${settings.size}px ${settings.size}px`;
    }
    if (settings.opacity !== undefined) el.style.opacity = String(settings.opacity);
    return append(root, el);
  }

  function createRadialBurst(root, options) {
    const settings = Object.assign({ inset: 0 }, options || {});
    const el = createElement("div", "story-radial-burst", settings);
    if (settings.color) el.style.setProperty("--burst-color", settings.color);
    if (settings.inner !== undefined) el.style.setProperty("--burst-inner", `${settings.inner}px`);
    if (settings.outer !== undefined) el.style.setProperty("--burst-outer", `${settings.outer}px`);
    if (settings.cx !== undefined) el.style.setProperty("--burst-x", `${settings.cx}%`);
    if (settings.cy !== undefined) el.style.setProperty("--burst-y", `${settings.cy}%`);
    if (settings.opacity !== undefined) el.style.opacity = String(settings.opacity);
    return append(root, el);
  }

  function createGradientBackdrop(root, options) {
    const settings = Object.assign({ inset: 0, variant: "night" }, options || {});
    const el = createElement("div", "story-gradient-backdrop", settings);
    el.classList.add(`story-backdrop-${settings.variant}`);
    if (settings.opacity !== undefined) el.style.opacity = String(settings.opacity);
    return append(root, el);
  }

  function createCaptionBubble(root, options) {
    const settings = Object.assign({}, options || {});
    const el = createElement("div", "story-caption-bubble", settings);
    el.innerHTML = [
      settings.label
        ? `<span class="story-caption-label">${escapeHtml(settings.label)}</span>`
        : "",
      `<span>${escapeHtml(settings.text || "")}</span>`,
    ].join("");
    return append(root, el);
  }

  function createCountdown(root, options) {
    const settings = Object.assign({}, options || {});
    const el = createElement("div", "story-countdown", settings);
    el.textContent = settings.text || "3";
    if (settings.color) el.style.color = settings.color;
    return append(root, el);
  }

  function createTicker(root, options) {
    const settings = Object.assign({}, options || {});
    const el = createElement("div", "story-ticker", settings);
    const track = document.createElement("div");
    track.className = "story-ticker-track";
    const items = settings.items || [];
    const html = items
      .map((t) => `<span class="story-ticker-item">${escapeHtml(t)}</span>`)
      .join("");
    track.innerHTML = html + html; // duplicate for seamless scroll
    el.appendChild(track);
    return append(root, el);
  }

  function createComicPanel(root, options) {
    const settings = Object.assign({}, options || {});
    const el = createElement("div", "story-comic-panel", settings);
    if (settings.src) el.style.backgroundImage = `url("${settings.src}")`;
    if (settings.position) el.style.backgroundPosition = settings.position;
    if (settings.filter) el.style.filter = settings.filter;
    if (settings.rotation !== undefined) el.style.transform = `rotate(${settings.rotation}deg)`;
    return append(root, el);
  }

  function createTypewriter(root, options) {
    const settings = Object.assign({}, options || {});
    const el = createElement("div", "story-typewriter", settings);
    el.textContent = "";
    el.dataset.fullText = settings.text || "";
    if (settings.fontSize !== undefined) el.style.fontSize = `${settings.fontSize}px`;
    if (settings.color) el.style.color = settings.color;
    return append(root, el);
  }

  function createTagRibbon(root, options) {
    const settings = Object.assign({}, options || {});
    const el = createElement("div", "story-tag-ribbon", settings);
    el.textContent = settings.text || "";
    if (settings.color) el.style.background = settings.color;
    return append(root, el);
  }

  function createFocusRing(root, options) {
    const settings = Object.assign({}, options || {});
    if (settings.inset === undefined) settings.inset = 60;
    const ring = createElement("div", "story-focus-ring", settings);
    if (settings.opacity !== undefined) ring.style.opacity = String(settings.opacity);
    return append(root, ring);
  }

  function createStampBadge(root, options) {
    const stamp = createElement("div", "story-stamp", options);
    stamp.textContent = options.text || "";
    if (options.rotation !== undefined) {
      stamp.style.transform = `rotate(${options.rotation}deg)`;
    }
    return append(root, stamp);
  }

  function createSfxBurst(root, options) {
    const burst = createElement("div", "story-sfx", options);
    burst.textContent = options.text || "";
    if (options.color) burst.style.color = options.color;
    if (options.fontSize !== undefined) burst.style.fontSize = toCssValue(options.fontSize);
    if (options.rotation !== undefined) {
      burst.style.transform = `rotate(${options.rotation}deg)`;
    }
    return append(root, burst);
  }

  function createNarrationBox(root, options) {
    const box = createElement("div", "story-narration", options);
    const label = options.label || "Narrator";
    box.innerHTML = [
      `<span class="story-narration-label">${escapeHtml(label)}</span>`,
      `<span class="story-narration-text">${escapeHtml(options.text || "")}</span>`,
    ].join("");
    if (options.rotation !== undefined) {
      box.style.transform = `rotate(${options.rotation}deg)`;
    }
    return append(root, box);
  }

  function createChapterMark(root, options) {
    const mark = createElement("div", "story-chapter-mark", options);
    mark.innerHTML = [
      `<span class="story-chapter-label">${escapeHtml(options.label || "Chapter")}</span>`,
      `<span class="story-chapter-value">${escapeHtml(options.value || "")}</span>`,
    ].join("");
    return append(root, mark);
  }

  function createScenePlate(root, options) {
    const plate = createElement("div", "story-scene-plate", options);
    if (options.src) plate.style.backgroundImage = `url("${options.src}")`;
    if (options.position) plate.style.backgroundPosition = options.position;
    if (options.filter) plate.style.filter = options.filter;
    if (options.opacity !== undefined) plate.style.opacity = String(options.opacity);
    return append(root, plate);
  }

  function createPhotoPanel(root, options) {
    const panel = createElement("div", "story-photo-panel", options);
    if (options.src) panel.style.backgroundImage = `url("${options.src}")`;
    if (options.position) panel.style.backgroundPosition = options.position;
    if (options.filter) panel.style.filter = options.filter;
    if (options.rotation !== undefined) {
      panel.style.transform = `rotate(${options.rotation}deg)`;
    }
    if (options.caption) {
      const cap = document.createElement("span");
      cap.className = "story-photo-caption";
      cap.textContent = options.caption;
      panel.appendChild(cap);
    }
    return append(root, panel);
  }

  function createSpeechBubble(root, options) {
    const bubble = createElement("div", "story-speech-bubble", options);
    bubble.textContent = options.text || "";
    if (options.tail) bubble.dataset.tail = options.tail;
    if (options.variant === "shout") bubble.classList.add("shout");
    return append(root, bubble);
  }

  function createThoughtBubble(root, options) {
    const bubble = createElement("div", "story-thought-bubble", options);
    bubble.textContent = options.text || "";
    return append(root, bubble);
  }

  function createActCard(root, options) {
    const card = createElement("div", "story-act-card", options);
    card.innerHTML = [
      options.eyebrow
        ? `<div class="story-act-eyebrow">${escapeHtml(options.eyebrow)}</div>`
        : "",
      `<div class="story-act-title">${escapeHtml(options.title || "")}</div>`,
      options.subtitle
        ? `<div class="story-act-sub">${escapeHtml(options.subtitle)}</div>`
        : "",
    ].join("");
    return append(root, card);
  }

  function createSplitPanel(root, options) {
    const panel = createElement("div", "story-split-panel", options);
    if (options.src) panel.style.backgroundImage = `url("${options.src}")`;
    if (options.position) panel.style.backgroundPosition = options.position;
    if (options.filter) panel.style.filter = options.filter;
    if (options.label) {
      const label = document.createElement("span");
      label.className = "story-vignette-label";
      label.textContent = options.label;
      panel.appendChild(label);
    }
    return append(root, panel);
  }

  function createLabelChip(root, options) {
    const chip = createElement("div", "story-label-chip", options);
    chip.textContent = options.text || "";
    return append(root, chip);
  }

  function animateReveal(tl, selector, options) {
    const settings = options || {};
    const fromVars = { opacity: 0 };
    const toVars = {
      opacity: 1,
      duration: settings.duration !== undefined ? settings.duration : 0.72,
      ease: settings.ease || "power3.out",
    };

    if (settings.x !== undefined) {
      fromVars.x = settings.x;
      toVars.x = 0;
    }

    if (settings.y !== undefined) {
      fromVars.y = settings.y;
      toVars.y = 0;
    }

    if (settings.scale !== undefined) {
      fromVars.scale = settings.scale;
      toVars.scale = 1;
    }

    tl.fromTo(selector, fromVars, toVars, settings.at !== undefined ? settings.at : 0);
    return tl;
  }

  function animateCascade(tl, selectors, options) {
    const settings = options || {};
    const step = settings.step !== undefined ? settings.step : 0.08;

    selectors.forEach(function (selector, index) {
      animateReveal(tl, selector, Object.assign({}, settings, {
        at: (settings.at !== undefined ? settings.at : 0) + index * step,
      }));
    });

    return tl;
  }

  function animateDrift(tl, selector, options) {
    const settings = options || {};
    tl.to(selector, {
      x: settings.x !== undefined ? settings.x : 12,
      y: settings.y !== undefined ? settings.y : -18,
      duration: settings.duration !== undefined ? settings.duration : 3.4,
      ease: settings.ease || "sine.inOut",
      yoyo: settings.yoyo !== undefined ? settings.yoyo : true,
      repeat: settings.repeat !== undefined ? settings.repeat : 1,
    }, settings.at !== undefined ? settings.at : 0);
    return tl;
  }

  function animatePulse(tl, selector, options) {
    const settings = options || {};
    tl.to(selector, {
      scale: settings.scale !== undefined ? settings.scale : 1.018,
      duration: settings.duration !== undefined ? settings.duration : 0.9,
      ease: settings.ease || "sine.inOut",
      yoyo: settings.yoyo !== undefined ? settings.yoyo : true,
      repeat: settings.repeat !== undefined ? settings.repeat : 1,
    }, settings.at !== undefined ? settings.at : 0);
    return tl;
  }

  function animateFlicker(tl, selector, options) {
    const settings = options || {};
    tl.to(selector, {
      opacity: settings.min !== undefined ? settings.min : 0.45,
      duration: settings.duration !== undefined ? settings.duration : 0.12,
      ease: "steps(1)",
      yoyo: true,
      repeat: settings.repeat !== undefined ? settings.repeat : 5,
    }, settings.at !== undefined ? settings.at : 0);
    return tl;
  }

  function animateShake(tl, selector, options) {
    const settings = options || {};
    tl.to(selector, {
      x: settings.amplitude !== undefined ? settings.amplitude : 8,
      duration: settings.duration !== undefined ? settings.duration : 0.08,
      ease: settings.ease || "power1.inOut",
      yoyo: true,
      repeat: settings.repeat !== undefined ? settings.repeat : 5,
    }, settings.at !== undefined ? settings.at : 0);
    return tl;
  }

  function animateScreamShake(tl, selector, options) {
    const settings = options || {};
    const at = settings.at !== undefined ? settings.at : 0;
    const amp = settings.amplitude !== undefined ? settings.amplitude : 14;
    tl.to(selector, {
      keyframes: [
        { x: -amp, y: amp * 0.4, rotation: -1.2 },
        { x: amp, y: -amp * 0.3, rotation: 1.4 },
        { x: -amp * 0.7, y: amp * 0.5, rotation: -0.8 },
        { x: amp * 0.8, y: -amp * 0.2, rotation: 1 },
        { x: -amp * 0.4, y: amp * 0.2, rotation: -0.5 },
        { x: 0, y: 0, rotation: 0 },
      ],
      duration: settings.duration !== undefined ? settings.duration : 0.6,
      ease: "power2.inOut",
    }, at);
    return tl;
  }

  function animateVibrate(tl, selector, options) {
    const settings = options || {};
    tl.to(selector, {
      x: settings.amplitude !== undefined ? settings.amplitude : 2,
      duration: 0.04,
      ease: "none",
      yoyo: true,
      repeat: settings.repeat !== undefined ? settings.repeat : 24,
    }, settings.at !== undefined ? settings.at : 0);
    return tl;
  }

  function animateHeartbeat(tl, selector, options) {
    const settings = options || {};
    const at = settings.at !== undefined ? settings.at : 0;
    const peak = settings.scale !== undefined ? settings.scale : 1.06;
    tl.to(selector, { scale: peak, duration: 0.18, ease: "power2.out" }, at);
    tl.to(selector, { scale: 1, duration: 0.2, ease: "power2.inOut" }, at + 0.18);
    tl.to(selector, { scale: peak * 0.98, duration: 0.16, ease: "power2.out" }, at + 0.42);
    tl.to(selector, { scale: 1, duration: 0.24, ease: "power2.inOut" }, at + 0.58);
    return tl;
  }

  function animateZoomPunch(tl, selector, options) {
    const settings = options || {};
    const at = settings.at !== undefined ? settings.at : 0;
    const peak = settings.scale !== undefined ? settings.scale : 1.18;
    tl.fromTo(
      selector,
      { scale: 1 },
      { scale: peak, duration: 0.22, ease: "power3.out" },
      at,
    );
    tl.to(selector, { scale: 1, duration: 0.45, ease: "power2.inOut" }, at + 0.22);
    return tl;
  }

  function animateColorFlash(tl, selector, options) {
    const settings = options || {};
    const at = settings.at !== undefined ? settings.at : 0;
    const color = settings.color || "rgba(255, 211, 106, 0.5)";
    tl.fromTo(
      selector,
      { filter: "brightness(1) saturate(1)" },
      {
        filter: `drop-shadow(0 0 24px ${color}) brightness(1.4) saturate(1.5)`,
        duration: settings.duration !== undefined ? settings.duration : 0.18,
        ease: "power1.out",
      },
      at,
    );
    tl.to(
      selector,
      { filter: "brightness(1) saturate(1)", duration: 0.5, ease: "power2.inOut" },
      at + 0.22,
    );
    return tl;
  }

  function animateSpin(tl, selector, options) {
    const settings = options || {};
    tl.fromTo(
      selector,
      { rotation: settings.from !== undefined ? settings.from : -12, opacity: 0, scale: 0.7 },
      {
        rotation: 0,
        opacity: 1,
        scale: 1,
        duration: settings.duration !== undefined ? settings.duration : 0.5,
        ease: settings.ease || "back.out(1.8)",
      },
      settings.at !== undefined ? settings.at : 0,
    );
    return tl;
  }

  function animateSlideIn(tl, selector, options) {
    const settings = options || {};
    const from = settings.from || "left";
    const distance = settings.distance !== undefined ? settings.distance : 120;
    const vars = { opacity: 0 };
    if (from === "left") vars.x = -distance;
    if (from === "right") vars.x = distance;
    if (from === "top") vars.y = -distance;
    if (from === "bottom") vars.y = distance;
    tl.fromTo(
      selector,
      vars,
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: settings.duration !== undefined ? settings.duration : 0.6,
        ease: settings.ease || "power3.out",
      },
      settings.at !== undefined ? settings.at : 0,
    );
    return tl;
  }

  function animateSlideOut(tl, selector, options) {
    const settings = options || {};
    const to = settings.to || "left";
    const distance = settings.distance !== undefined ? settings.distance : 120;
    const vars = { opacity: 0 };
    if (to === "left") vars.x = -distance;
    if (to === "right") vars.x = distance;
    if (to === "top") vars.y = -distance;
    if (to === "bottom") vars.y = distance;
    vars.duration = settings.duration !== undefined ? settings.duration : 0.5;
    vars.ease = settings.ease || "power2.in";
    tl.to(selector, vars, settings.at !== undefined ? settings.at : 0);
    return tl;
  }

  function animateKenBurns(tl, selector, options) {
    const settings = options || {};
    const at = settings.at !== undefined ? settings.at : 0;
    const duration = settings.duration !== undefined ? settings.duration : 5;
    tl.fromTo(
      selector,
      {
        scale: settings.fromScale !== undefined ? settings.fromScale : 1,
        x: settings.fromX !== undefined ? settings.fromX : 0,
        y: settings.fromY !== undefined ? settings.fromY : 0,
      },
      {
        scale: settings.toScale !== undefined ? settings.toScale : 1.1,
        x: settings.toX !== undefined ? settings.toX : -20,
        y: settings.toY !== undefined ? settings.toY : -10,
        duration: duration,
        ease: "none",
      },
      at,
    );
    return tl;
  }

  function animateWipeReveal(tl, selector, options) {
    const settings = options || {};
    const at = settings.at !== undefined ? settings.at : 0;
    const direction = settings.direction || "left";
    let fromClip = "inset(0 100% 0 0)";
    if (direction === "left") fromClip = "inset(0 100% 0 0)";
    if (direction === "right") fromClip = "inset(0 0 0 100%)";
    if (direction === "top") fromClip = "inset(100% 0 0 0)";
    if (direction === "bottom") fromClip = "inset(0 0 100% 0)";
    tl.fromTo(
      selector,
      { clipPath: fromClip, webkitClipPath: fromClip, opacity: 1 },
      {
        clipPath: "inset(0 0 0 0)",
        webkitClipPath: "inset(0 0 0 0)",
        duration: settings.duration !== undefined ? settings.duration : 0.8,
        ease: settings.ease || "power3.inOut",
      },
      at,
    );
    return tl;
  }

  function animateFadeOut(tl, selector, options) {
    const settings = options || {};
    tl.to(
      selector,
      {
        opacity: 0,
        y: settings.y !== undefined ? settings.y : -14,
        duration: settings.duration !== undefined ? settings.duration : 0.5,
        ease: "power2.in",
      },
      settings.at !== undefined ? settings.at : 0,
    );
    return tl;
  }

  function animateTypewriter(tl, selector, options) {
    const settings = options || {};
    const at = settings.at !== undefined ? settings.at : 0;
    const duration = settings.duration !== undefined ? settings.duration : 2;
    tl.to({}, {
      duration: duration,
      ease: "none",
      onStart: () => {
        const el = typeof selector === "string" ? document.querySelector(selector) : selector;
        if (!el) return;
        const full = el.dataset.fullText || el.textContent || "";
        el.dataset.fullText = full;
        el.textContent = "";
        const steps = full.length;
        const tweenState = { i: 0 };
        gsap.to(tweenState, {
          i: steps,
          duration: duration,
          ease: "none",
          onUpdate: () => {
            const live = document.querySelector(selector);
            if (!live) return;
            live.textContent = full.slice(0, Math.round(tweenState.i));
          },
        });
      },
    }, at);
    return tl;
  }

  function animateGlitch(tl, selector, options) {
    const settings = options || {};
    const at = settings.at !== undefined ? settings.at : 0;
    const amp = settings.amplitude !== undefined ? settings.amplitude : 10;
    tl.to(selector, {
      keyframes: [
        { x: -amp, filter: "hue-rotate(-25deg) saturate(1.6)" },
        { x: amp * 0.6, filter: "hue-rotate(30deg) saturate(1.4)" },
        { x: -amp * 0.4, skewX: 2, filter: "hue-rotate(-10deg)" },
        { x: amp * 0.8, skewX: -2, filter: "hue-rotate(15deg)" },
        { x: 0, skewX: 0, filter: "hue-rotate(0deg) saturate(1)" },
      ],
      duration: settings.duration !== undefined ? settings.duration : 0.5,
      ease: "steps(5)",
    }, at);
    return tl;
  }

  function animateFloat(tl, selector, options) {
    const settings = options || {};
    tl.to(selector, {
      y: settings.y !== undefined ? settings.y : -12,
      duration: settings.duration !== undefined ? settings.duration : 1.6,
      ease: "sine.inOut",
      yoyo: true,
      repeat: settings.repeat !== undefined ? settings.repeat : 1,
    }, settings.at !== undefined ? settings.at : 0);
    return tl;
  }

  function animateSwing(tl, selector, options) {
    const settings = options || {};
    const at = settings.at !== undefined ? settings.at : 0;
    const ang = settings.angle !== undefined ? settings.angle : 3;
    tl.fromTo(
      selector,
      { rotation: -ang },
      {
        rotation: ang,
        duration: settings.duration !== undefined ? settings.duration : 1.4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: settings.repeat !== undefined ? settings.repeat : 1,
      },
      at,
    );
    return tl;
  }

  function animateBounceIn(tl, selector, options) {
    const settings = options || {};
    tl.fromTo(
      selector,
      { opacity: 0, scale: 0.4, y: settings.from !== undefined ? settings.from : 40 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: settings.duration !== undefined ? settings.duration : 0.7,
        ease: "elastic.out(1, 0.55)",
      },
      settings.at !== undefined ? settings.at : 0,
    );
    return tl;
  }

  function animateBlurIn(tl, selector, options) {
    const settings = options || {};
    tl.fromTo(
      selector,
      { opacity: 0, filter: "blur(24px)" },
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: settings.duration !== undefined ? settings.duration : 0.8,
        ease: settings.ease || "power2.out",
      },
      settings.at !== undefined ? settings.at : 0,
    );
    return tl;
  }

  function animateTickerScroll(tl, selector, options) {
    const settings = options || {};
    const at = settings.at !== undefined ? settings.at : 0;
    const duration = settings.duration !== undefined ? settings.duration : 12;
    const trackSel = `${selector} .story-ticker-track`;
    tl.fromTo(
      trackSel,
      { x: 0 },
      { x: "-50%", duration: duration, ease: "none", repeat: settings.repeat !== undefined ? settings.repeat : 0 },
      at,
    );
    return tl;
  }

  function animateBurstExpand(tl, selector, options) {
    const settings = options || {};
    tl.fromTo(
      selector,
      { scale: 0.2, opacity: 0 },
      {
        scale: settings.scale !== undefined ? settings.scale : 1.2,
        opacity: 1,
        duration: settings.duration !== undefined ? settings.duration : 0.6,
        ease: "power3.out",
      },
      settings.at !== undefined ? settings.at : 0,
    );
    if (settings.fade !== false) {
      tl.to(
        selector,
        { opacity: 0, duration: 0.6, ease: "power2.in" },
        (settings.at !== undefined ? settings.at : 0) + 0.9,
      );
    }
    return tl;
  }

  function createSepiaOverlay(root, options) {
    const settings = Object.assign({ inset: 0 }, options || {});
    const el = createElement("div", "story-sepia-overlay", settings);
    if (settings.opacity !== undefined) el.style.opacity = String(settings.opacity);
    return append(root, el);
  }

  // ================ Scene presets ================
  // Each scene renders an opinionated beat. Usage:
  //   kit.scenes.screamShake(tl, root, { at: 10, duration: 5, image, shout, sfx, label })
  // Options share: at, duration, label (optional chip), trackBase (optional).

  const kitRef = {
    c: 0,
    id(prefix, at) {
      return `${prefix}${Math.round(at * 100)}_${++this.c}`;
    },
  };

  function withLabel(tl, root, ctx, ids) {
    if (!ctx.label) return;
    const lid = kitRef.id("lbl", ctx.at);
    createLabelChip(root, {
      id: lid,
      text: ctx.label,
      x: 146,
      y: 170,
      start: ctx.at + 0.2,
      duration: ctx.duration - 0.4,
      trackIndex: ctx.tk + 8,
    });
    animateReveal(tl, `#${lid}`, { at: ctx.at + 0.3, x: -16, duration: 0.5 });
    ids.push(`#${lid}`);
  }

  function withExit(tl, ids, at, duration) {
    animateFadeOut(tl, ids, { at: at + duration - 0.4, duration: 0.4 });
  }

  function sceneCtx(o) {
    return {
      at: o.at,
      duration: o.duration,
      label: o.label,
      tk: o.trackBase !== undefined ? o.trackBase : 200 + Math.round(o.at * 10),
    };
  }

  const scenes = {};

  scenes.title = function (tl, root, o) {
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("tl-bg", at);
    const card = kitRef.id("tl-card", at);
    const countId = o.countdown ? kitRef.id("tl-cnt", at) : null;
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "night",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createHalftoneOverlay(root, {
      id: kitRef.id("tl-h", at),
      inset: 72,
      opacity: 0.14,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createActCard(root, {
      id: card,
      eyebrow: o.eyebrow,
      title: o.title,
      subtitle: o.subtitle,
      x: 260,
      y: countId ? 200 : 280,
      width: 1400,
      height: countId ? 500 : 520,
      start: at,
      duration: countId ? 3.2 : duration - 0.4,
      trackIndex: tk + 2,
    });
    animateSpin(tl, `#${card}`, { at: at + 0.2, from: -4, duration: 0.9 });
    const ids = [`#${bg}`, `#${card}`];
    if (countId) {
      createCountdown(root, {
        id: countId,
        text: String(o.countdown[0] || "3"),
        x: 860,
        y: 760,
        width: 200,
        height: 320,
        start: at + 3.2,
        duration: duration - 3.2,
        trackIndex: tk + 3,
      });
      animateBounceIn(tl, `#${countId}`, { at: at + 3.2, duration: 0.4 });
      const digits = o.countdown || [3, 2, 1];
      digits.forEach((d, i) => {
        const t = at + 3.2 + i * 0.55;
        tl.call(() => {
          const el = document.querySelector(`#${countId}`);
          if (el) el.textContent = String(d);
        }, null, t);
        if (i > 0) {
          tl.fromTo(
            `#${countId}`,
            { scale: 1.3, opacity: 0.4 },
            { scale: 1, opacity: 1, duration: 0.3, ease: "power3.out" },
            t,
          );
        }
      });
      ids.push(`#${countId}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.kenBurns = function (tl, root, o) {
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const plate = kitRef.id("kb-p", at);
    const halft = kitRef.id("kb-h", at);
    createScenePlate(root, {
      id: plate,
      src: o.image,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createHalftoneOverlay(root, {
      id: halft,
      inset: 72,
      opacity: 0.08,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const ids = [`#${plate}`, `#${halft}`];
    animateWipeReveal(tl, `#${plate}`, { at, direction: o.direction || "left", duration: 0.9 });
    tl.fromTo(`#${halft}`, { opacity: 0 }, { opacity: 0.08, duration: 0.6 }, at + 0.3);
    animateKenBurns(tl, `#${plate}`, {
      at: at + 0.9,
      duration: duration - 1.4,
      fromScale: 1,
      toScale: 1.1,
      toX: -30,
      toY: -12,
    });
    if (o.headline) {
      const hl = kitRef.id("kb-hl", at);
      createHeadline(root, {
        id: hl,
        text: o.headline,
        x: 146,
        y: 330,
        width: 1040,
        start: at + 0.4,
        duration: duration - 0.6,
        trackIndex: tk + 2,
      });
      animateReveal(tl, `#${hl}`, { at: at + 0.6, y: 40, duration: 0.8 });
      ids.push(`#${hl}`);
    }
    if (o.caption) {
      const cp = kitRef.id("kb-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1.2,
        duration: duration - 1.6,
        trackIndex: tk + 3,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1.2, y: 18, duration: 0.6 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.dialogue = function (tl, root, o) {
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("dg-bg", at);
    const rain = kitRef.id("dg-rn", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "night",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    const ids = [`#${bg}`];
    if (o.rain !== false) {
      createRainLines(root, {
        id: rain,
        inset: 72,
        start: at,
        duration,
        trackIndex: tk + 1,
      });
      ids.push(`#${rain}`);
    }

    const variant = o.variant || "split";
    const lines = o.lines || [];
    const slot = (duration - 1.4) / Math.max(lines.length, 1);

    // Compute the actual on-screen window (start / duration) for each line.
    // If the line carries real audio-synced timestamps (ln.start / ln.duration),
    // use those verbatim so the bubble AND any image-swap hit the audio. Fall
    // back to evenly distributed slots only when timestamps are absent.
    function windowForLine(ln, i) {
      const hasTimed = typeof ln.start === "number" && typeof ln.duration === "number";
      if (hasTimed) {
        return { start: at + ln.start, duration: Math.max(0.3, ln.duration) };
      }
      return { start: at + 1 + i * slot, duration: slot * 0.95 };
    }

    // Helper to lay out a single static bubble per line.
    function layoutBubbles(bubbleFactory) {
      lines.forEach((ln, i) => {
        const side = ln.side || (i % 2 === 0 ? "left" : "right");
        const bid = kitRef.id("dg-b", at + i * 0.001);
        const layout = bubbleFactory(side, i);
        const w = windowForLine(ln, i);
        createSpeechBubble(root, {
          id: bid,
          text: ln.text,
          tail: layout.tail || side,
          variant: ln.variant,
          x: layout.x,
          y: layout.y,
          width: layout.width,
          start: w.start,
          duration: w.duration,
          trackIndex: tk + 10 + i,
        });
        animateBounceIn(tl, `#${bid}`, { at: w.start, from: 24, duration: 0.35 });
        animateFadeOut(tl, `#${bid}`, { at: w.start + w.duration - 0.25, duration: 0.25 });
        ids.push(`#${bid}`);
      });
    }

    if (variant === "overShoulder") {
      // Big hero panel on one side, smaller inset of the listener on the opposite corner.
      // The hero swaps to the current speaker.
      const big = kitRef.id("dg-big", at);
      const inset = kitRef.id("dg-ins", at);
      createPhotoPanel(root, {
        id: big,
        src: o.leftImage,
        caption: o.leftCaption,
        x: 160,
        y: 120,
        width: 1120,
        height: 840,
        rotation: -1,
        start: at,
        duration,
        trackIndex: tk + 2,
      });
      createPhotoPanel(root, {
        id: inset,
        src: o.rightImage,
        caption: o.rightCaption,
        x: 1420,
        y: 580,
        width: 400,
        height: 420,
        rotation: 3,
        start: at + 0.3,
        duration: duration - 0.3,
        trackIndex: tk + 3,
      });
      animateSlideIn(tl, `#${big}`, { at, from: "left", distance: 120, duration: 0.8 });
      animateBounceIn(tl, `#${inset}`, { at: at + 0.35, from: 50, duration: 0.6 });
      tl.to(`#${big}`, { scale: 1.03, duration: duration - 0.8, ease: "sine.inOut" }, at + 0.8);
      ids.push(`#${big}`, `#${inset}`);
      // When the current speaker flips, swap the photo sources by cross-fading.
      lines.forEach((ln, i) => {
        const side = ln.side || (i % 2 === 0 ? "left" : "right");
        const w = windowForLine(ln, i);
        // Fire slightly before the line so the visual precedes the voice.
        const t = Math.max(at, w.start - 0.18);
        tl.call(() => {
          const bigEl = document.querySelector(`#${big}`);
          const insEl = document.querySelector(`#${inset}`);
          if (!bigEl || !insEl) return;
          const activeSrc = side === "left" ? o.leftImage : o.rightImage;
          const activeCap = side === "left" ? o.leftCaption : o.rightCaption;
          const passiveSrc = side === "left" ? o.rightImage : o.leftImage;
          const passiveCap = side === "left" ? o.rightCaption : o.leftCaption;
          bigEl.style.backgroundImage = `url("${activeSrc}")`;
          insEl.style.backgroundImage = `url("${passiveSrc}")`;
          const bigCap = bigEl.querySelector(".story-photo-caption");
          const insCap = insEl.querySelector(".story-photo-caption");
          if (bigCap) bigCap.textContent = activeCap || "";
          if (insCap) insCap.textContent = passiveCap || "";
        }, null, t);
        tl.fromTo(`#${big}`, { opacity: 0.6 }, { opacity: 1, duration: 0.25 }, t);
      });
      layoutBubbles((side) => ({
        x: side === "left" ? 180 : 1000,
        y: 860,
        width: 720,
        tail: side,
      }));
    } else if (variant === "stacked") {
      // Diagonally stacked panels, bubble pinned beside each one.
      const L = kitRef.id("dg-L", at);
      const R = kitRef.id("dg-R", at);
      createPhotoPanel(root, {
        id: L,
        src: o.leftImage,
        caption: o.leftCaption,
        x: 90,
        y: 80,
        width: 820,
        height: 560,
        rotation: -4,
        start: at,
        duration,
        trackIndex: tk + 2,
      });
      createPhotoPanel(root, {
        id: R,
        src: o.rightImage,
        caption: o.rightCaption,
        x: 1020,
        y: 440,
        width: 820,
        height: 560,
        rotation: 4,
        start: at + 0.35,
        duration: duration - 0.35,
        trackIndex: tk + 3,
      });
      animateSlideIn(tl, `#${L}`, { at, from: "top", distance: 200, duration: 0.7 });
      animateSlideIn(tl, `#${R}`, { at: at + 0.4, from: "bottom", distance: 200, duration: 0.7 });
      tl.to(`#${L}`, { rotation: -2.4, duration: duration - 0.8, ease: "sine.inOut" }, at + 0.8);
      tl.to(`#${R}`, { rotation: 2.4, duration: duration - 0.8, ease: "sine.inOut" }, at + 0.8);
      ids.push(`#${L}`, `#${R}`);
      layoutBubbles((side) => ({
        // Opposite side from the photo, hugging the free corner.
        x: side === "left" ? 960 : 100,
        y: side === "left" ? 200 : 800,
        width: 540,
        tail: side,
      }));
    } else if (variant === "closeupSwap") {
      // Single large close-up that swaps to whichever character is currently speaking.
      // Bubble sits on the opposite half of the frame.
      const hero = kitRef.id("dg-hero", at);
      createPhotoPanel(root, {
        id: hero,
        src: o.leftImage,
        caption: o.leftCaption,
        x: 140,
        y: 100,
        width: 860,
        height: 880,
        rotation: -1.5,
        start: at,
        duration,
        trackIndex: tk + 2,
      });
      animateSlideIn(tl, `#${hero}`, { at, from: "left", distance: 140, duration: 0.6 });
      animateZoomPunch(tl, `#${hero}`, { at: at + 0.8, scale: 1.05 });
      ids.push(`#${hero}`);
      lines.forEach((ln, i) => {
        const side = ln.side || (i % 2 === 0 ? "left" : "right");
        const w = windowForLine(ln, i);
        // Land the swap ~0.05s before the line so the face matches the voice.
        const t = Math.max(at, w.start - 0.05);
        tl.call(() => {
          const el = document.querySelector(`#${hero}`);
          if (!el) return;
          const src = side === "left" ? o.leftImage : o.rightImage;
          const cap = side === "left" ? o.leftCaption : o.rightCaption;
          el.style.backgroundImage = `url("${src}")`;
          el.style.left = (side === "left" ? 140 : 920) + "px";
          const capEl = el.querySelector(".story-photo-caption");
          if (capEl) capEl.textContent = cap || "";
        }, null, t);
        tl.fromTo(`#${hero}`, { opacity: 0.55, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" }, t);
      });
      layoutBubbles((side) => ({
        // Bubble on the half opposite to where the hero photo currently sits.
        x: side === "left" ? 1080 : 160,
        y: 380,
        width: 700,
        tail: side === "left" ? "right" : "left",
      }));
    } else {
      // Default "split" — two facing panels, bubbles below.
      const L = kitRef.id("dg-L", at);
      const R = kitRef.id("dg-R", at);
      createPhotoPanel(root, {
        id: L,
        src: o.leftImage,
        caption: o.leftCaption,
        x: 140,
        y: 220,
        width: 680,
        height: 720,
        rotation: -2,
        start: at,
        duration,
        trackIndex: tk + 2,
      });
      createPhotoPanel(root, {
        id: R,
        src: o.rightImage,
        caption: o.rightCaption,
        x: 1100,
        y: 220,
        width: 680,
        height: 720,
        rotation: 2,
        start: at + 0.4,
        duration: duration - 0.4,
        trackIndex: tk + 3,
      });
      animateSlideIn(tl, `#${L}`, { at, from: "left", distance: 180, duration: 0.7 });
      animateSlideIn(tl, `#${R}`, { at: at + 0.3, from: "right", distance: 180, duration: 0.7 });
      tl.to(`#${L}`, { y: -8, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: 1 }, at + 0.8);
      tl.to(`#${R}`, { y: 8, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: 1 }, at + 0.8);
      ids.push(`#${L}`, `#${R}`);
      layoutBubbles((side) => ({
        x: side === "left" ? 196 : 1160,
        y: 760,
        width: 520,
        tail: side,
      }));
    }

    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.screamShake = function (tl, root, o) {
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("sc-bg", at);
    const burst = kitRef.id("sc-br", at);
    const photo = kitRef.id("sc-ph", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "mono",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createRadialBurst(root, {
      id: burst,
      inset: 72,
      color: o.burstColor || "rgba(255, 122, 89, 0.6)",
      inner: 120,
      outer: 720,
      cx: 68,
      cy: 48,
      start: at + 1.1,
      duration: duration - 1.5,
      trackIndex: tk + 1,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 520,
      y: 200,
      width: 880,
      height: 720,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    animateReveal(tl, `#${photo}`, { at, scale: 1.08, duration: 0.6 });
    animateBurstExpand(tl, `#${burst}`, { at: at + 1.1, scale: 1.1, duration: 0.4, fade: false });
    animateScreamShake(tl, `#${photo}`, { at: at + 1.1, amplitude: 16, duration: 0.7 });
    const ids = [`#${bg}`, `#${burst}`, `#${photo}`];
    if (o.shout) {
      const sh = kitRef.id("sc-sh", at);
      createSpeechBubble(root, {
        id: sh,
        variant: "shout",
        tail: "bottom",
        text: o.shout,
        x: 200,
        y: 250,
        width: 360,
        start: at + 0.6,
        duration: duration - 1,
        trackIndex: tk + 3,
      });
      animateSpin(tl, `#${sh}`, { at: at + 0.7, from: -12, duration: 0.45 });
      animateScreamShake(tl, `#${sh}`, { at: at + 1.1, amplitude: 10, duration: 0.7 });
      ids.push(`#${sh}`);
    }
    if (o.sfx) {
      const fx = kitRef.id("sc-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 1320,
        y: 700,
        rotation: -8,
        fontSize: 156,
        color: o.sfxColor || "#ff7a59",
        start: at + 1.3,
        duration: 2.2,
        trackIndex: tk + 4,
      });
      animateReveal(tl, `#${fx}`, { at: at + 1.3, scale: 0.4, duration: 0.3, ease: "back.out(2.4)" });
      animateShake(tl, `#${fx}`, { at: at + 1.65, amplitude: 12, duration: 0.06, repeat: 5 });
      ids.push(`#${fx}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.heartbeat = function (tl, root, o) {
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("hb-bg", at);
    const vig = kitRef.id("hb-vg", at);
    const photo = kitRef.id("hb-ph", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "sunset",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 620,
      y: 220,
      width: 680,
      height: 680,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.7 });
    const beats = Math.max(1, Math.floor((duration - 1.5) / 1.2));
    for (let i = 0; i < beats; i++) {
      animateHeartbeat(tl, `#${photo}`, { at: at + 1.2 + i * 1.2, scale: 1.06 });
    }
    const ids = [`#${bg}`, `#${vig}`, `#${photo}`];
    if (o.narration) {
      const nr = kitRef.id("hb-nr", at);
      createNarrationBox(root, {
        id: nr,
        label: o.narrator || "Narrator",
        text: o.narration,
        x: 186,
        y: 720,
        width: 400,
        rotation: -3,
        start: at + 0.9,
        duration: duration - 1.4,
        trackIndex: tk + 3,
      });
      animateSpin(tl, `#${nr}`, { at: at + 0.9, from: -3, duration: 0.5 });
      ids.push(`#${nr}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.zoomPunch = function (tl, root, o) {
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("zp-bg", at);
    const photo = kitRef.id("zp-ph", at);
    const speed = kitRef.id("zp-sp", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "cyber",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 520,
      y: 200,
      width: 880,
      height: 720,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createSpeedLines(root, {
      id: speed,
      inset: 72,
      start: at + 0.6,
      duration: duration - 1.2,
      trackIndex: tk + 2,
    });
    animateReveal(tl, `#${photo}`, { at, scale: 0.85, duration: 0.6 });
    tl.fromTo(`#${speed}`, { opacity: 0, scale: 0.6 }, { opacity: 0.8, scale: 1, duration: 0.4, ease: "power2.out" }, at + 0.6);
    tl.to(`#${speed}`, { rotation: 24, duration: duration - 1.4, ease: "none" }, at + 0.6);
    animateZoomPunch(tl, `#${photo}`, { at: at + 1.2, scale: 1.22 });
    animateColorFlash(tl, `#${photo}`, { at: at + 1.2, color: o.flashColor || "rgba(159,231,255,0.6)" });
    const ids = [`#${bg}`, `#${photo}`, `#${speed}`];
    if (o.sfx) {
      const fx = kitRef.id("zp-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 1380,
        y: 280,
        rotation: 6,
        fontSize: 148,
        color: o.sfxColor || "#9fe7ff",
        start: at + 1.3,
        duration: 2,
        trackIndex: tk + 3,
      });
      animateBounceIn(tl, `#${fx}`, { at: at + 1.3, from: 40, duration: 0.5 });
      animateVibrate(tl, `#${fx}`, { at: at + 1.8, amplitude: 3, repeat: 18 });
      ids.push(`#${fx}`);
    }
    animateZoomPunch(tl, `#${photo}`, { at: at + duration - 2, scale: 1.15 });
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.splitScreen = function (tl, root, o) {
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const A = kitRef.id("sp-A", at);
    const B = kitRef.id("sp-B", at);
    const slash = kitRef.id("sp-sl", at);
    createSplitPanel(root, {
      id: A,
      src: o.leftImage,
      label: o.leftLabel || "Before",
      x: 72,
      y: 72,
      width: 888,
      height: 936,
      start: at,
      duration,
      trackIndex: tk,
    });
    createSplitPanel(root, {
      id: B,
      src: o.rightImage,
      label: o.rightLabel || "After",
      x: 960,
      y: 72,
      width: 888,
      height: 936,
      start: at + 0.2,
      duration: duration - 0.2,
      trackIndex: tk + 1,
    });
    createInkSlash(root, {
      id: slash,
      x: 760,
      y: 60,
      width: 400,
      height: 960,
      start: at + 0.6,
      duration: duration - 1,
      trackIndex: tk + 2,
    });
    animateWipeReveal(tl, `#${A}`, { at, direction: "left", duration: 0.8 });
    animateWipeReveal(tl, `#${B}`, { at: at + 0.35, direction: "right", duration: 0.8 });
    tl.fromTo(`#${slash}`, { opacity: 0, scale: 0.6 }, { opacity: 0.35, scale: 1, duration: 0.3, ease: "power3.out" }, at + 0.6);
    animateKenBurns(tl, `#${A}`, { at: at + 1, duration: duration - 1.6, fromScale: 1, toScale: 1.08, toX: 14 });
    animateKenBurns(tl, `#${B}`, { at: at + 1, duration: duration - 1.6, fromScale: 1, toScale: 1.08, toX: -14 });
    animateColorFlash(tl, `#${B}`, { at: at + duration - 2, color: "rgba(255,211,106,0.55)" });
    const ids = [`#${A}`, `#${B}`, `#${slash}`];
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.thought = function (tl, root, o) {
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("tb-bg", at);
    const grid = kitRef.id("tb-gr", at);
    const photo = kitRef.id("tb-ph", at);
    const bubble = kitRef.id("tb-bb", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "paper",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createGridPaper(root, {
      id: grid,
      inset: 72,
      size: 64,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 160,
      y: 240,
      width: 720,
      height: 680,
      rotation: -2,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    createThoughtBubble(root, {
      id: bubble,
      text: o.text,
      x: 1000,
      y: 340,
      width: 720,
      start: at + 0.8,
      duration: duration - 1.2,
      trackIndex: tk + 3,
    });
    animateSlideIn(tl, `#${photo}`, { at, from: "left", distance: 160, duration: 0.7 });
    animateBounceIn(tl, `#${bubble}`, { at: at + 0.9, from: 30, duration: 0.6 });
    animateFloat(tl, `#${bubble}`, { at: at + 1.6, y: -10, duration: 1.4, repeat: 1 });
    animateSwing(tl, `#${photo}`, { at: at + 1.2, angle: 2, duration: 1.6 });
    const ids = [`#${bg}`, `#${grid}`, `#${photo}`, `#${bubble}`];
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.glitch = function (tl, root, o) {
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("gl-bg", at);
    const photo = kitRef.id("gl-ph", at);
    const scan = kitRef.id("gl-sc", at);
    const grain = kitRef.id("gl-gn", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "mono",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 520,
      y: 200,
      width: 880,
      height: 720,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createScanlines(root, {
      id: scan,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.6 });
    const hits = Math.max(2, Math.floor((duration - 1) / 1.1));
    for (let i = 0; i < hits; i++) {
      animateGlitch(tl, `#${photo}`, { at: at + 1 + i * 1.1, amplitude: 12 + (i % 2) * 4 });
    }
    const ids = [`#${bg}`, `#${photo}`, `#${scan}`, `#${grain}`];
    if (o.sfx) {
      const fx = kitRef.id("gl-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 1200,
        y: 800,
        rotation: -3,
        fontSize: 96,
        color: o.sfxColor || "#ff5b7a",
        start: at + 1,
        duration: 2.2,
        trackIndex: tk + 4,
      });
      animateBounceIn(tl, `#${fx}`, { at: at + 1, from: 20, duration: 0.4 });
      animateFlicker(tl, `#${fx}`, { at: at + 1.6, min: 0.3, repeat: 6, duration: 0.08 });
      ids.push(`#${fx}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.typewriter = function (tl, root, o) {
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("tw-bg", at);
    const grid = kitRef.id("tw-gr", at);
    const tx = kitRef.id("tw-tx", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "mono",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createGridPaper(root, {
      id: grid,
      inset: 72,
      size: 48,
      opacity: 0.6,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const ids = [`#${bg}`, `#${grid}`];
    if (o.image) {
      const ph = kitRef.id("tw-ph", at);
      createPhotoPanel(root, {
        id: ph,
        src: o.image,
        x: 140,
        y: 250,
        width: 620,
        height: 580,
        rotation: -2,
        start: at,
        duration,
        trackIndex: tk + 2,
      });
      animateSlideIn(tl, `#${ph}`, { at, from: "left", distance: 140, duration: 0.7 });
      ids.push(`#${ph}`);
    }
    createTypewriter(root, {
      id: tx,
      text: o.text,
      x: o.image ? 840 : 260,
      y: 340,
      width: o.image ? 920 : 1400,
      height: 460,
      fontSize: o.fontSize || 44,
      start: at + 0.6,
      duration: duration - 0.8,
      trackIndex: tk + 3,
    });
    animateTypewriter(tl, `#${tx}`, { at: at + 0.8, duration: Math.min(duration - 1.2, 3.6) });
    ids.push(`#${tx}`);
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.comicGrid = function (tl, root, o) {
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("cg-bg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "paper",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    const images = o.images || [];
    const ids = [`#${bg}`];
    const positions = [
      { x: 140, y: 220, w: 520, h: 420, r: -3 },
      { x: 700, y: 260, w: 520, h: 500, r: 2 },
      { x: 1260, y: 220, w: 520, h: 420, r: -2 },
    ];
    const panelIds = [];
    images.slice(0, 3).forEach((img, i) => {
      const p = positions[i];
      const pid = kitRef.id(`cg-p${i}`, at);
      createComicPanel(root, {
        id: pid,
        src: img,
        x: p.x,
        y: p.y,
        width: p.w,
        height: p.h,
        rotation: p.r,
        start: at + i * 0.15,
        duration: duration - i * 0.15,
        trackIndex: tk + 1 + i,
      });
      panelIds.push(`#${pid}`);
      ids.push(`#${pid}`);
    });
    animateCascade(tl, panelIds, { at, step: 0.18, y: 60, duration: 0.6 });
    if (panelIds[0]) animateSwing(tl, panelIds[0], { at: at + 0.9, angle: 2, duration: 1.4 });
    if (panelIds[2]) animateSwing(tl, panelIds[2], { at: at + 1, angle: 2, duration: 1.4 });
    if (panelIds[1]) animateZoomPunch(tl, panelIds[1], { at: at + 1.3, scale: 1.08 });
    if (o.sfx) {
      const fx = kitRef.id("cg-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 780,
        y: 760,
        rotation: -4,
        fontSize: 140,
        color: o.sfxColor || "#ff7a59",
        start: at + 1.6,
        duration: 1.8,
        trackIndex: tk + 6,
      });
      animateBounceIn(tl, `#${fx}`, { at: at + 1.6, from: 40, duration: 0.5 });
      if (panelIds[1]) animateShake(tl, panelIds[1], { at: at + 1.6, amplitude: 10, duration: 0.07, repeat: 5 });
      ids.push(`#${fx}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.ticker = function (tl, root, o) {
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("tk-bg", at);
    const scan = kitRef.id("tk-sc", at);
    const photo = kitRef.id("tk-ph", at);
    const ribbon = kitRef.id("tk-rb", at);
    const ticker = kitRef.id("tk-tk", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "cyber",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createScanlines(root, {
      id: scan,
      inset: 72,
      opacity: 0.25,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 260,
      y: 240,
      width: 1400,
      height: 520,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    createTagRibbon(root, {
      id: ribbon,
      text: o.ribbon || "BREAKING",
      x: 180,
      y: 200,
      width: 220,
      start: at + 0.3,
      duration: duration - 0.5,
      trackIndex: tk + 3,
    });
    createTicker(root, {
      id: ticker,
      items: o.items || [],
      x: 72,
      y: 820,
      width: 1776,
      height: 72,
      start: at + 0.4,
      duration: duration - 0.4,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.7 });
    animateBounceIn(tl, `#${ribbon}`, { at: at + 0.3, from: -30, duration: 0.5 });
    animateSwing(tl, `#${ribbon}`, { at: at + 1, angle: 2, duration: 1.4 });
    animateSlideIn(tl, `#${ticker}`, { at: at + 0.4, from: "bottom", distance: 80, duration: 0.5 });
    animateTickerScroll(tl, `#${ticker}`, { at: at + 0.8, duration: duration + 2 });
    animateColorFlash(tl, `#${photo}`, { at: at + 2.4, color: "rgba(255,91,122,0.5)" });
    const ids = [`#${bg}`, `#${scan}`, `#${photo}`, `#${ribbon}`, `#${ticker}`];
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.montage = function (tl, root, o) {
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("mn-bg", at);
    const grain = kitRef.id("mn-gn", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "night",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.3,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const pos = [
      { x: 180, y: 260, w: 440, h: 560, r: -5 },
      { x: 740, y: 220, w: 440, h: 640, r: 3 },
      { x: 1300, y: 260, w: 440, h: 560, r: -2 },
    ];
    const imgs = o.images || [];
    const ids = [`#${bg}`, `#${grain}`];
    const panels = [];
    imgs.slice(0, 3).forEach((im, i) => {
      const p = pos[i];
      const pid = kitRef.id(`mn-p${i}`, at);
      createPhotoPanel(root, {
        id: pid,
        src: im,
        x: p.x,
        y: p.y,
        width: p.w,
        height: p.h,
        rotation: p.r,
        start: at + i * 0.2,
        duration: duration - i * 0.2,
        trackIndex: tk + 2 + i,
      });
      panels.push(`#${pid}`);
      ids.push(`#${pid}`);
    });
    animateCascade(tl, panels, { at, step: 0.2, y: 40, duration: 0.6 });
    if (panels[0]) animateFloat(tl, panels[0], { at: at + 0.9, y: -18, duration: 1.6, repeat: 1 });
    if (panels[2]) animateFloat(tl, panels[2], { at: at + 1.1, y: 14, duration: 1.6, repeat: 1 });
    if (panels[1]) animateSwing(tl, panels[1], { at: at + 1, angle: 2, duration: 1.8 });
    if (o.caption) {
      const cp = kitRef.id("mn-cp", at);
      createCaptionBubble(root, {
        id: cp,
        label: o.captionLabel || "Moodboard",
        text: o.caption,
        x: 460,
        y: 880,
        width: 1000,
        start: at + 1.2,
        duration: duration - 1.6,
        trackIndex: tk + 6,
      });
      animateBounceIn(tl, `#${cp}`, { at: at + 1.2, from: 30, duration: 0.5 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.credits = function (tl, root, o) {
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("cr-bg", at);
    const vig = kitRef.id("cr-vg", at);
    const card = kitRef.id("cr-cd", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "sunset",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createActCard(root, {
      id: card,
      eyebrow: o.eyebrow,
      title: o.title,
      subtitle: o.subtitle,
      x: 360,
      y: 320,
      width: 1200,
      height: 440,
      start: at + 0.2,
      duration: duration - 0.4,
      trackIndex: tk + 2,
    });
    animateBlurIn(tl, `#${card}`, { at: at + 0.2, duration: 0.9 });
    animateFloat(tl, `#${card}`, { at: at + 1.2, y: -8, duration: 1.6, repeat: 1 });
    const ids = [`#${bg}`, `#${vig}`, `#${card}`];
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  // ----- Mood scenes -----

  scenes.tearDrop = function (tl, root, o) {
    // A single sad portrait. Slow zoom, melancholy backdrop, quiet narration.
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("td-bg", at);
    const vig = kitRef.id("td-vg", at);
    const grain = kitRef.id("td-gn", at);
    const photo = kitRef.id("td-ph", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "melancholy",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.25,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 620,
      y: 200,
      width: 680,
      height: 720,
      rotation: 0,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 1.2 });
    animateKenBurns(tl, `#${photo}`, {
      at: at + 0.5,
      duration: duration - 0.8,
      fromScale: 1,
      toScale: 1.07,
      toX: 0,
      toY: -6,
    });
    const ids = [`#${bg}`, `#${vig}`, `#${grain}`, `#${photo}`];
    if (o.narration) {
      const nr = kitRef.id("td-nr", at);
      createNarrationBox(root, {
        id: nr,
        label: o.narrator || "She remembers",
        text: o.narration,
        x: 160,
        y: 720,
        width: 420,
        rotation: -2,
        start: at + 1,
        duration: duration - 1.4,
        trackIndex: tk + 4,
      });
      animateSpin(tl, `#${nr}`, { at: at + 1, from: -2, duration: 0.6 });
      animateFloat(tl, `#${nr}`, { at: at + 1.8, y: -6, duration: 1.8, repeat: 1 });
      ids.push(`#${nr}`);
    }
    if (o.caption) {
      const cp = kitRef.id("td-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1.6,
        duration: duration - 2,
        trackIndex: tk + 5,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1.6, y: 18, duration: 0.8 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.memoryFlashback = function (tl, root, o) {
    // Sepia tinted, b&w pulses, soft drift
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("mf-bg", at);
    const sepia = kitRef.id("mf-sp", at);
    const grain = kitRef.id("mf-gn", at);
    const photo = kitRef.id("mf-ph", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "sepia",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createSepiaOverlay(root, {
      id: sepia,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.45,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 420,
      y: 200,
      width: 1080,
      height: 720,
      rotation: -1,
      filter: "sepia(0.7) contrast(1.05) brightness(0.95)",
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 1 });
    animateKenBurns(tl, `#${photo}`, {
      at: at + 0.6,
      duration: duration - 1,
      fromScale: 1,
      toScale: 1.08,
      toX: -14,
      toY: -10,
    });
    // blur pulses like a memory flickering back
    tl.to(`#${photo}`, { filter: "sepia(0.4) blur(4px) contrast(1.1)", duration: 0.25, yoyo: true, repeat: 1, ease: "power2.inOut" }, at + 1.8);
    tl.to(`#${photo}`, { filter: "sepia(0.4) blur(4px) contrast(1.1)", duration: 0.25, yoyo: true, repeat: 1, ease: "power2.inOut" }, at + 3.4);
    const ids = [`#${bg}`, `#${sepia}`, `#${grain}`, `#${photo}`];
    if (o.caption) {
      const cp = kitRef.id("mf-cp", at);
      createCaptionBubble(root, {
        id: cp,
        label: o.captionLabel || "A long time ago",
        text: o.caption,
        x: 260,
        y: 880,
        width: 1400,
        start: at + 1.2,
        duration: duration - 1.6,
        trackIndex: tk + 4,
      });
      animateBounceIn(tl, `#${cp}`, { at: at + 1.2, from: 24, duration: 0.5 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.rainyDay = function (tl, root, o) {
    // Heavy rain + vignette + slow drift
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("rd-bg", at);
    const rain1 = kitRef.id("rd-r1", at);
    const rain2 = kitRef.id("rd-r2", at);
    const vig = kitRef.id("rd-vg", at);
    const photo = kitRef.id("rd-ph", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "storm",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      rotation: 0,
      filter: "saturate(0.8) brightness(0.85)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createRainLines(root, {
      id: rain1,
      inset: 72,
      angle: 104,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    createRainLines(root, {
      id: rain2,
      inset: 72,
      angle: 98,
      opacity: 0.35,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.9 });
    tl.to(`#${rain1}`, { backgroundPositionY: "220px", duration: duration, ease: "none" }, at);
    tl.to(`#${rain2}`, { backgroundPositionY: "140px", duration: duration, ease: "none" }, at);
    animateKenBurns(tl, `#${photo}`, {
      at: at + 0.4,
      duration: duration - 0.8,
      fromScale: 1.02,
      toScale: 1.08,
      toX: 8,
      toY: 4,
    });
    const ids = [`#${bg}`, `#${photo}`, `#${rain1}`, `#${rain2}`, `#${vig}`];
    if (o.narration) {
      const nr = kitRef.id("rd-nr", at);
      createNarrationBox(root, {
        id: nr,
        label: o.narrator || "Narrator",
        text: o.narration,
        x: 160,
        y: 760,
        width: 440,
        rotation: -2,
        start: at + 0.8,
        duration: duration - 1.2,
        trackIndex: tk + 5,
      });
      animateSpin(tl, `#${nr}`, { at: at + 0.8, from: -2, duration: 0.5 });
      ids.push(`#${nr}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.confession = function (tl, root, o) {
    // Photo + quote card, warm light, slow swing
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("cn-bg", at);
    const grain = kitRef.id("cn-gn", at);
    const photo = kitRef.id("cn-ph", at);
    const quote = kitRef.id("cn-qt", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "sunset",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.3,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 160,
      y: 220,
      width: 720,
      height: 720,
      rotation: -3,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    createQuoteCard(root, {
      id: quote,
      eyebrow: o.eyebrow || "He told her",
      text: o.text,
      meta: o.meta || "",
      x: 980,
      y: 280,
      width: 780,
      height: 540,
      start: at + 0.6,
      duration: duration - 0.9,
      trackIndex: tk + 3,
    });
    animateSlideIn(tl, `#${photo}`, { at, from: "left", distance: 160, duration: 0.8 });
    animateSwing(tl, `#${photo}`, { at: at + 1, angle: 1.5, duration: 2.4 });
    animateBlurIn(tl, `#${quote}`, { at: at + 0.6, duration: 0.9 });
    animateFloat(tl, `#${quote}`, { at: at + 1.8, y: -6, duration: 1.8, repeat: 1 });
    const ids = [`#${bg}`, `#${grain}`, `#${photo}`, `#${quote}`];
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.whisper = function (tl, root, o) {
    // Close-up photo + small caption bubble + halftone
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("wh-bg", at);
    const halft = kitRef.id("wh-h", at);
    const photo = kitRef.id("wh-ph", at);
    const cap = kitRef.id("wh-cp", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "mono",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createHalftoneOverlay(root, {
      id: halft,
      inset: 72,
      opacity: 0.12,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 520,
      y: 180,
      width: 880,
      height: 740,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    createCaptionBubble(root, {
      id: cap,
      label: o.captionLabel || "whisper",
      text: o.text,
      x: 280,
      y: 820,
      width: 760,
      start: at + 0.8,
      duration: duration - 1.2,
      trackIndex: tk + 3,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 1 });
    animateZoomPunch(tl, `#${photo}`, { at: at + 1.2, scale: 1.05 });
    animateBounceIn(tl, `#${cap}`, { at: at + 0.8, from: 20, duration: 0.5 });
    animateFloat(tl, `#${cap}`, { at: at + 1.5, y: -8, duration: 1.8, repeat: 1 });
    const ids = [`#${bg}`, `#${halft}`, `#${photo}`, `#${cap}`];
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.dawn = function (tl, root, o) {
    // Sunrise mood: dawn backdrop + golden flash + narration
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("dw-bg", at);
    const burst = kitRef.id("dw-br", at);
    const photo = kitRef.id("dw-ph", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "dawn",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createRadialBurst(root, {
      id: burst,
      inset: 72,
      color: "rgba(255, 211, 128, 0.45)",
      inner: 80,
      outer: 580,
      cx: 50,
      cy: 88,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 680,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 1 });
    animateKenBurns(tl, `#${photo}`, {
      at: at + 0.6,
      duration: duration - 0.9,
      fromScale: 1.04,
      toScale: 1.1,
      toX: -12,
      toY: -6,
    });
    animateColorFlash(tl, `#${photo}`, { at: at + 1.4, color: "rgba(255, 211, 128, 0.55)" });
    const ids = [`#${bg}`, `#${burst}`, `#${photo}`];
    if (o.headline) {
      const hl = kitRef.id("dw-hl", at);
      createHeadline(root, {
        id: hl,
        text: o.headline,
        x: 146,
        y: 320,
        width: 900,
        start: at + 0.5,
        duration: duration - 0.8,
        trackIndex: tk + 3,
      });
      animateReveal(tl, `#${hl}`, { at: at + 0.7, y: 30, duration: 0.8 });
      ids.push(`#${hl}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.suspense = function (tl, root, o) {
    // Slow zoom + vignette + ticker heartbeat
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("sp-bg", at);
    const vig = kitRef.id("sp-vg", at);
    const grain = kitRef.id("sp-gn", at);
    const photo = kitRef.id("sp-ph", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "mono",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.4,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 420,
      y: 200,
      width: 1080,
      height: 720,
      filter: "saturate(0.9) contrast(1.08) brightness(0.88)",
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.8 });
    animateKenBurns(tl, `#${photo}`, {
      at: at + 0.5,
      duration: duration - 0.8,
      fromScale: 1,
      toScale: 1.18,
      toX: 0,
      toY: 0,
    });
    const beats = Math.max(2, Math.floor((duration - 1) / 1.3));
    for (let i = 0; i < beats; i++) {
      animateHeartbeat(tl, `#${photo}`, { at: at + 1.2 + i * 1.3, scale: 1.04 });
    }
    const ids = [`#${bg}`, `#${grain}`, `#${photo}`, `#${vig}`];
    if (o.caption) {
      const cp = kitRef.id("sp-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1.4,
        duration: duration - 1.8,
        trackIndex: tk + 4,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1.4, y: 14, duration: 0.6 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.letter = function (tl, root, o) {
    // Grid paper + typewriter text framed like a letter
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("lt-bg", at);
    const grid = kitRef.id("lt-gr", at);
    const paper = kitRef.id("lt-pp", at);
    const tx = kitRef.id("lt-tx", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "paper",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createGridPaper(root, {
      id: grid,
      inset: 72,
      size: 44,
      opacity: 0.35,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createSurfacePanel(root, {
      id: paper,
      x: 280,
      y: 180,
      width: 1360,
      height: 760,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    createTypewriter(root, {
      id: tx,
      text: o.text,
      x: 340,
      y: 240,
      width: 1240,
      height: 640,
      fontSize: o.fontSize || 44,
      color: "#1c1e2c",
      start: at + 0.6,
      duration: duration - 0.8,
      trackIndex: tk + 3,
    });
    // override paper to a letter-like soft card
    const paperEl = document.querySelector(`#${paper}`);
    if (paperEl) {
      paperEl.style.background = "linear-gradient(180deg, #f8ecd1 0%, #f0dfb8 100%)";
      paperEl.style.borderRadius = "22px";
      paperEl.style.boxShadow = "0 24px 60px rgba(0,0,0,0.35), inset 0 0 0 2px rgba(0,0,0,0.12)";
    }
    animateBounceIn(tl, `#${paper}`, { at, from: 30, duration: 0.7 });
    animateSwing(tl, `#${paper}`, { at: at + 0.8, angle: 0.6, duration: 2.4 });
    animateTypewriter(tl, `#${tx}`, { at: at + 0.8, duration: Math.min(duration - 1.2, 4) });
    const ids = [`#${bg}`, `#${grid}`, `#${paper}`, `#${tx}`];
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.heroPose = function (tl, root, o) {
    // Cinematic hero: radial burst + speed lines + SFX
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("hp-bg", at);
    const burst = kitRef.id("hp-br", at);
    const speed = kitRef.id("hp-sp", at);
    const photo = kitRef.id("hp-ph", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "cyber",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createRadialBurst(root, {
      id: burst,
      inset: 72,
      color: o.burstColor || "rgba(255, 211, 106, 0.55)",
      inner: 180,
      outer: 820,
      cx: 50,
      cy: 50,
      start: at + 0.2,
      duration: duration - 0.4,
      trackIndex: tk + 1,
    });
    createSpeedLines(root, {
      id: speed,
      inset: 72,
      start: at + 0.6,
      duration: duration - 1,
      trackIndex: tk + 2,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 620,
      y: 180,
      width: 680,
      height: 780,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    animateBounceIn(tl, `#${photo}`, { at: at + 0.1, from: 60, duration: 0.7 });
    animateBurstExpand(tl, `#${burst}`, { at: at + 0.2, scale: 1.1, duration: 0.5, fade: false });
    tl.fromTo(`#${speed}`, { opacity: 0, scale: 0.6 }, { opacity: 0.85, scale: 1, duration: 0.4 }, at + 0.6);
    tl.to(`#${speed}`, { rotation: 18, duration: duration - 1, ease: "none" }, at + 0.6);
    animateZoomPunch(tl, `#${photo}`, { at: at + 1.1, scale: 1.14 });
    animateColorFlash(tl, `#${photo}`, { at: at + 1.1, color: o.flashColor || "rgba(255, 211, 106, 0.6)" });
    const ids = [`#${bg}`, `#${burst}`, `#${speed}`, `#${photo}`];
    if (o.sfx) {
      const fx = kitRef.id("hp-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 180,
        y: 760,
        rotation: -6,
        fontSize: 168,
        color: o.sfxColor || "#ffd36a",
        start: at + 1.1,
        duration: 2.2,
        trackIndex: tk + 4,
      });
      animateBounceIn(tl, `#${fx}`, { at: at + 1.1, from: 40, duration: 0.5 });
      animateVibrate(tl, `#${fx}`, { at: at + 1.6, amplitude: 3, repeat: 20 });
      ids.push(`#${fx}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  // ----- Horror / suspense scenes -----

  scenes.jumpScare = function (tl, root, o) {
    // Calm photo → sudden swap + red flash + SFX + shake
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("js-bg", at);
    const vig = kitRef.id("js-vg", at);
    const grain = kitRef.id("js-gn", at);
    const calm = kitRef.id("js-ca", at);
    const scare = kitRef.id("js-sc", at);
    const flash = kitRef.id("js-fl", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "mono",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.45,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createPhotoPanel(root, {
      id: calm,
      src: o.calmImage || o.image,
      x: 420,
      y: 200,
      width: 1080,
      height: 720,
      filter: "saturate(0.8) brightness(0.78) contrast(1.1)",
      start: at,
      duration: (o.triggerAt || 2.6),
      trackIndex: tk + 2,
    });
    createPhotoPanel(root, {
      id: scare,
      src: o.scareImage || o.image,
      x: 420,
      y: 200,
      width: 1080,
      height: 720,
      filter: "saturate(1.2) contrast(1.35) brightness(1.1)",
      start: at + (o.triggerAt || 2.6),
      duration: duration - (o.triggerAt || 2.6),
      trackIndex: tk + 3,
    });
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    // red flash slab
    const fl = createElement("div", "", {
      id: flash,
      inset: 72,
      start: at + (o.triggerAt || 2.6),
      duration: 1.2,
      trackIndex: tk + 5,
    });
    fl.style.background = o.flashColor || "rgba(220, 30, 50, 0.85)";
    fl.style.mixBlendMode = "screen";
    append(root, fl);

    animateBlurIn(tl, `#${calm}`, { at, duration: 1 });
    animateKenBurns(tl, `#${calm}`, { at: at + 0.4, duration: (o.triggerAt || 2.6) - 0.5, fromScale: 1, toScale: 1.05 });
    const trig = at + (o.triggerAt || 2.6);
    // instant swap with bounce and colour flash
    tl.fromTo(`#${scare}`, { scale: 1.35, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.18, ease: "power4.out" }, trig);
    tl.fromTo(`#${flash}`, { opacity: 0 }, { opacity: 1, duration: 0.05 }, trig);
    tl.to(`#${flash}`, { opacity: 0, duration: 0.55, ease: "power2.in" }, trig + 0.08);
    animateScreamShake(tl, `#${scare}`, { at: trig, amplitude: 24, duration: 0.9 });
    animateVibrate(tl, `#${scare}`, { at: trig + 0.9, amplitude: 4, repeat: 14 });
    const ids = [`#${bg}`, `#${grain}`, `#${calm}`, `#${scare}`, `#${vig}`, `#${flash}`];
    if (o.sfx) {
      const fx = kitRef.id("js-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 760,
        y: 740,
        rotation: -4,
        fontSize: 172,
        color: o.sfxColor || "#ff3b4d",
        start: trig,
        duration: duration - (o.triggerAt || 2.6),
        trackIndex: tk + 6,
      });
      animateBounceIn(tl, `#${fx}`, { at: trig, from: 60, duration: 0.35 });
      animateScreamShake(tl, `#${fx}`, { at: trig + 0.1, amplitude: 14, duration: 0.8 });
      ids.push(`#${fx}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.shadowStalker = function (tl, root, o) {
    // Dark backdrop + photo desaturated + creeping silhouette + heartbeat
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("sh-bg", at);
    const vig = kitRef.id("sh-vg", at);
    const grain = kitRef.id("sh-gn", at);
    const photo = kitRef.id("sh-ph", at);
    const shadow = kitRef.id("sh-sd", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "storm",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 420,
      y: 200,
      width: 1080,
      height: 720,
      filter: "saturate(0.45) contrast(1.15) brightness(0.7)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.55,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    // creeping shadow — radial gradient "approaching"
    const sh = createElement("div", "", {
      id: shadow,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    sh.style.background =
      "radial-gradient(circle at 90% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 28%, rgba(0,0,0,0.9) 55%)";
    sh.style.pointerEvents = "none";
    append(root, sh);
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 1.2 });
    tl.fromTo(`#${shadow}`, { backgroundPosition: "200% 50%", opacity: 0.4 }, { backgroundPosition: "0% 50%", opacity: 1, duration: duration - 0.8, ease: "none" }, at + 0.4);
    animateKenBurns(tl, `#${photo}`, { at: at + 0.4, duration: duration - 0.8, fromScale: 1, toScale: 1.12 });
    const beats = Math.max(2, Math.floor((duration - 1) / 1.1));
    for (let i = 0; i < beats; i++) {
      animateHeartbeat(tl, `#${photo}`, { at: at + 1 + i * 1.1, scale: 1.03 });
    }
    const ids = [`#${bg}`, `#${photo}`, `#${grain}`, `#${shadow}`, `#${vig}`];
    if (o.caption) {
      const cp = kitRef.id("sh-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1.2,
        duration: duration - 1.6,
        trackIndex: tk + 5,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1.2, y: 18, duration: 0.6 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.thunderStrike = function (tl, root, o) {
    // Storm backdrop + rain + lightning flashes
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("ts-bg", at);
    const photo = kitRef.id("ts-ph", at);
    const rain = kitRef.id("ts-rn", at);
    const bolt = kitRef.id("ts-bt", at);
    const vig = kitRef.id("ts-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "storm",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(0.7) contrast(1.1) brightness(0.72)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createRainLines(root, {
      id: rain,
      inset: 72,
      angle: 108,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    const fl = createElement("div", "", {
      id: bolt,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    fl.style.background = "rgba(220, 235, 255, 1)";
    fl.style.mixBlendMode = "screen";
    fl.style.opacity = "0";
    fl.style.pointerEvents = "none";
    append(root, fl);
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.9 });
    animateKenBurns(tl, `#${photo}`, { at: at + 0.4, duration: duration - 0.8, fromScale: 1.02, toScale: 1.08 });
    tl.to(`#${rain}`, { backgroundPositionY: "240px", duration, ease: "none" }, at);
    // 3 lightning flashes
    const strikes = o.strikes || [1.1, 2.4, 3.9];
    strikes.forEach((s) => {
      const t = at + s;
      tl.to(`#${bolt}`, { opacity: 1, duration: 0.04 }, t);
      tl.to(`#${bolt}`, { opacity: 0, duration: 0.08 }, t + 0.05);
      tl.to(`#${bolt}`, { opacity: 0.6, duration: 0.03 }, t + 0.18);
      tl.to(`#${bolt}`, { opacity: 0, duration: 0.22 }, t + 0.22);
      animateShake(tl, `#${photo}`, { at: t, amplitude: 6, duration: 0.05, repeat: 4 });
    });
    const ids = [`#${bg}`, `#${photo}`, `#${rain}`, `#${bolt}`, `#${vig}`];
    if (o.sfx) {
      const fx = kitRef.id("ts-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 1280,
        y: 720,
        rotation: -6,
        fontSize: 140,
        color: o.sfxColor || "#cfe3ff",
        start: at + (strikes[0] || 1.1),
        duration: 2,
        trackIndex: tk + 5,
      });
      animateBounceIn(tl, `#${fx}`, { at: at + (strikes[0] || 1.1), from: 30, duration: 0.35 });
      animateFlicker(tl, `#${fx}`, { at: at + (strikes[0] || 1.1) + 0.2, min: 0.2, repeat: 8, duration: 0.06 });
      ids.push(`#${fx}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.vhs = function (tl, root, o) {
    // VHS / broken TV: scanlines + heavy grain + glitch pulses + chromatic aberration
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("vh-bg", at);
    const photo = kitRef.id("vh-ph", at);
    const scan = kitRef.id("vh-sc", at);
    const grain = kitRef.id("vh-gn", at);
    const vig = kitRef.id("vh-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "mono",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(1.2) hue-rotate(-4deg) contrast(1.12)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createScanlines(root, {
      id: scan,
      inset: 72,
      opacity: 0.55,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.6,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.5 });
    // horizontal "tracking" jitter
    const hits = Math.max(4, Math.floor((duration - 0.5) / 0.7));
    for (let i = 0; i < hits; i++) {
      const t = at + 0.6 + i * 0.7;
      animateGlitch(tl, `#${photo}`, { at: t, amplitude: 10 + (i % 3) * 6 });
    }
    tl.to(`#${scan}`, { backgroundPositionY: "60px", duration, ease: "none" }, at);
    const ids = [`#${bg}`, `#${photo}`, `#${scan}`, `#${grain}`, `#${vig}`];
    if (o.caption) {
      const cp = kitRef.id("vh-cp", at);
      createCaptionBubble(root, {
        id: cp,
        label: o.captionLabel || "REC · 03:17",
        text: o.caption,
        x: 220,
        y: 840,
        width: 900,
        start: at + 0.8,
        duration: duration - 1.2,
        trackIndex: tk + 5,
      });
      animateBounceIn(tl, `#${cp}`, { at: at + 0.8, from: 20, duration: 0.4 });
      animateFlicker(tl, `#${cp}`, { at: at + 1.4, min: 0.4, repeat: 4, duration: 0.12 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.redAlert = function (tl, root, o) {
    // Pulsing red wash + siren SFX
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("ra-bg", at);
    const photo = kitRef.id("ra-ph", at);
    const wash = kitRef.id("ra-wa", at);
    const scan = kitRef.id("ra-sc", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "mono",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(1.1) contrast(1.15) brightness(0.85)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const w = createElement("div", "", {
      id: wash,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    w.style.background = "radial-gradient(circle at 50% 50%, rgba(255,40,60,0.45) 0%, rgba(120,0,20,0.75) 65%, rgba(60,0,10,0.9) 100%)";
    w.style.mixBlendMode = "multiply";
    w.style.pointerEvents = "none";
    append(root, w);
    createScanlines(root, {
      id: scan,
      inset: 72,
      opacity: 0.35,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.6 });
    // pulse the red wash on/off
    const pulses = Math.max(3, Math.floor(duration / 0.9));
    for (let i = 0; i < pulses; i++) {
      const t = at + 0.3 + i * 0.9;
      tl.to(`#${wash}`, { opacity: 1, duration: 0.2, ease: "power2.out" }, t);
      tl.to(`#${wash}`, { opacity: 0.35, duration: 0.6, ease: "power2.in" }, t + 0.2);
    }
    const ids = [`#${bg}`, `#${photo}`, `#${wash}`, `#${scan}`];
    if (o.sfx) {
      const fx = kitRef.id("ra-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 260,
        y: 760,
        rotation: -4,
        fontSize: 160,
        color: o.sfxColor || "#ff3b4d",
        start: at + 0.6,
        duration: duration - 1,
        trackIndex: tk + 4,
      });
      animateBounceIn(tl, `#${fx}`, { at: at + 0.6, from: 40, duration: 0.4 });
      animateFlicker(tl, `#${fx}`, { at: at + 1.1, min: 0.25, repeat: 10, duration: 0.09 });
      ids.push(`#${fx}`);
    }
    if (o.headline) {
      const hl = kitRef.id("ra-hl", at);
      createHeadline(root, {
        id: hl,
        text: o.headline,
        x: 260,
        y: 300,
        width: 1400,
        start: at + 0.4,
        duration: duration - 0.7,
        trackIndex: tk + 5,
      });
      animateReveal(tl, `#${hl}`, { at: at + 0.6, y: 30, duration: 0.6 });
      ids.push(`#${hl}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.nightmare = function (tl, root, o) {
    // Warping photo + purple wash + slow heartbeat
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("nm-bg", at);
    const photo = kitRef.id("nm-ph", at);
    const wash = kitRef.id("nm-wa", at);
    const grain = kitRef.id("nm-gn", at);
    const vig = kitRef.id("nm-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "melancholy",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 180,
      width: 1200,
      height: 760,
      filter: "saturate(1.4) hue-rotate(-30deg) contrast(1.2)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const w = createElement("div", "", {
      id: wash,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    w.style.background = "radial-gradient(circle at 50% 50%, rgba(120, 50, 180, 0.35) 0%, rgba(40, 10, 80, 0.8) 80%)";
    w.style.mixBlendMode = "multiply";
    w.style.pointerEvents = "none";
    append(root, w);
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.5,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 1.2 });
    // slow warp: scale + skew breathing
    tl.to(`#${photo}`, { scale: 1.1, skewX: 3, duration: 1.4, ease: "sine.inOut", yoyo: true, repeat: 3 }, at + 0.5);
    const beats = Math.max(2, Math.floor((duration - 1) / 1.6));
    for (let i = 0; i < beats; i++) {
      animateHeartbeat(tl, `#${photo}`, { at: at + 1.2 + i * 1.6, scale: 1.05 });
    }
    // colour pulses
    tl.to(`#${wash}`, { opacity: 1, duration: 1, yoyo: true, repeat: 3 }, at + 0.4);
    const ids = [`#${bg}`, `#${photo}`, `#${wash}`, `#${grain}`, `#${vig}`];
    if (o.caption) {
      const cp = kitRef.id("nm-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1.4,
        duration: duration - 1.8,
        trackIndex: tk + 5,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1.4, y: 18, duration: 0.7 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.eyesInTheDark = function (tl, root, o) {
    // Nearly black scene, two glowing eyes fade in, blink
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("ey-bg", at);
    const photo = kitRef.id("ey-ph", at);
    const grain = kitRef.id("ey-gn", at);
    const leftEye = kitRef.id("ey-L", at);
    const rightEye = kitRef.id("ey-R", at);
    const vig = kitRef.id("ey-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "storm",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    if (o.image) {
      createPhotoPanel(root, {
        id: photo,
        src: o.image,
        x: 360,
        y: 200,
        width: 1200,
        height: 720,
        filter: "saturate(0.2) brightness(0.35) contrast(1.1)",
        start: at,
        duration,
        trackIndex: tk + 1,
      });
    }
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.55,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    const cx = o.cx !== undefined ? o.cx : 960;
    const cy = o.cy !== undefined ? o.cy : 520;
    const gap = o.gap || 160;
    const mkEye = (id, x) => {
      const el = createElement("div", "", {
        id,
        x: x - 34,
        y: cy - 24,
        width: 68,
        height: 48,
        start: at + 0.6,
        duration: duration - 0.8,
        trackIndex: tk + 3,
      });
      el.style.background =
        "radial-gradient(ellipse at 50% 50%, rgba(255, 220, 120, 1) 0%, rgba(255, 140, 40, 0.9) 40%, rgba(255, 40, 40, 0) 70%)";
      el.style.borderRadius = "50%";
      el.style.boxShadow = "0 0 40px 10px rgba(255, 150, 60, 0.6)";
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
      append(root, el);
    };
    mkEye(leftEye, cx - gap / 2);
    mkEye(rightEye, cx + gap / 2);
    if (o.image) animateBlurIn(tl, `#${photo}`, { at, duration: 1.2 });
    tl.to([`#${leftEye}`, `#${rightEye}`], { opacity: 1, duration: 0.9, ease: "power2.in" }, at + 0.8);
    // blinks
    const blinks = [2.2, 3.1, 4.1];
    blinks.forEach((b) => {
      if (b < duration - 0.6) {
        tl.to([`#${leftEye}`, `#${rightEye}`], { opacity: 0.05, scaleY: 0.05, duration: 0.08 }, at + b);
        tl.to([`#${leftEye}`, `#${rightEye}`], { opacity: 1, scaleY: 1, duration: 0.18 }, at + b + 0.1);
      }
    });
    // slow approach
    tl.to([`#${leftEye}`, `#${rightEye}`], { scale: 1.4, duration: duration - 1.2, ease: "power2.in" }, at + 0.9);
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    const ids = [`#${bg}`, `#${grain}`, `#${leftEye}`, `#${rightEye}`, `#${vig}`];
    if (o.image) ids.push(`#${photo}`);
    if (o.caption) {
      const cp = kitRef.id("ey-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1.6,
        duration: duration - 2,
        trackIndex: tk + 5,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1.6, y: 18, duration: 0.7 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.bloodyNote = function (tl, root, o) {
    // Letter scene but red ink + erratic swing
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("bn-bg", at);
    const grain = kitRef.id("bn-gn", at);
    const paper = kitRef.id("bn-pp", at);
    const tx = kitRef.id("bn-tx", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "mono",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.5,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createSurfacePanel(root, {
      id: paper,
      x: 280,
      y: 180,
      width: 1360,
      height: 760,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    const pEl = document.querySelector(`#${paper}`);
    if (pEl) {
      pEl.style.background = "linear-gradient(180deg, #e8d9b6 0%, #c9b38a 100%)";
      pEl.style.borderRadius = "14px";
      pEl.style.boxShadow = "0 24px 80px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(80,30,30,0.25)";
      pEl.style.transform = "rotate(-1.2deg)";
    }
    createTypewriter(root, {
      id: tx,
      text: o.text,
      x: 340,
      y: 240,
      width: 1240,
      height: 640,
      fontSize: o.fontSize || 48,
      color: "#5a0a10",
      start: at + 0.5,
      duration: duration - 0.8,
      trackIndex: tk + 3,
    });
    const txEl = document.querySelector(`#${tx}`);
    if (txEl) {
      txEl.style.fontFamily = "\"Fraunces\", serif";
      txEl.style.fontStyle = "italic";
      txEl.style.textShadow = "0 1px 0 rgba(90,10,16,0.4)";
    }
    animateBounceIn(tl, `#${paper}`, { at, from: 40, duration: 0.6 });
    animateSwing(tl, `#${paper}`, { at: at + 0.6, angle: 2, duration: 1.2 });
    animateTypewriter(tl, `#${tx}`, { at: at + 0.7, duration: Math.min(duration - 1.2, 4) });
    // occasional nervous jitter
    tl.to(`#${paper}`, { x: "+=3", y: "-=2", duration: 0.05, yoyo: true, repeat: 3 }, at + 2.4);
    const ids = [`#${bg}`, `#${grain}`, `#${paper}`, `#${tx}`];
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  // ----- Weather / FX / lighting scenes -----

  scenes.softRain = function (tl, root, o) {
    // Gentle rain over a scene, window-like drops and soft mood
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("sr-bg", at);
    const photo = kitRef.id("sr-ph", at);
    const rain = kitRef.id("sr-rn", at);
    const drops = kitRef.id("sr-dp", at);
    const vig = kitRef.id("sr-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "melancholy",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(0.85) brightness(0.92) contrast(1.05)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createRainLines(root, {
      id: rain,
      inset: 72,
      angle: 100,
      opacity: 0.5,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    // glass drops overlay
    const dp = createElement("div", "", {
      id: drops,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    dp.style.background =
      "radial-gradient(circle at 15% 30%, rgba(255,255,255,0.18) 0 3px, transparent 4px)," +
      "radial-gradient(circle at 70% 60%, rgba(255,255,255,0.14) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 40% 80%, rgba(255,255,255,0.12) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 82% 22%, rgba(255,255,255,0.2) 0 2px, transparent 3px)";
    dp.style.backgroundSize = "260px 260px";
    dp.style.mixBlendMode = "screen";
    dp.style.pointerEvents = "none";
    append(root, dp);
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.9 });
    animateKenBurns(tl, `#${photo}`, { at: at + 0.4, duration: duration - 0.8, fromScale: 1, toScale: 1.05 });
    tl.to(`#${rain}`, { backgroundPositionY: "180px", duration, ease: "none" }, at);
    tl.to(`#${drops}`, { backgroundPositionY: "120px", duration, ease: "none" }, at);
    const ids = [`#${bg}`, `#${photo}`, `#${rain}`, `#${drops}`, `#${vig}`];
    if (o.caption) {
      const cp = kitRef.id("sr-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1,
        duration: duration - 1.4,
        trackIndex: tk + 5,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1, y: 14, duration: 0.6 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.tvStatic = function (tl, root, o) {
    // Broken TV: signal drops to static, then the show cuts back in with glitches
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("tv-bg", at);
    const photo = kitRef.id("tv-ph", at);
    const stat = kitRef.id("tv-st", at);
    const scan = kitRef.id("tv-sc", at);
    const vig = kitRef.id("tv-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "mono",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(1.1) contrast(1.1)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    // static = noisy repeating gradient
    const st = createElement("div", "", {
      id: stat,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    st.style.background =
      "repeating-linear-gradient(0deg, rgba(255,255,255,0.12) 0 1px, rgba(0,0,0,0.18) 1px 2px)," +
      "repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 3px)";
    st.style.mixBlendMode = "screen";
    st.style.opacity = "0";
    st.style.pointerEvents = "none";
    append(root, st);
    createScanlines(root, {
      id: scan,
      inset: 72,
      opacity: 0.4,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.4 });
    // interrupts = list of [cutStart, cutLength]
    const cuts = o.cuts || [[1.2, 0.45], [2.6, 0.3], [3.8, 0.6]];
    cuts.forEach(([s, len]) => {
      const t = at + s;
      if (t + len > at + duration) return;
      tl.to(`#${photo}`, { opacity: 0.05, filter: "saturate(0) brightness(0.3) contrast(1.3)", duration: 0.04 }, t);
      tl.to(`#${stat}`, { opacity: 1, duration: 0.04 }, t);
      tl.to(`#${stat}`, { backgroundPosition: "0 80px", duration: len, ease: "none" }, t);
      tl.to(`#${photo}`, { opacity: 1, filter: "saturate(1.1) contrast(1.1)", duration: 0.1 }, t + len);
      tl.to(`#${stat}`, { opacity: 0, duration: 0.1 }, t + len);
      animateGlitch(tl, `#${photo}`, { at: t + len, amplitude: 14 });
    });
    const ids = [`#${bg}`, `#${photo}`, `#${stat}`, `#${scan}`, `#${vig}`];
    if (o.caption) {
      const cp = kitRef.id("tv-cp", at);
      createCaptionBubble(root, {
        id: cp,
        label: o.captionLabel || "CH 03 · LIVE",
        text: o.caption,
        x: 220,
        y: 840,
        width: 900,
        start: at + 0.6,
        duration: duration - 1,
        trackIndex: tk + 5,
      });
      animateBounceIn(tl, `#${cp}`, { at: at + 0.6, from: 20, duration: 0.35 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.spotlight = function (tl, root, o) {
    // Strong directional light: hard beam + flare + bright pulse
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("sl-bg", at);
    const photo = kitRef.id("sl-ph", at);
    const beam = kitRef.id("sl-bm", at);
    const flare = kitRef.id("sl-fl", at);
    const grain = kitRef.id("sl-gn", at);
    const vig = kitRef.id("sl-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "mono",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(0.85) brightness(0.55) contrast(1.1)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    // beam: a rotated linear gradient stripe
    const bm = createElement("div", "", {
      id: beam,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    const color = o.lightColor || "rgba(255, 240, 180, 0.55)";
    bm.style.background = `linear-gradient(100deg, transparent 0%, ${color} 45%, ${color} 55%, transparent 100%)`;
    bm.style.mixBlendMode = "screen";
    bm.style.opacity = "0";
    bm.style.pointerEvents = "none";
    append(root, bm);
    // flare: radial blob where the beam enters
    const fl = createElement("div", "", {
      id: flare,
      x: (o.flareX !== undefined ? o.flareX : 1400),
      y: (o.flareY !== undefined ? o.flareY : 120),
      width: 520,
      height: 520,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    fl.style.background = `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0) 60%)`;
    fl.style.filter = "blur(14px)";
    fl.style.mixBlendMode = "screen";
    fl.style.opacity = "0";
    fl.style.pointerEvents = "none";
    append(root, fl);
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.35,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 5,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.9 });
    // light switches on
    const onAt = at + (o.lightOnAt !== undefined ? o.lightOnAt : 1.1);
    tl.to(`#${beam}`, { opacity: 1, duration: 0.3, ease: "power2.out" }, onAt);
    tl.to(`#${flare}`, { opacity: 1, duration: 0.3, ease: "power2.out" }, onAt);
    tl.to(`#${photo}`, { filter: "saturate(1.1) brightness(1.1) contrast(1.12)", duration: 0.3 }, onAt);
    // slow sweep
    tl.to(`#${beam}`, { backgroundPosition: "120% 0", duration: duration - (onAt - at) - 0.4, ease: "none" }, onAt);
    // bright burst
    animateColorFlash(tl, `#${photo}`, { at: onAt, color: color });
    animateZoomPunch(tl, `#${photo}`, { at: onAt, scale: 1.08 });
    const ids = [`#${bg}`, `#${photo}`, `#${beam}`, `#${flare}`, `#${grain}`, `#${vig}`];
    if (o.headline) {
      const hl = kitRef.id("sl-hl", at);
      createHeadline(root, {
        id: hl,
        text: o.headline,
        x: 260,
        y: 320,
        width: 1200,
        start: onAt,
        duration: duration - (onAt - at) - 0.3,
        trackIndex: tk + 6,
      });
      animateReveal(tl, `#${hl}`, { at: onAt, y: 28, duration: 0.7 });
      ids.push(`#${hl}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.glassShatter = function (tl, root, o) {
    // Photo that cracks into shards, with an impact flash and SFX
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("gs-bg", at);
    const photo = kitRef.id("gs-ph", at);
    const cracks = kitRef.id("gs-cr", at);
    const flash = kitRef.id("gs-fl", at);
    const grain = kitRef.id("gs-gn", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "mono",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    const trig = at + (o.triggerAt !== undefined ? o.triggerAt : 1.8);
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    // crack overlay: web of lines + starburst
    const cr = createElement("div", "", {
      id: cracks,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      start: trig,
      duration: duration - (trig - at),
      trackIndex: tk + 2,
    });
    const cx = o.crackX !== undefined ? o.crackX : 52;
    const cy = o.crackY !== undefined ? o.crackY : 48;
    cr.style.background =
      `radial-gradient(circle at ${cx}% ${cy}%, rgba(255,255,255,0.9) 0 2px, rgba(255,255,255,0) 3px 100%),` +
      `conic-gradient(from 0deg at ${cx}% ${cy}%,` +
      " rgba(255,255,255,0.55) 0deg, rgba(255,255,255,0) 2deg," +
      " rgba(255,255,255,0.45) 28deg, rgba(255,255,255,0) 30deg," +
      " rgba(255,255,255,0.55) 68deg, rgba(255,255,255,0) 70deg," +
      " rgba(255,255,255,0.4) 112deg, rgba(255,255,255,0) 114deg," +
      " rgba(255,255,255,0.5) 158deg, rgba(255,255,255,0) 160deg," +
      " rgba(255,255,255,0.4) 202deg, rgba(255,255,255,0) 204deg," +
      " rgba(255,255,255,0.55) 248deg, rgba(255,255,255,0) 250deg," +
      " rgba(255,255,255,0.4) 292deg, rgba(255,255,255,0) 294deg," +
      " rgba(255,255,255,0.45) 338deg, rgba(255,255,255,0) 340deg)";
    cr.style.filter = "drop-shadow(0 0 6px rgba(255,255,255,0.6))";
    cr.style.mixBlendMode = "screen";
    cr.style.opacity = "0";
    cr.style.transform = "scale(0.6)";
    cr.style.pointerEvents = "none";
    append(root, cr);
    // impact flash
    const fl = createElement("div", "", {
      id: flash,
      inset: 72,
      start: trig,
      duration: 0.9,
      trackIndex: tk + 3,
    });
    fl.style.background = "rgba(255,255,255,1)";
    fl.style.mixBlendMode = "screen";
    fl.style.opacity = "0";
    fl.style.pointerEvents = "none";
    append(root, fl);
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.4,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.8 });
    animateKenBurns(tl, `#${photo}`, { at: at + 0.3, duration: (trig - at) - 0.4, fromScale: 1, toScale: 1.04 });
    // the hit
    tl.to(`#${flash}`, { opacity: 1, duration: 0.04 }, trig);
    tl.to(`#${flash}`, { opacity: 0, duration: 0.5, ease: "power2.in" }, trig + 0.06);
    tl.fromTo(`#${cracks}`, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.22, ease: "power4.out" }, trig);
    animateScreamShake(tl, `#${photo}`, { at: trig, amplitude: 22, duration: 0.6 });
    animateZoomPunch(tl, `#${photo}`, { at: trig, scale: 1.08 });
    // slow drift after impact
    tl.to(`#${photo}`, { scale: 1.1, duration: duration - (trig - at) - 0.4, ease: "power2.out" }, trig + 0.1);
    const ids = [`#${bg}`, `#${photo}`, `#${cracks}`, `#${flash}`, `#${grain}`];
    if (o.sfx) {
      const fx = kitRef.id("gs-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 220,
        y: 720,
        rotation: -6,
        fontSize: 164,
        color: o.sfxColor || "#e8f4ff",
        start: trig,
        duration: duration - (trig - at),
        trackIndex: tk + 5,
      });
      animateBounceIn(tl, `#${fx}`, { at: trig, from: 40, duration: 0.35 });
      animateVibrate(tl, `#${fx}`, { at: trig + 0.4, amplitude: 4, repeat: 10 });
      ids.push(`#${fx}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.explosion = function (tl, root, o) {
    // Radial orange/yellow burst + screen shake + SFX
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("ex-bg", at);
    const photo = kitRef.id("ex-ph", at);
    const burst = kitRef.id("ex-br", at);
    const flash = kitRef.id("ex-fl", at);
    const speed = kitRef.id("ex-sp", at);
    const grain = kitRef.id("ex-gn", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "mono",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const trig = at + (o.triggerAt !== undefined ? o.triggerAt : 1.2);
    // white flash
    const fl = createElement("div", "", {
      id: flash,
      inset: 72,
      start: trig,
      duration: 1,
      trackIndex: tk + 2,
    });
    fl.style.background = "rgba(255, 240, 200, 1)";
    fl.style.mixBlendMode = "screen";
    fl.style.opacity = "0";
    fl.style.pointerEvents = "none";
    append(root, fl);
    createRadialBurst(root, {
      id: burst,
      inset: 72,
      color: o.burstColor || "rgba(255, 160, 60, 0.9)",
      inner: 80,
      outer: 980,
      cx: 50,
      cy: 52,
      start: trig,
      duration: duration - (trig - at),
      trackIndex: tk + 3,
    });
    createSpeedLines(root, {
      id: speed,
      inset: 72,
      start: trig + 0.1,
      duration: duration - (trig - at) - 0.2,
      trackIndex: tk + 4,
    });
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.45,
      start: at,
      duration,
      trackIndex: tk + 5,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.6 });
    tl.to(`#${flash}`, { opacity: 1, duration: 0.04 }, trig);
    tl.to(`#${flash}`, { opacity: 0, duration: 0.6, ease: "power2.in" }, trig + 0.06);
    animateBurstExpand(tl, `#${burst}`, { at: trig, scale: 1.15, duration: 0.5 });
    tl.fromTo(`#${speed}`, { opacity: 0, scale: 0.6 }, { opacity: 0.9, scale: 1, duration: 0.3 }, trig + 0.1);
    tl.to(`#${speed}`, { rotation: 28, duration: duration - (trig - at) - 0.3, ease: "none" }, trig + 0.2);
    animateScreamShake(tl, `#${photo}`, { at: trig, amplitude: 26, duration: 1 });
    animateColorFlash(tl, `#${photo}`, { at: trig, color: "rgba(255, 180, 80, 0.7)" });
    animateZoomPunch(tl, `#${photo}`, { at: trig, scale: 1.15 });
    const ids = [`#${bg}`, `#${photo}`, `#${flash}`, `#${burst}`, `#${speed}`, `#${grain}`];
    if (o.sfx) {
      const fx = kitRef.id("ex-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 760,
        y: 760,
        rotation: -5,
        fontSize: 178,
        color: o.sfxColor || "#ffb347",
        start: trig,
        duration: duration - (trig - at),
        trackIndex: tk + 6,
      });
      animateBounceIn(tl, `#${fx}`, { at: trig, from: 60, duration: 0.35 });
      animateScreamShake(tl, `#${fx}`, { at: trig, amplitude: 14, duration: 0.9 });
      ids.push(`#${fx}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.fireGlow = function (tl, root, o) {
    // Warm flickering light from below — campfire or burning building
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("fg-bg", at);
    const photo = kitRef.id("fg-ph", at);
    const glow = kitRef.id("fg-gw", at);
    const emb = kitRef.id("fg-em", at);
    const grain = kitRef.id("fg-gn", at);
    const vig = kitRef.id("fg-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "storm",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(1.2) brightness(0.8) contrast(1.15)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const gw = createElement("div", "", {
      id: glow,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    gw.style.background =
      "radial-gradient(ellipse at 50% 100%, rgba(255, 140, 40, 0.8) 0%, rgba(220, 40, 30, 0.35) 35%, rgba(0,0,0,0) 70%)";
    gw.style.mixBlendMode = "screen";
    gw.style.pointerEvents = "none";
    append(root, gw);
    // embers: tiny dots that rise
    const em = createElement("div", "", {
      id: emb,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    em.style.background =
      "radial-gradient(circle at 20% 90%, rgba(255, 200, 80, 1) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 60% 80%, rgba(255, 180, 60, 1) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 85% 95%, rgba(255, 220, 120, 1) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 35% 70%, rgba(255, 160, 40, 1) 0 1px, transparent 2px)," +
      "radial-gradient(circle at 75% 65%, rgba(255, 210, 100, 1) 0 2px, transparent 3px)";
    em.style.backgroundSize = "360px 360px";
    em.style.mixBlendMode = "screen";
    em.style.opacity = "0.9";
    em.style.pointerEvents = "none";
    append(root, em);
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.4,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 5,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 1 });
    animateKenBurns(tl, `#${photo}`, { at: at + 0.4, duration: duration - 0.8, fromScale: 1.02, toScale: 1.08 });
    // flickering glow
    const flicks = Math.max(6, Math.floor((duration - 0.6) / 0.3));
    for (let i = 0; i < flicks; i++) {
      tl.to(`#${glow}`, { opacity: 0.6 + Math.random() * 0.4, duration: 0.25 + Math.random() * 0.15, ease: "sine.inOut" }, at + 0.3 + i * 0.3);
    }
    // embers rising
    tl.fromTo(`#${emb}`, { backgroundPosition: "0 0" }, { backgroundPosition: "0 -360px", duration, ease: "none" }, at);
    const ids = [`#${bg}`, `#${photo}`, `#${glow}`, `#${emb}`, `#${grain}`, `#${vig}`];
    if (o.caption) {
      const cp = kitRef.id("fg-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1.2,
        duration: duration - 1.6,
        trackIndex: tk + 6,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1.2, y: 16, duration: 0.6 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.snowfall = function (tl, root, o) {
    // Gentle falling snow, cold blue tint, quiet
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("sn-bg", at);
    const photo = kitRef.id("sn-ph", at);
    const layer1 = kitRef.id("sn-L1", at);
    const layer2 = kitRef.id("sn-L2", at);
    const vig = kitRef.id("sn-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "melancholy",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(0.7) brightness(0.95) hue-rotate(-10deg)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const mkFlakes = (id, size, density) => {
      const el = createElement("div", "", {
        id,
        inset: 72,
        start: at,
        duration,
        trackIndex: tk + (id === layer1 ? 2 : 3),
      });
      const dots = [];
      for (let i = 0; i < density; i++) {
        const x = Math.floor(Math.random() * 100);
        const y = Math.floor(Math.random() * 100);
        dots.push(`radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.95) 0 ${size}px, transparent ${size + 1}px)`);
      }
      el.style.background = dots.join(",");
      el.style.backgroundSize = "100% 100%";
      el.style.pointerEvents = "none";
      el.style.mixBlendMode = "screen";
      append(root, el);
    };
    mkFlakes(layer1, 2, 14);
    mkFlakes(layer2, 1, 24);
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 1 });
    animateKenBurns(tl, `#${photo}`, { at: at + 0.4, duration: duration - 0.8, fromScale: 1, toScale: 1.05 });
    // drift the flake layers downward with slight horizontal sway
    tl.to(`#${layer1}`, { y: 220, x: 40, duration, ease: "none" }, at);
    tl.to(`#${layer2}`, { y: 320, x: -30, duration, ease: "none" }, at);
    const ids = [`#${bg}`, `#${photo}`, `#${layer1}`, `#${layer2}`, `#${vig}`];
    if (o.caption) {
      const cp = kitRef.id("sn-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1,
        duration: duration - 1.4,
        trackIndex: tk + 5,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1, y: 14, duration: 0.6 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.neonPulse = function (tl, root, o) {
    // Neon sign pulsing on/off with buzz, saturation kicks
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("np-bg", at);
    const photo = kitRef.id("np-ph", at);
    const glow = kitRef.id("np-gw", at);
    const scan = kitRef.id("np-sc", at);
    const vig = kitRef.id("np-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "cyber",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(1.35) contrast(1.18)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const color = o.neonColor || "rgba(255, 60, 180, 0.55)";
    const gw = createElement("div", "", {
      id: glow,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    gw.style.background = `radial-gradient(ellipse at 50% 55%, ${color} 0%, rgba(0,0,0,0) 65%)`;
    gw.style.mixBlendMode = "screen";
    gw.style.pointerEvents = "none";
    append(root, gw);
    createScanlines(root, {
      id: scan,
      inset: 72,
      opacity: 0.3,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.6 });
    // neon buzz: random on/off
    const pulses = o.pulses || [0.6, 0.9, 1.05, 1.7, 2.2, 2.9, 3.5, 4.1];
    pulses.forEach((p) => {
      if (p >= duration - 0.3) return;
      const t = at + p;
      tl.to(`#${glow}`, { opacity: 0.15, duration: 0.06 }, t);
      tl.to(`#${photo}`, { filter: "saturate(0.6) brightness(0.5) contrast(1.2)", duration: 0.06 }, t);
      tl.to(`#${glow}`, { opacity: 1, duration: 0.12 }, t + 0.08);
      tl.to(`#${photo}`, { filter: "saturate(1.45) brightness(1.1) contrast(1.22)", duration: 0.12 }, t + 0.08);
    });
    const ids = [`#${bg}`, `#${photo}`, `#${glow}`, `#${scan}`, `#${vig}`];
    if (o.sign) {
      const sg = kitRef.id("np-sg", at);
      createSfxBurst(root, {
        id: sg,
        text: o.sign,
        x: 220,
        y: 280,
        rotation: -4,
        fontSize: 128,
        color: o.signColor || "#ff4fc1",
        start: at + 0.3,
        duration: duration - 0.6,
        trackIndex: tk + 5,
      });
      animateBounceIn(tl, `#${sg}`, { at: at + 0.3, from: 30, duration: 0.4 });
      animateFlicker(tl, `#${sg}`, { at: at + 0.9, min: 0.3, repeat: 8, duration: 0.08 });
      ids.push(`#${sg}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.heatHaze = function (tl, root, o) {
    // Desert / heat: warm tint, wobble filter, sun flare
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("hh-bg", at);
    const photo = kitRef.id("hh-ph", at);
    const flare = kitRef.id("hh-fl", at);
    const grain = kitRef.id("hh-gn", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "sunset",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(1.15) contrast(1.08) brightness(1.05) hue-rotate(-4deg)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const fl = createElement("div", "", {
      id: flare,
      x: 1420,
      y: 160,
      width: 520,
      height: 520,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    fl.style.background = "radial-gradient(circle, rgba(255, 230, 170, 0.85) 0%, rgba(255,180,60,0) 60%)";
    fl.style.filter = "blur(12px)";
    fl.style.mixBlendMode = "screen";
    fl.style.pointerEvents = "none";
    append(root, fl);
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.3,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 1 });
    // wobble via skew breathing
    tl.to(`#${photo}`, { skewX: 0.8, skewY: -0.4, duration: 1.4, ease: "sine.inOut", yoyo: true, repeat: Math.ceil(duration / 1.4) }, at + 0.5);
    tl.to(`#${flare}`, { scale: 1.1, duration: 1.8, yoyo: true, repeat: Math.ceil(duration / 1.8), ease: "sine.inOut" }, at);
    animateKenBurns(tl, `#${photo}`, { at: at + 0.3, duration: duration - 0.6, fromScale: 1, toScale: 1.05 });
    const ids = [`#${bg}`, `#${photo}`, `#${flare}`, `#${grain}`];
    if (o.caption) {
      const cp = kitRef.id("hh-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1.2,
        duration: duration - 1.6,
        trackIndex: tk + 4,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1.2, y: 14, duration: 0.6 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.underwater = function (tl, root, o) {
    // Cold blue tint, gentle wave ripple, caustic shimmer
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("uw-bg", at);
    const photo = kitRef.id("uw-ph", at);
    const caustics = kitRef.id("uw-cs", at);
    const bubbles = kitRef.id("uw-bb", at);
    const vig = kitRef.id("uw-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "storm",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(1.1) hue-rotate(-20deg) brightness(0.85) contrast(1.05)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const cs = createElement("div", "", {
      id: caustics,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    cs.style.background =
      "repeating-radial-gradient(circle at 30% 20%, rgba(150, 220, 255, 0.18) 0 12px, transparent 12px 40px)," +
      "repeating-radial-gradient(circle at 70% 80%, rgba(120, 200, 255, 0.14) 0 10px, transparent 10px 36px)";
    cs.style.mixBlendMode = "screen";
    cs.style.pointerEvents = "none";
    append(root, cs);
    const bb = createElement("div", "", {
      id: bubbles,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    bb.style.background =
      "radial-gradient(circle at 15% 90%, rgba(255,255,255,0.6) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 45% 85%, rgba(255,255,255,0.5) 0 3px, transparent 4px)," +
      "radial-gradient(circle at 75% 92%, rgba(255,255,255,0.55) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 88% 75%, rgba(255,255,255,0.5) 0 2px, transparent 3px)";
    bb.style.backgroundSize = "420px 420px";
    bb.style.mixBlendMode = "screen";
    bb.style.pointerEvents = "none";
    append(root, bb);
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 1.2 });
    // gentle sway
    tl.to(`#${photo}`, { skewX: 0.6, skewY: 0.3, duration: 2, yoyo: true, repeat: Math.ceil(duration / 2), ease: "sine.inOut" }, at);
    tl.to(`#${caustics}`, { backgroundPosition: "60px -40px, -40px 60px", duration, ease: "none" }, at);
    tl.to(`#${bubbles}`, { backgroundPosition: "0 -420px", duration: duration * 1.1, ease: "none" }, at);
    animateKenBurns(tl, `#${photo}`, { at: at + 0.4, duration: duration - 0.8, fromScale: 1.02, toScale: 1.1 });
    const ids = [`#${bg}`, `#${photo}`, `#${caustics}`, `#${bubbles}`, `#${vig}`];
    if (o.caption) {
      const cp = kitRef.id("uw-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1.2,
        duration: duration - 1.6,
        trackIndex: tk + 5,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1.2, y: 14, duration: 0.6 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.confetti = function (tl, root, o) {
    // Celebration: confetti burst + bright flash + happy scale pop
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("cf-bg", at);
    const photo = kitRef.id("cf-ph", at);
    const conf = kitRef.id("cf-cf", at);
    const flash = kitRef.id("cf-fl", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "sunset",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 420,
      y: 200,
      width: 1080,
      height: 720,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const fl = createElement("div", "", {
      id: flash,
      inset: 72,
      start: at + 0.3,
      duration: 0.8,
      trackIndex: tk + 2,
    });
    fl.style.background = "radial-gradient(circle at 50% 50%, rgba(255,255,220,0.8) 0%, rgba(255,255,255,0) 70%)";
    fl.style.mixBlendMode = "screen";
    fl.style.opacity = "0";
    fl.style.pointerEvents = "none";
    append(root, fl);
    // confetti: a grid of colourful tiny rects
    const cf = createElement("div", "", {
      id: conf,
      inset: 72,
      start: at + 0.3,
      duration: duration - 0.4,
      trackIndex: tk + 3,
    });
    const colours = ["#ff6b6b", "#ffd36a", "#6bd48f", "#6b9dff", "#ff8fd0", "#b58bff"];
    let bgParts = [];
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(Math.random() * 100);
      const y = Math.floor(Math.random() * 100);
      const c = colours[i % colours.length];
      bgParts.push(`radial-gradient(circle at ${x}% ${y}%, ${c} 0 3px, transparent 4px)`);
    }
    cf.style.background = bgParts.join(",");
    cf.style.pointerEvents = "none";
    append(root, cf);
    animateBounceIn(tl, `#${photo}`, { at, from: 40, duration: 0.5 });
    tl.to(`#${flash}`, { opacity: 1, duration: 0.1 }, at + 0.3);
    tl.to(`#${flash}`, { opacity: 0, duration: 0.6 }, at + 0.4);
    tl.fromTo(`#${conf}`, { y: -200, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }, at + 0.3);
    tl.to(`#${conf}`, { y: 260, duration: duration - 0.6, ease: "power1.in" }, at + 0.7);
    animateZoomPunch(tl, `#${photo}`, { at: at + 0.3, scale: 1.1 });
    animateSwing(tl, `#${photo}`, { at: at + 0.8, angle: 1.6, duration: 1.6 });
    const ids = [`#${bg}`, `#${photo}`, `#${flash}`, `#${conf}`];
    if (o.sfx) {
      const fx = kitRef.id("cf-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 220,
        y: 740,
        rotation: -6,
        fontSize: 152,
        color: o.sfxColor || "#ffd36a",
        start: at + 0.3,
        duration: duration - 0.5,
        trackIndex: tk + 4,
      });
      animateBounceIn(tl, `#${fx}`, { at: at + 0.3, from: 40, duration: 0.35 });
      animateVibrate(tl, `#${fx}`, { at: at + 0.8, amplitude: 3, repeat: 16 });
      ids.push(`#${fx}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.portal = function (tl, root, o) {
    // Magic portal opens in the center: rotating ring + burst + hero reveal
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("pt-bg", at);
    const photo = kitRef.id("pt-ph", at);
    const ring = kitRef.id("pt-rg", at);
    const burst = kitRef.id("pt-br", at);
    const sparkle = kitRef.id("pt-sp", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "cyber",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    const color = o.portalColor || "rgba(140, 220, 255, 0.8)";
    const rg = createElement("div", "", {
      id: ring,
      x: 760,
      y: 220,
      width: 400,
      height: 400,
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    rg.style.borderRadius = "50%";
    rg.style.background = `conic-gradient(from 0deg, ${color}, rgba(80, 120, 255, 0.1), ${color})`;
    rg.style.filter = "blur(6px)";
    rg.style.boxShadow = `0 0 80px 20px ${color}`;
    rg.style.transform = "scale(0)";
    append(root, rg);
    const photoEl = createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 760,
      y: 220,
      width: 400,
      height: 400,
      start: at + 0.8,
      duration: duration - 0.8,
      trackIndex: tk + 2,
    });
    if (photoEl) {
      photoEl.style.borderRadius = "50%";
      photoEl.style.boxShadow = `0 0 60px 10px ${color}`;
    }
    createRadialBurst(root, {
      id: burst,
      inset: 72,
      color,
      inner: 60,
      outer: 520,
      cx: 50,
      cy: 40,
      start: at + 0.8,
      duration: duration - 1.2,
      trackIndex: tk + 3,
    });
    const sp = createElement("div", "", {
      id: sparkle,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    sp.style.background =
      "radial-gradient(circle at 40% 30%, rgba(255,255,255,0.9) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 65% 55%, rgba(255,255,255,0.8) 0 3px, transparent 4px)," +
      "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.7) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 78% 40%, rgba(255,255,255,0.9) 0 2px, transparent 3px)";
    sp.style.backgroundSize = "300px 300px";
    sp.style.mixBlendMode = "screen";
    sp.style.pointerEvents = "none";
    sp.style.opacity = "0";
    append(root, sp);
    // ring opens
    tl.to(`#${ring}`, { scale: 1.2, duration: 0.6, ease: "back.out(2.2)" }, at + 0.1);
    tl.to(`#${ring}`, { rotation: 360, duration: duration - 0.3, ease: "none" }, at + 0.2);
    tl.to(`#${sparkle}`, { opacity: 1, duration: 0.6 }, at + 0.3);
    animateBurstExpand(tl, `#${burst}`, { at: at + 0.8, scale: 1.1, duration: 0.4, fade: false });
    animateBounceIn(tl, `#${photo}`, { at: at + 0.8, from: 0, duration: 0.5 });
    // hero emerges and grows
    tl.to(`#${photo}`, { scale: 1.4, x: 0, y: 0, duration: duration - 1.2, ease: "power2.out" }, at + 1);
    const ids = [`#${bg}`, `#${ring}`, `#${photo}`, `#${burst}`, `#${sparkle}`];
    if (o.sfx) {
      const fx = kitRef.id("pt-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 240,
        y: 760,
        rotation: -5,
        fontSize: 148,
        color: o.sfxColor || color,
        start: at + 0.8,
        duration: duration - 1,
        trackIndex: tk + 5,
      });
      animateBounceIn(tl, `#${fx}`, { at: at + 0.8, from: 40, duration: 0.4 });
      animateVibrate(tl, `#${fx}`, { at: at + 1.3, amplitude: 3, repeat: 16 });
      ids.push(`#${fx}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.lightFlicker = function (tl, root, o) {
    // Broken lamp: scene flickers between dark and lit, creepy
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("lf-bg", at);
    const photo = kitRef.id("lf-ph", at);
    const dark = kitRef.id("lf-dk", at);
    const grain = kitRef.id("lf-gn", at);
    const vig = kitRef.id("lf-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "storm",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(0.9) contrast(1.1) brightness(0.95)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const dk = createElement("div", "", {
      id: dark,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    dk.style.background = "rgba(0, 0, 0, 0.92)";
    dk.style.opacity = "0";
    dk.style.pointerEvents = "none";
    append(root, dk);
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.4,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.6 });
    // flicker pattern
    const pattern = o.pattern || [
      [0.6, 0.08], [0.75, 0.05], [0.9, 0.12],
      [1.8, 0.06], [2.1, 0.22],
      [3.0, 0.04], [3.3, 0.18],
      [4.0, 0.08], [4.3, 0.3],
    ];
    pattern.forEach(([t, len]) => {
      if (t + len >= duration) return;
      tl.to(`#${dark}`, { opacity: 1, duration: 0.02 }, at + t);
      tl.to(`#${dark}`, { opacity: 0, duration: 0.04 }, at + t + len);
    });
    animateKenBurns(tl, `#${photo}`, { at: at + 0.3, duration: duration - 0.6, fromScale: 1, toScale: 1.06 });
    const ids = [`#${bg}`, `#${photo}`, `#${dark}`, `#${grain}`, `#${vig}`];
    if (o.caption) {
      const cp = kitRef.id("lf-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1.2,
        duration: duration - 1.6,
        trackIndex: tk + 5,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1.2, y: 14, duration: 0.6 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.chaseCam = function (tl, root, o) {
    // Shaky "running camera" with motion blur and fast speed lines
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("cc-bg", at);
    const photo = kitRef.id("cc-ph", at);
    const speed = kitRef.id("cc-sp", at);
    const vig = kitRef.id("cc-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "mono",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(1.05) contrast(1.12) brightness(0.95)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createSpeedLines(root, {
      id: speed,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.4 });
    // continuous shake over the whole scene (hand-held)
    const steps = Math.floor(duration / 0.12);
    for (let i = 0; i < steps; i++) {
      tl.to(`#${photo}`, {
        x: (Math.random() - 0.5) * 18,
        y: (Math.random() - 0.5) * 12,
        rotation: (Math.random() - 0.5) * 1.2,
        duration: 0.12,
        ease: "none",
      }, at + i * 0.12);
    }
    tl.to(`#${speed}`, { rotation: 20, duration, ease: "none" }, at);
    animateKenBurns(tl, `#${photo}`, { at: at + 0.2, duration: duration - 0.4, fromScale: 1.05, toScale: 1.2 });
    const ids = [`#${bg}`, `#${photo}`, `#${speed}`, `#${vig}`];
    if (o.sfx) {
      const fx = kitRef.id("cc-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 240,
        y: 760,
        rotation: -7,
        fontSize: 148,
        color: o.sfxColor || "#ff7a59",
        start: at + 0.6,
        duration: duration - 0.9,
        trackIndex: tk + 4,
      });
      animateBounceIn(tl, `#${fx}`, { at: at + 0.6, from: 40, duration: 0.35 });
      animateVibrate(tl, `#${fx}`, { at: at + 1.1, amplitude: 4, repeat: 16 });
      ids.push(`#${fx}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  // ----- Elemental / weather ensemble scenes -----

  scenes.windGust = function (tl, root, o) {
    // Strong wind: horizontal streaks, tilted photo, debris flying across
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("wg-bg", at);
    const photo = kitRef.id("wg-ph", at);
    const streaks = kitRef.id("wg-st", at);
    const debris = kitRef.id("wg-db", at);
    const vig = kitRef.id("wg-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "storm",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(0.95) contrast(1.1)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const st = createElement("div", "", {
      id: streaks,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    st.style.background =
      "repeating-linear-gradient(90deg, rgba(255,255,255,0.22) 0 2px, transparent 2px 48px)," +
      "repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0 1px, transparent 1px 22px)";
    st.style.backgroundSize = "400% 100%, 260% 100%";
    st.style.mixBlendMode = "screen";
    st.style.pointerEvents = "none";
    append(root, st);
    const db = createElement("div", "", {
      id: debris,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    const color = o.debrisColor || "rgba(220, 180, 120, 0.9)";
    db.style.background =
      `radial-gradient(circle at 10% 40%, ${color} 0 3px, transparent 4px),` +
      `radial-gradient(circle at 30% 70%, ${color} 0 2px, transparent 3px),` +
      `radial-gradient(circle at 55% 30%, ${color} 0 3px, transparent 4px),` +
      `radial-gradient(circle at 78% 60%, ${color} 0 2px, transparent 3px),` +
      `radial-gradient(circle at 92% 25%, ${color} 0 3px, transparent 4px)`;
    db.style.backgroundSize = "280px 200px";
    db.style.pointerEvents = "none";
    db.style.transform = "skewX(-10deg)";
    append(root, db);
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.5 });
    // photo leans with gusts
    tl.to(`#${photo}`, { rotation: -1.2, skewX: 0.8, duration: 1.4, yoyo: true, repeat: Math.ceil(duration / 1.4), ease: "sine.inOut" }, at + 0.3);
    // streaks sweep across
    tl.fromTo(`#${streaks}`, { backgroundPosition: "-100% 0, 0 0" }, { backgroundPosition: "100% 0, -200% 0", duration, ease: "none" }, at);
    // debris flies right
    tl.fromTo(`#${debris}`, { x: -300 }, { x: 1600, duration: duration * 1.1, ease: "power1.in" }, at);
    animateKenBurns(tl, `#${photo}`, { at: at + 0.3, duration: duration - 0.6, fromScale: 1.05, toScale: 1.12 });
    const ids = [`#${bg}`, `#${photo}`, `#${streaks}`, `#${debris}`, `#${vig}`];
    if (o.sfx) {
      const fx = kitRef.id("wg-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 240,
        y: 760,
        rotation: -4,
        fontSize: 148,
        color: o.sfxColor || "#d6e4f0",
        start: at + 0.5,
        duration: duration - 0.8,
        trackIndex: tk + 5,
      });
      animateBounceIn(tl, `#${fx}`, { at: at + 0.5, from: -60, duration: 0.4 });
      animateVibrate(tl, `#${fx}`, { at: at + 1, amplitude: 3, repeat: 14 });
      ids.push(`#${fx}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.tempest = function (tl, root, o) {
    // Full storm: heavy rain + lightning strikes + darkening + thunder
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("tm-bg", at);
    const photo = kitRef.id("tm-ph", at);
    const rain1 = kitRef.id("tm-r1", at);
    const rain2 = kitRef.id("tm-r2", at);
    const flash = kitRef.id("tm-fl", at);
    const grain = kitRef.id("tm-gn", at);
    const vig = kitRef.id("tm-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "storm",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(0.7) brightness(0.55) contrast(1.2)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    createRainLines(root, {
      id: rain1,
      inset: 72,
      angle: 110,
      opacity: 0.8,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    createRainLines(root, {
      id: rain2,
      inset: 72,
      angle: 100,
      opacity: 0.55,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    const fl = createElement("div", "", {
      id: flash,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    fl.style.background = "rgba(220, 230, 255, 1)";
    fl.style.mixBlendMode = "screen";
    fl.style.opacity = "0";
    fl.style.pointerEvents = "none";
    append(root, fl);
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.4,
      start: at,
      duration,
      trackIndex: tk + 5,
    });
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 6,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.8 });
    tl.to(`#${rain1}`, { backgroundPositionY: "260px", duration, ease: "none" }, at);
    tl.to(`#${rain2}`, { backgroundPositionY: "200px", duration, ease: "none" }, at);
    // gust sway
    tl.to(`#${photo}`, { rotation: -0.8, skewX: 0.6, duration: 2, yoyo: true, repeat: Math.ceil(duration / 2), ease: "sine.inOut" }, at + 0.5);
    // multi lightning strikes
    const strikes = o.strikes || [1.1, 2.6, 3.8];
    strikes.forEach((s) => {
      if (s >= duration - 0.2) return;
      const t = at + s;
      tl.to(`#${flash}`, { opacity: 0.85, duration: 0.04 }, t);
      tl.to(`#${flash}`, { opacity: 0, duration: 0.12 }, t + 0.06);
      tl.to(`#${flash}`, { opacity: 0.6, duration: 0.04 }, t + 0.2);
      tl.to(`#${flash}`, { opacity: 0, duration: 0.3, ease: "power2.in" }, t + 0.26);
      tl.to(`#${photo}`, { filter: "saturate(1.2) brightness(1.4) contrast(1.25)", duration: 0.06 }, t);
      tl.to(`#${photo}`, { filter: "saturate(0.7) brightness(0.55) contrast(1.2)", duration: 0.5 }, t + 0.1);
      animateScreamShake(tl, `#${photo}`, { at: t + 0.15, amplitude: 14, duration: 0.5 });
    });
    const ids = [`#${bg}`, `#${photo}`, `#${rain1}`, `#${rain2}`, `#${flash}`, `#${grain}`, `#${vig}`];
    if (o.caption) {
      const cp = kitRef.id("tm-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1.2,
        duration: duration - 1.6,
        trackIndex: tk + 7,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1.2, y: 14, duration: 0.6 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.sandstorm = function (tl, root, o) {
    // Desert wind: orange dust layers sweeping, reduced visibility
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("ss-bg", at);
    const photo = kitRef.id("ss-ph", at);
    const dust1 = kitRef.id("ss-d1", at);
    const dust2 = kitRef.id("ss-d2", at);
    const grain = kitRef.id("ss-gn", at);
    const vig = kitRef.id("ss-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "sunset",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(0.9) brightness(0.9) contrast(1.1) sepia(0.2)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const mkDust = (id, color, track) => {
      const el = createElement("div", "", {
        id,
        inset: 72,
        start: at,
        duration,
        trackIndex: track,
      });
      el.style.background = `linear-gradient(92deg, transparent 0%, ${color} 30%, ${color} 55%, transparent 85%)`;
      el.style.backgroundSize = "260% 100%";
      el.style.mixBlendMode = "multiply";
      el.style.filter = "blur(14px)";
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
      append(root, el);
    };
    mkDust(dust1, "rgba(210, 150, 90, 0.85)", tk + 2);
    mkDust(dust2, "rgba(230, 180, 120, 0.7)", tk + 3);
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.55,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 5,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.8 });
    tl.to(`#${dust1}`, { opacity: 1, duration: 0.8 }, at + 0.3);
    tl.to(`#${dust2}`, { opacity: 0.9, duration: 1.2 }, at + 0.6);
    tl.fromTo(`#${dust1}`, { backgroundPosition: "-80% 0" }, { backgroundPosition: "180% 0", duration: duration * 1.1, ease: "none" }, at);
    tl.fromTo(`#${dust2}`, { backgroundPosition: "20% 0" }, { backgroundPosition: "-200% 0", duration: duration * 1.3, ease: "none" }, at);
    // photo darkens as storm thickens
    tl.to(`#${photo}`, { filter: "saturate(0.6) brightness(0.55) contrast(1.15) sepia(0.45)", duration: duration * 0.6 }, at + 0.4);
    animateKenBurns(tl, `#${photo}`, { at: at + 0.3, duration: duration - 0.6, fromScale: 1.04, toScale: 1.12 });
    const ids = [`#${bg}`, `#${photo}`, `#${dust1}`, `#${dust2}`, `#${grain}`, `#${vig}`];
    if (o.caption) {
      const cp = kitRef.id("ss-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1.2,
        duration: duration - 1.6,
        trackIndex: tk + 6,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1.2, y: 14, duration: 0.6 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.tornado = function (tl, root, o) {
    // Atmospheric vortex: swirling dust bands across the whole viewport + orbiting debris + shake.
    // Deliberately NOT a clipped triangle — it reads as chaotic wind, not a spinning propeller.
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("tn-bg", at);
    const photo = kitRef.id("tn-ph", at);
    const swirl1 = kitRef.id("tn-s1", at);
    const swirl2 = kitRef.id("tn-s2", at);
    const haze = kitRef.id("tn-hz", at);
    const vig = kitRef.id("tn-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "storm",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(0.75) brightness(0.65) contrast(1.2)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    // Debris drifting — small dust particles scattered across viewport, drift mostly upward/sideways.
    const debrisColor = o.debrisColor || "rgba(150, 130, 100, 0.9)";
    const particleIds = [];
    const particleCount = o.particleCount || 28;
    for (let i = 0; i < particleCount; i++) {
      const pid = kitRef.id("tn-p" + i, at);
      const px = 960 + (Math.random() - 0.5) * 1760;
      const py = 540 + (Math.random() - 0.5) * 900;
      const sz = 2 + Math.random() * 4;
      const p = createElement("div", "", {
        id: pid,
        x: px,
        y: py,
        width: sz,
        height: sz,
        start: at + 0.2,
        duration: duration - 0.3,
        trackIndex: tk + 2 + i,
      });
      p.style.borderRadius = "50%";
      p.style.background = debrisColor;
      p.style.pointerEvents = "none";
      p.style.filter = "blur(0.5px)";
      append(root, p);
      particleIds.push({ id: pid, px, py });
    }
    // Vertical dark funnel CONE in the background: wider at top, narrow at bottom.
    // Sways irregularly left/right with slight scale/skew variation. NO rotation, so it never
    // reads as radial sun rays.
    const mkCone = (id, track, color, blur, widthTop, widthBot, opacity) => {
      const el = createElement("div", "", {
        id,
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        start: at,
        duration,
        trackIndex: track,
      });
      // trapezoidal cone via clip-path (wider top, narrow bottom)
      const leftTop = (50 - widthTop / 2).toFixed(1);
      const rightTop = (50 + widthTop / 2).toFixed(1);
      const leftBot = (50 - widthBot / 2).toFixed(1);
      const rightBot = (50 + widthBot / 2).toFixed(1);
      el.style.clipPath =
        `polygon(${leftTop}% 0%, ${rightTop}% 0%, ${rightBot}% 100%, ${leftBot}% 100%)`;
      el.style.background =
        `linear-gradient(180deg, ${color} 0%, ${color.replace(/[\d.]+\)$/, "0.2)")} 60%, rgba(0,0,0,0) 100%)`;
      el.style.filter = `blur(${blur}px)`;
      el.style.opacity = String(opacity);
      el.style.mixBlendMode = "multiply";
      el.style.pointerEvents = "none";
      el.style.transformOrigin = "50% 0%";
      append(root, el);
    };
    // Two stacked cones for depth: a wider outer diffuse cone + a darker inner core.
    mkCone(swirl1, tk + 2 + particleCount, "rgba(40, 38, 48, 0.75)", 28, 60, 14, 0.85);
    mkCone(swirl2, tk + 3 + particleCount, "rgba(20, 18, 24, 0.9)", 14, 34, 6, 0.9);
    // ambient haze darkening
    const hz = createElement("div", "", {
      id: haze,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4 + particleCount,
    });
    hz.style.background =
      "radial-gradient(ellipse at 50% 50%, rgba(30, 30, 40, 0) 0%, rgba(30, 30, 40, 0.6) 80%)";
    hz.style.mixBlendMode = "multiply";
    hz.style.pointerEvents = "none";
    append(root, hz);
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 5 + particleCount,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.8 });
    // Cones appear, then sway irregularly side-to-side with slight skew (no rotation → no sunray look)
    tl.fromTo(`#${swirl1}`, { opacity: 0, scaleY: 0.85 }, { opacity: 0.85, scaleY: 1, duration: 1 }, at + 0.2);
    tl.fromTo(`#${swirl2}`, { opacity: 0, scaleY: 0.9 }, { opacity: 0.9, scaleY: 1, duration: 1.2 }, at + 0.4);
    const swayStep = 0.35;
    const swayCount = Math.floor(duration / swayStep);
    for (let i = 0; i < swayCount; i++) {
      const t = at + 0.4 + i * swayStep;
      const dx1 = (Math.random() - 0.5) * 260;
      const sk1 = (Math.random() - 0.5) * 16;
      const dx2 = (Math.random() - 0.5) * 180;
      const sk2 = (Math.random() - 0.5) * 22;
      tl.to(`#${swirl1}`, { x: dx1, skewX: sk1, duration: swayStep, ease: "sine.inOut" }, t);
      tl.to(`#${swirl2}`, { x: dx2, skewX: sk2, duration: swayStep, ease: "sine.inOut" }, t);
    }
    // each particle orbits around viewport center on its own radius/speed
    particleIds.forEach((p, idx) => {
      const dx = p.px - 960;
      const dy = p.py - 540;
      const r = Math.sqrt(dx * dx + dy * dy);
      const a0 = Math.atan2(dy, dx);
      const speed = 1.8 + Math.random() * 2.2; // rotations during the scene
      const dir = idx % 2 === 0 ? 1 : -1;
      const turnDur = duration / speed;
      const points = 24;
      for (let s = 0; s < points; s++) {
        const t = at + 0.2 + (duration - 0.3) * (s / points);
        const ang = a0 + dir * (Math.PI * 2 * speed) * (s / points);
        const nx = 960 + r * Math.cos(ang);
        const ny = 540 + r * Math.sin(ang);
        tl.to(`#${p.id}`, { x: nx, y: ny, duration: (duration - 0.3) / points, ease: "none" }, t);
      }
    });
    // continuous rumble
    const steps = Math.floor(duration / 0.1);
    for (let i = 0; i < steps; i++) {
      tl.to(`#${photo}`, {
        x: (Math.random() - 0.5) * 12,
        y: (Math.random() - 0.5) * 9,
        duration: 0.1,
        ease: "none",
      }, at + i * 0.1);
    }
    // photo slightly blurs+desaturates as the storm peaks
    tl.to(`#${photo}`, { filter: "saturate(0.55) brightness(0.5) contrast(1.2) blur(1.5px)", duration: duration * 0.5 }, at + 0.4);
    const ids = [`#${bg}`, `#${photo}`, `#${swirl1}`, `#${swirl2}`, `#${haze}`, `#${vig}`];
    particleIds.forEach((p) => ids.push(`#${p.id}`));
    if (o.sfx) {
      const fx = kitRef.id("tn-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 240,
        y: 760,
        rotation: -5,
        fontSize: 152,
        color: o.sfxColor || "#c8cfd8",
        start: at + 0.8,
        duration: duration - 1,
        trackIndex: tk + 6 + particleCount,
      });
      animateBounceIn(tl, `#${fx}`, { at: at + 0.8, from: 40, duration: 0.4 });
      animateVibrate(tl, `#${fx}`, { at: at + 1.3, amplitude: 4, repeat: 16 });
      ids.push(`#${fx}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.raging_fire = function (tl, root, o) {
    // Full raging fire: orange/red wash, licking flame shapes, intense heat
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("rf-bg", at);
    const photo = kitRef.id("rf-ph", at);
    const flames = kitRef.id("rf-fm", at);
    const heat = kitRef.id("rf-ht", at);
    const embers = kitRef.id("rf-em", at);
    const grain = kitRef.id("rf-gn", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "mono",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(1.3) brightness(0.85) contrast(1.25) hue-rotate(-8deg)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const fm = createElement("div", "", {
      id: flames,
      x: 72,
      y: 520,
      width: 1776,
      height: 560,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    fm.style.background =
      "radial-gradient(ellipse 30% 80% at 15% 100%, rgba(255, 90, 30, 0.9) 0%, rgba(255,90,30,0) 70%)," +
      "radial-gradient(ellipse 25% 90% at 35% 100%, rgba(255, 140, 40, 0.9) 0%, rgba(255,140,40,0) 70%)," +
      "radial-gradient(ellipse 28% 85% at 55% 100%, rgba(255, 70, 20, 0.9) 0%, rgba(255,70,20,0) 70%)," +
      "radial-gradient(ellipse 26% 95% at 75% 100%, rgba(255, 160, 50, 0.9) 0%, rgba(255,160,50,0) 70%)," +
      "radial-gradient(ellipse 30% 80% at 92% 100%, rgba(255, 100, 30, 0.9) 0%, rgba(255,100,30,0) 70%)";
    fm.style.mixBlendMode = "screen";
    fm.style.pointerEvents = "none";
    append(root, fm);
    const ht = createElement("div", "", {
      id: heat,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    ht.style.background = "radial-gradient(ellipse at 50% 90%, rgba(255, 120, 30, 0.5) 0%, rgba(255,60,20,0.25) 30%, rgba(0,0,0,0) 70%)";
    ht.style.mixBlendMode = "screen";
    ht.style.pointerEvents = "none";
    append(root, ht);
    const em = createElement("div", "", {
      id: embers,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    em.style.background =
      "radial-gradient(circle at 12% 90%, rgba(255, 220, 120, 1) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 30% 80%, rgba(255, 200, 80, 1) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 48% 92%, rgba(255, 240, 140, 1) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 66% 75%, rgba(255, 180, 60, 1) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 82% 88%, rgba(255, 210, 100, 1) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 94% 70%, rgba(255, 220, 120, 1) 0 2px, transparent 3px)";
    em.style.backgroundSize = "320px 320px";
    em.style.mixBlendMode = "screen";
    em.style.pointerEvents = "none";
    append(root, em);
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.45,
      start: at,
      duration,
      trackIndex: tk + 5,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.6 });
    // flames lick & breathe
    const breaths = Math.max(5, Math.floor(duration / 0.5));
    for (let i = 0; i < breaths; i++) {
      tl.to(`#${flames}`, {
        scaleY: 0.9 + Math.random() * 0.35,
        scaleX: 0.95 + Math.random() * 0.1,
        opacity: 0.85 + Math.random() * 0.15,
        duration: 0.45 + Math.random() * 0.2,
        transformOrigin: "50% 100%",
        ease: "sine.inOut",
      }, at + i * 0.5);
    }
    // heat pulse
    tl.to(`#${heat}`, { opacity: 0.6, duration: 1.2, yoyo: true, repeat: Math.ceil(duration / 1.2), ease: "sine.inOut" }, at);
    // embers rising
    tl.fromTo(`#${embers}`, { backgroundPosition: "0 0" }, { backgroundPosition: "0 -420px", duration, ease: "none" }, at);
    // color wash pulse on photo
    tl.to(`#${photo}`, { filter: "saturate(1.4) brightness(0.95) contrast(1.3) hue-rotate(-10deg)", duration: 0.9, yoyo: true, repeat: Math.ceil(duration / 0.9), ease: "sine.inOut" }, at + 0.3);
    animateKenBurns(tl, `#${photo}`, { at: at + 0.3, duration: duration - 0.6, fromScale: 1.05, toScale: 1.15 });
    const ids = [`#${bg}`, `#${photo}`, `#${flames}`, `#${heat}`, `#${embers}`, `#${grain}`];
    if (o.sfx) {
      const fx = kitRef.id("rf-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 240,
        y: 260,
        rotation: -5,
        fontSize: 158,
        color: o.sfxColor || "#ffb347",
        start: at + 0.4,
        duration: duration - 0.7,
        trackIndex: tk + 6,
      });
      animateBounceIn(tl, `#${fx}`, { at: at + 0.4, from: -40, duration: 0.4 });
      animateVibrate(tl, `#${fx}`, { at: at + 0.9, amplitude: 4, repeat: 18 });
      ids.push(`#${fx}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };
  // alias without underscore for convenience
  scenes.ragingFire = scenes.raging_fire;

  scenes.earthquake = function (tl, root, o) {
    // Ground shakes, dust falls from the top, everything trembles
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("eq-bg", at);
    const photo = kitRef.id("eq-ph", at);
    const dust = kitRef.id("eq-ds", at);
    const crackFx = kitRef.id("eq-ck", at);
    const vig = kitRef.id("eq-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "mono",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(0.9) contrast(1.15) brightness(0.95)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const ds = createElement("div", "", {
      id: dust,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    ds.style.background =
      "radial-gradient(circle at 20% 0%, rgba(200,180,150,0.8) 0 3px, transparent 4px)," +
      "radial-gradient(circle at 45% 0%, rgba(210,190,160,0.7) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 65% 0%, rgba(190,170,140,0.8) 0 3px, transparent 4px)," +
      "radial-gradient(circle at 85% 0%, rgba(220,200,170,0.7) 0 2px, transparent 3px)";
    ds.style.backgroundSize = "240px 420px";
    ds.style.mixBlendMode = "screen";
    ds.style.pointerEvents = "none";
    append(root, ds);
    const ck = createElement("div", "", {
      id: crackFx,
      inset: 72,
      start: at + (o.crackAt !== undefined ? o.crackAt : 1.6),
      duration: duration - (o.crackAt !== undefined ? o.crackAt : 1.6),
      trackIndex: tk + 3,
    });
    // Irregular branching cracks drawn as SVG polylines across the full viewport.
    // Guaranteed coverage: trunks crossing edge-to-opposite-edge distributed across all quadrants.
    const W = 1776;
    const H = 936;
    const trunkCount = o.crackTrunks || 6;
    const rnd = (lo, hi) => lo + Math.random() * (hi - lo);
    const jagPath = (sx, sy, ex, ey, segs) => {
      let d = `M ${sx.toFixed(1)} ${sy.toFixed(1)}`;
      for (let i = 1; i <= segs; i++) {
        const t = i / segs;
        const nx = sx + (ex - sx) * t + rnd(-26, 26);
        const ny = sy + (ey - sy) * t + rnd(-26, 26);
        d += ` L ${nx.toFixed(1)} ${ny.toFixed(1)}`;
      }
      return d;
    };
    const paths = [];
    // Start points anchored to each screen edge in rotation so every region gets a trunk.
    // Endpoints pushed to the OPPOSITE side so cracks traverse the whole viewport.
    const edgeOrder = [0, 1, 2, 3, 0, 2, 1, 3];
    for (let i = 0; i < trunkCount; i++) {
      const edge = edgeOrder[i % edgeOrder.length];
      let sx = 0, sy = 0, ex = 0, ey = 0;
      if (edge === 0) {
        // top → bottom
        sx = rnd(W * 0.1, W * 0.9); sy = rnd(-10, 20);
        ex = rnd(W * 0.1, W * 0.9); ey = rnd(H * 0.85, H + 10);
      } else if (edge === 1) {
        // right → left
        sx = rnd(W - 20, W + 10); sy = rnd(H * 0.1, H * 0.9);
        ex = rnd(-10, W * 0.15); ey = rnd(H * 0.1, H * 0.9);
      } else if (edge === 2) {
        // bottom → top
        sx = rnd(W * 0.1, W * 0.9); sy = rnd(H - 20, H + 10);
        ex = rnd(W * 0.1, W * 0.9); ey = rnd(-10, H * 0.15);
      } else {
        // left → right
        sx = rnd(-10, 20); sy = rnd(H * 0.1, H * 0.9);
        ex = rnd(W * 0.85, W + 10); ey = rnd(H * 0.1, H * 0.9);
      }
      paths.push(jagPath(sx, sy, ex, ey, 10 + Math.floor(Math.random() * 5)));
      // 3-4 branches sprouting along the trunk
      const branches = 3 + Math.floor(Math.random() * 2);
      for (let b = 0; b < branches; b++) {
        const bt = 0.2 + Math.random() * 0.65;
        const bx0 = sx + (ex - sx) * bt + rnd(-24, 24);
        const by0 = sy + (ey - sy) * bt + rnd(-24, 24);
        const bex = bx0 + rnd(-320, 320);
        const bey = by0 + rnd(-280, 280);
        paths.push(jagPath(bx0, by0, bex, bey, 5 + Math.floor(Math.random() * 3)));
        // little hair branches
        if (Math.random() > 0.4) {
          paths.push(jagPath(bx0, by0, bx0 + rnd(-110, 110), by0 + rnd(-110, 110), 3));
        }
      }
    }
    // Extra diagonal star-cracks from 2-3 random impact points to ensure the center also breaks.
    const impactPts = 2 + Math.floor(Math.random() * 2);
    for (let k = 0; k < impactPts; k++) {
      const cx = rnd(W * 0.2, W * 0.8);
      const cy = rnd(H * 0.2, H * 0.8);
      const rays = 4 + Math.floor(Math.random() * 3);
      for (let r = 0; r < rays; r++) {
        const ang = (Math.PI * 2 * r) / rays + rnd(-0.5, 0.5);
        const len = rnd(260, 520);
        paths.push(jagPath(cx, cy, cx + Math.cos(ang) * len, cy + Math.sin(ang) * len, 5));
      }
    }
    const strokeDark = "rgba(6, 6, 8, 0.92)";
    const strokeLight = "rgba(235, 235, 240, 0.55)";
    const svgParts = paths.map((d) =>
      `<path d="${d}" stroke="${strokeDark}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${d}" stroke="${strokeLight}" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    ).join("");
    ck.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:100%;filter:drop-shadow(0 0 3px rgba(0,0,0,0.6));">${svgParts}</svg>`;
    ck.style.opacity = "0";
    ck.style.pointerEvents = "none";
    append(root, ck);
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.5 });
    // heavy shake
    const steps = Math.floor(duration / 0.08);
    for (let i = 0; i < steps; i++) {
      const amp = 20 + Math.random() * 10;
      tl.to(`#${photo}`, {
        x: (Math.random() - 0.5) * amp,
        y: (Math.random() - 0.5) * amp,
        rotation: (Math.random() - 0.5) * 0.8,
        duration: 0.08,
        ease: "none",
      }, at + i * 0.08);
    }
    // dust falls
    tl.fromTo(`#${dust}`, { y: -200, opacity: 0 }, { y: 300, opacity: 1, duration, ease: "power1.in" }, at);
    // crack appears
    const crAt = at + (o.crackAt !== undefined ? o.crackAt : 1.6);
    tl.fromTo(`#${crackFx}`, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power3.out" }, crAt);
    animateColorFlash(tl, `#${photo}`, { at: crAt, color: "rgba(255,255,255,0.4)" });
    const ids = [`#${bg}`, `#${photo}`, `#${dust}`, `#${crackFx}`, `#${vig}`];
    if (o.sfx) {
      const fx = kitRef.id("eq-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 240,
        y: 760,
        rotation: -6,
        fontSize: 156,
        color: o.sfxColor || "#c8c0b0",
        start: at + 0.4,
        duration: duration - 0.6,
        trackIndex: tk + 5,
      });
      animateBounceIn(tl, `#${fx}`, { at: at + 0.4, from: 40, duration: 0.35 });
      animateScreamShake(tl, `#${fx}`, { at: at + 0.4, amplitude: 18, duration: duration - 0.6 });
      ids.push(`#${fx}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.fogRoll = function (tl, root, o) {
    // Fog drifting in and covering the scene, quiet and ominous
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("fr-bg", at);
    const photo = kitRef.id("fr-ph", at);
    const fog1 = kitRef.id("fr-f1", at);
    const fog2 = kitRef.id("fr-f2", at);
    const vig = kitRef.id("fr-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "melancholy",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(0.75) brightness(0.95) contrast(1.05)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const mkFog = (id, color, track, blur) => {
      const el = createElement("div", "", {
        id,
        inset: 72,
        start: at,
        duration,
        trackIndex: track,
      });
      el.style.background = `linear-gradient(90deg, transparent 0%, ${color} 40%, ${color} 60%, transparent 100%)`;
      el.style.backgroundSize = "260% 100%";
      el.style.filter = `blur(${blur}px)`;
      el.style.mixBlendMode = "screen";
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
      append(root, el);
    };
    mkFog(fog1, "rgba(240, 240, 245, 0.75)", tk + 2, 28);
    mkFog(fog2, "rgba(220, 225, 235, 0.6)", tk + 3, 18);
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 1 });
    tl.to(`#${fog1}`, { opacity: 1, duration: duration * 0.4 }, at + 0.4);
    tl.to(`#${fog2}`, { opacity: 0.9, duration: duration * 0.5 }, at + 0.8);
    tl.fromTo(`#${fog1}`, { backgroundPosition: "-60% 0" }, { backgroundPosition: "160% 0", duration: duration * 1.2, ease: "none" }, at);
    tl.fromTo(`#${fog2}`, { backgroundPosition: "40% 0" }, { backgroundPosition: "-140% 0", duration: duration * 1.4, ease: "none" }, at);
    // photo gently fades
    tl.to(`#${photo}`, { filter: "saturate(0.6) brightness(0.9) contrast(1) blur(1.5px)", duration: duration * 0.7 }, at + 0.4);
    animateKenBurns(tl, `#${photo}`, { at: at + 0.3, duration: duration - 0.6, fromScale: 1.02, toScale: 1.08 });
    const ids = [`#${bg}`, `#${photo}`, `#${fog1}`, `#${fog2}`, `#${vig}`];
    if (o.caption) {
      const cp = kitRef.id("fr-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1.2,
        duration: duration - 1.6,
        trackIndex: tk + 5,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1.2, y: 14, duration: 0.6 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.aurora = function (tl, root, o) {
    // Northern lights: slow colored waves across the top, calm, magical
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("au-bg", at);
    const photo = kitRef.id("au-ph", at);
    const w1 = kitRef.id("au-w1", at);
    const w2 = kitRef.id("au-w2", at);
    const stars = kitRef.id("au-sr", at);
    const vig = kitRef.id("au-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "night",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 260,
      width: 1200,
      height: 660,
      filter: "saturate(0.95) brightness(0.8) contrast(1.1)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const sr = createElement("div", "", {
      id: stars,
      x: 72,
      y: 72,
      width: 1776,
      height: 360,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    sr.style.background =
      "radial-gradient(circle at 10% 20%, rgba(255,255,255,0.85) 0 1px, transparent 2px)," +
      "radial-gradient(circle at 25% 55%, rgba(255,255,255,0.7) 0 1px, transparent 2px)," +
      "radial-gradient(circle at 45% 30%, rgba(255,255,255,0.8) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 60% 70%, rgba(255,255,255,0.7) 0 1px, transparent 2px)," +
      "radial-gradient(circle at 78% 25%, rgba(255,255,255,0.9) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 92% 60%, rgba(255,255,255,0.75) 0 1px, transparent 2px)";
    sr.style.backgroundSize = "520px 260px";
    sr.style.pointerEvents = "none";
    append(root, sr);
    const mkWave = (id, color, track, offset) => {
      const el = createElement("div", "", {
        id,
        x: 72,
        y: 72 + offset,
        width: 1776,
        height: 420,
        start: at,
        duration,
        trackIndex: track,
      });
      el.style.background = `linear-gradient(180deg, ${color} 0%, rgba(0,0,0,0) 80%)`;
      el.style.filter = "blur(28px)";
      el.style.mixBlendMode = "screen";
      el.style.pointerEvents = "none";
      el.style.opacity = "0";
      el.style.transformOrigin = "50% 0%";
      append(root, el);
    };
    mkWave(w1, o.auroraColor1 || "rgba(100, 255, 180, 0.7)", tk + 3, 0);
    mkWave(w2, o.auroraColor2 || "rgba(130, 120, 255, 0.55)", tk + 4, 40);
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 5,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 1.2 });
    tl.to(`#${w1}`, { opacity: 1, duration: 1.2 }, at + 0.3);
    tl.to(`#${w2}`, { opacity: 1, duration: 1.4 }, at + 0.5);
    tl.to(`#${w1}`, { scaleX: 1.15, skewX: 6, duration: 3, yoyo: true, repeat: Math.ceil(duration / 3), ease: "sine.inOut" }, at);
    tl.to(`#${w2}`, { scaleX: 0.88, skewX: -5, duration: 3.4, yoyo: true, repeat: Math.ceil(duration / 3.4), ease: "sine.inOut" }, at);
    tl.to(`#${stars}`, { opacity: 0.5, duration: 1.5, yoyo: true, repeat: Math.ceil(duration / 1.5), ease: "sine.inOut" }, at);
    animateKenBurns(tl, `#${photo}`, { at: at + 0.4, duration: duration - 0.8, fromScale: 1, toScale: 1.04 });
    const ids = [`#${bg}`, `#${photo}`, `#${stars}`, `#${w1}`, `#${w2}`, `#${vig}`];
    if (o.caption) {
      const cp = kitRef.id("au-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1.2,
        duration: duration - 1.6,
        trackIndex: tk + 6,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1.2, y: 14, duration: 0.6 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.fallingLeaves = function (tl, root, o) {
    // Autumn leaves drifting down with slight sway
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("fl-bg", at);
    const photo = kitRef.id("fl-ph", at);
    const layer1 = kitRef.id("fl-L1", at);
    const layer2 = kitRef.id("fl-L2", at);
    const vig = kitRef.id("fl-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "sunset",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(1.1) contrast(1.05) hue-rotate(-8deg)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const colors = o.leafColors || ["#c2552b", "#d98021", "#b83a1a", "#e0a84b"];
    const mkLeaves = (id, size, density, track) => {
      const el = createElement("div", "", {
        id,
        inset: 72,
        start: at,
        duration,
        trackIndex: track,
      });
      const dots = [];
      for (let i = 0; i < density; i++) {
        const x = Math.floor(Math.random() * 100);
        const y = Math.floor(Math.random() * 100);
        const c = colors[i % colors.length];
        dots.push(`radial-gradient(ellipse ${size}px ${Math.floor(size * 0.6)}px at ${x}% ${y}%, ${c} 0%, transparent 70%)`);
      }
      el.style.background = dots.join(",");
      el.style.pointerEvents = "none";
      append(root, el);
    };
    mkLeaves(layer1, 6, 12, tk + 2);
    mkLeaves(layer2, 4, 18, tk + 3);
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 1 });
    animateKenBurns(tl, `#${photo}`, { at: at + 0.3, duration: duration - 0.6, fromScale: 1.02, toScale: 1.08 });
    tl.to(`#${layer1}`, { y: 260, x: 60, rotation: 10, duration, ease: "none" }, at);
    tl.to(`#${layer2}`, { y: 340, x: -40, rotation: -8, duration, ease: "none" }, at);
    const ids = [`#${bg}`, `#${photo}`, `#${layer1}`, `#${layer2}`, `#${vig}`];
    if (o.caption) {
      const cp = kitRef.id("fl-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1.2,
        duration: duration - 1.6,
        trackIndex: tk + 5,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1.2, y: 14, duration: 0.6 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.meteor = function (tl, root, o) {
    // Meteor streak from top-right, impact flash + screen shake
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("mt-bg", at);
    const photo = kitRef.id("mt-ph", at);
    const streak = kitRef.id("mt-sk", at);
    const burst = kitRef.id("mt-br", at);
    const flash = kitRef.id("mt-fl", at);
    const vig = kitRef.id("mt-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "night",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(0.9) brightness(0.7) contrast(1.15)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    // Trajectory: from a start point to impact. Rotate the trail to match this vector exactly,
    // and place the trail's tip (right edge) at the meteor head so the tail extends backward.
    const impactX = o.impactX !== undefined ? o.impactX : 700;
    const impactY = o.impactY !== undefined ? o.impactY : 700;
    const startX = o.startX !== undefined ? o.startX : 1780;
    const startY = o.startY !== undefined ? o.startY : 60;
    const angleDeg = (Math.atan2(impactY - startY, impactX - startX) * 180) / Math.PI;
    const trailLen = o.trailLength || 420;
    const trailH = 14;
    // Wrapper positioned at the meteor HEAD. It's the element that translates from start → impact.
    const sk = createElement("div", "", {
      id: streak,
      x: startX,
      y: startY,
      width: 1,
      height: 1,
      start: at + 0.2,
      duration: 1.4,
      trackIndex: tk + 2,
    });
    sk.style.pointerEvents = "none";
    sk.style.opacity = "0";
    // Inner trail: rotated to match travel angle, positioned so its right edge sits on the head.
    const trail = document.createElement("div");
    trail.style.position = "absolute";
    trail.style.left = `${-trailLen}px`;
    trail.style.top = `${-trailH / 2}px`;
    trail.style.width = `${trailLen}px`;
    trail.style.height = `${trailH}px`;
    trail.style.background =
      "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255, 210, 140, 0.55) 50%, rgba(255, 240, 200, 1) 95%, rgba(255,255,255,1) 100%)";
    trail.style.filter = "blur(2px) drop-shadow(0 0 14px rgba(255,200,120,0.95))";
    trail.style.borderRadius = "50%";
    trail.style.transformOrigin = "100% 50%";
    trail.style.transform = `rotate(${angleDeg}deg)`;
    sk.appendChild(trail);
    // Head: a bright glowing dot sitting at (0,0) of the wrapper (which IS the head position).
    const head = document.createElement("div");
    head.style.position = "absolute";
    head.style.left = "-14px";
    head.style.top = "-14px";
    head.style.width = "28px";
    head.style.height = "28px";
    head.style.borderRadius = "50%";
    head.style.background = "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,210,140,0.9) 50%, rgba(255,160,80,0) 100%)";
    head.style.filter = "blur(1px) drop-shadow(0 0 22px rgba(255,200,120,1))";
    sk.appendChild(head);
    append(root, sk);
    const trig = at + (o.impactAt !== undefined ? o.impactAt : 1.5);
    createRadialBurst(root, {
      id: burst,
      inset: 72,
      color: o.burstColor || "rgba(255, 180, 80, 0.9)",
      inner: 40,
      outer: 700,
      cx: (impactX / 1920) * 100,
      cy: (impactY / 1080) * 100,
      start: trig,
      duration: duration - (trig - at),
      trackIndex: tk + 3,
    });
    const fl = createElement("div", "", {
      id: flash,
      inset: 72,
      start: trig,
      duration: 1,
      trackIndex: tk + 4,
    });
    fl.style.background = "rgba(255, 240, 200, 1)";
    fl.style.mixBlendMode = "screen";
    fl.style.opacity = "0";
    fl.style.pointerEvents = "none";
    append(root, fl);
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 5,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.7 });
    // head travels from start → impact (CSS position anchored at start, GSAP translates the delta)
    tl.to(`#${streak}`, { opacity: 1, duration: 0.1 }, at + 0.2);
    tl.fromTo(`#${streak}`,
      { x: 0, y: 0 },
      { x: impactX - startX, y: impactY - startY, duration: (trig - at) - 0.2, ease: "power2.in" },
      at + 0.2
    );
    tl.to(`#${streak}`, { opacity: 0, duration: 0.1 }, trig);
    // impact
    tl.to(`#${flash}`, { opacity: 1, duration: 0.04 }, trig);
    tl.to(`#${flash}`, { opacity: 0, duration: 0.7, ease: "power2.in" }, trig + 0.06);
    animateBurstExpand(tl, `#${burst}`, { at: trig, scale: 1.1, duration: 0.5 });
    animateScreamShake(tl, `#${photo}`, { at: trig, amplitude: 20, duration: 0.9 });
    animateColorFlash(tl, `#${photo}`, { at: trig, color: "rgba(255, 200, 120, 0.6)" });
    animateZoomPunch(tl, `#${photo}`, { at: trig, scale: 1.08 });
    const ids = [`#${bg}`, `#${photo}`, `#${streak}`, `#${burst}`, `#${flash}`, `#${vig}`];
    if (o.sfx) {
      const fx = kitRef.id("mt-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 260,
        y: 760,
        rotation: -6,
        fontSize: 152,
        color: o.sfxColor || "#ffc56b",
        start: trig,
        duration: duration - (trig - at),
        trackIndex: tk + 6,
      });
      animateBounceIn(tl, `#${fx}`, { at: trig, from: 50, duration: 0.35 });
      animateVibrate(tl, `#${fx}`, { at: trig + 0.4, amplitude: 4, repeat: 14 });
      ids.push(`#${fx}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.eclipse = function (tl, root, o) {
    // Sun/moon slowly covered, world darkens, eerie ring of fire
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("ec-bg", at);
    const photo = kitRef.id("ec-ph", at);
    const sun = kitRef.id("ec-sn", at);
    const moon = kitRef.id("ec-mn", at);
    const dark = kitRef.id("ec-dk", at);
    const grain = kitRef.id("ec-gn", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "night",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(1.1) brightness(1) contrast(1.1)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const cx = o.eclipseX !== undefined ? o.eclipseX : 960;
    const cy = o.eclipseY !== undefined ? o.eclipseY : 320;
    const sn = createElement("div", "", {
      id: sun,
      x: cx - 180,
      y: cy - 180,
      width: 360,
      height: 360,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    sn.style.borderRadius = "50%";
    sn.style.background = "radial-gradient(circle, rgba(255,230,160,1) 0%, rgba(255,170,60,0.6) 55%, rgba(255,90,30,0) 80%)";
    sn.style.filter = "blur(6px)";
    sn.style.pointerEvents = "none";
    append(root, sn);
    const mn = createElement("div", "", {
      id: moon,
      x: cx - 160 - 500,
      y: cy - 160,
      width: 320,
      height: 320,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    mn.style.borderRadius = "50%";
    mn.style.background = "radial-gradient(circle, #0a0a12 0%, #050508 100%)";
    mn.style.boxShadow = "0 0 40px 4px rgba(0,0,0,0.9)";
    mn.style.pointerEvents = "none";
    append(root, mn);
    const dk = createElement("div", "", {
      id: dark,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    dk.style.background = "rgba(0, 0, 15, 0.75)";
    dk.style.opacity = "0";
    dk.style.pointerEvents = "none";
    append(root, dk);
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.4,
      start: at,
      duration,
      trackIndex: tk + 5,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 1 });
    // moon slides over sun
    tl.to(`#${moon}`, { x: (cx - 160) - (cx - 160 - 500), duration: duration * 0.6, ease: "power2.inOut" }, at + 0.4);
    // totality darkens
    tl.to(`#${dark}`, { opacity: 1, duration: duration * 0.5 }, at + 0.6);
    tl.to(`#${photo}`, { filter: "saturate(0.4) brightness(0.4) contrast(1.2)", duration: duration * 0.5 }, at + 0.6);
    // corona flicker during totality
    tl.to(`#${sun}`, { scale: 1.08, duration: 0.6, yoyo: true, repeat: 5, ease: "sine.inOut" }, at + duration * 0.55);
    const ids = [`#${bg}`, `#${photo}`, `#${sun}`, `#${moon}`, `#${dark}`, `#${grain}`];
    if (o.caption) {
      const cp = kitRef.id("ec-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + duration * 0.45,
        duration: duration * 0.5,
        trackIndex: tk + 6,
      });
      animateReveal(tl, `#${cp}`, { at: at + duration * 0.45, y: 14, duration: 0.6 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.pageBurn = function (tl, root, o) {
    // Photo edges curl/char and burn away, revealing the darker backdrop
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("pb-bg", at);
    const photo = kitRef.id("pb-ph", at);
    const char = kitRef.id("pb-ch", at);
    const embers = kitRef.id("pb-em", at);
    const vig = kitRef.id("pb-vg", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "mono",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(1) contrast(1.05) sepia(0.15)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const ch = createElement("div", "", {
      id: char,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    ch.style.background =
      "radial-gradient(circle at 0% 100%, rgba(30,10,5,0.95) 0%, rgba(120,40,10,0.6) 8%, rgba(255,120,40,0.4) 12%, rgba(0,0,0,0) 20%)," +
      "radial-gradient(circle at 100% 0%, rgba(30,10,5,0.95) 0%, rgba(120,40,10,0.6) 6%, rgba(255,120,40,0.4) 10%, rgba(0,0,0,0) 18%)";
    ch.style.mixBlendMode = "normal";
    ch.style.opacity = "0";
    ch.style.pointerEvents = "none";
    append(root, ch);
    const em = createElement("div", "", {
      id: embers,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    em.style.background =
      "radial-gradient(circle at 12% 88%, rgba(255, 220, 120, 1) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 22% 75%, rgba(255, 180, 60, 1) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 82% 18%, rgba(255, 230, 120, 1) 0 2px, transparent 3px)," +
      "radial-gradient(circle at 88% 30%, rgba(255, 210, 100, 1) 0 2px, transparent 3px)";
    em.style.backgroundSize = "320px 320px";
    em.style.mixBlendMode = "screen";
    em.style.pointerEvents = "none";
    em.style.opacity = "0";
    append(root, em);
    createVignette(root, {
      id: vig,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.8 });
    // burn grows from corners
    tl.to(`#${char}`, { opacity: 1, duration: duration * 0.6, ease: "power1.in" }, at + 0.6);
    tl.to(`#${char}`, { scale: 1.35, transformOrigin: "100% 100%", duration: duration * 0.6, ease: "power1.in" }, at + 0.6);
    tl.to(`#${embers}`, { opacity: 1, duration: duration * 0.5 }, at + 0.8);
    tl.fromTo(`#${embers}`, { backgroundPosition: "0 0" }, { backgroundPosition: "0 -320px", duration: duration * 0.9, ease: "none" }, at + 0.4);
    // photo darkens and shrinks at the end
    tl.to(`#${photo}`, { filter: "saturate(0.6) contrast(1.1) sepia(0.5) brightness(0.8)", duration: duration * 0.7 }, at + 0.4);
    tl.to(`#${photo}`, { scale: 0.96, duration: duration * 0.8, ease: "power1.in" }, at + 0.6);
    const ids = [`#${bg}`, `#${photo}`, `#${char}`, `#${embers}`, `#${vig}`];
    if (o.caption) {
      const cp = kitRef.id("pb-cp", at);
      createCaptionBand(root, {
        id: cp,
        text: o.caption,
        x: 200,
        y: 944,
        width: 1520,
        start: at + 1,
        duration: duration - 1.4,
        trackIndex: tk + 5,
      });
      animateReveal(tl, `#${cp}`, { at: at + 1, y: 14, duration: 0.6 });
      ids.push(`#${cp}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  scenes.volcano = function (tl, root, o) {
    // Volcanic eruption: red glow from below, lava sparks shooting up, heavy shake
    const ctx = sceneCtx(o);
    const { at, duration, tk } = ctx;
    const bg = kitRef.id("vc-bg", at);
    const photo = kitRef.id("vc-ph", at);
    const glow = kitRef.id("vc-gw", at);
    const lava = kitRef.id("vc-lv", at);
    const ash = kitRef.id("vc-as", at);
    const grain = kitRef.id("vc-gn", at);
    createGradientBackdrop(root, {
      id: bg,
      variant: o.backdrop || "storm",
      inset: 72,
      start: at,
      duration,
      trackIndex: tk,
    });
    createPhotoPanel(root, {
      id: photo,
      src: o.image,
      x: 360,
      y: 200,
      width: 1200,
      height: 720,
      filter: "saturate(1.2) brightness(0.7) contrast(1.2) hue-rotate(-5deg)",
      start: at,
      duration,
      trackIndex: tk + 1,
    });
    const gw = createElement("div", "", {
      id: glow,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 2,
    });
    gw.style.background = "radial-gradient(ellipse at 50% 100%, rgba(255, 80, 30, 0.85) 0%, rgba(180, 30, 20, 0.45) 30%, rgba(0,0,0,0) 65%)";
    gw.style.mixBlendMode = "screen";
    gw.style.pointerEvents = "none";
    append(root, gw);
    const lv = createElement("div", "", {
      id: lava,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 3,
    });
    lv.style.background =
      "radial-gradient(circle at 20% 95%, rgba(255, 120, 30, 1) 0 3px, transparent 4px)," +
      "radial-gradient(circle at 35% 90%, rgba(255, 200, 80, 1) 0 3px, transparent 4px)," +
      "radial-gradient(circle at 48% 96%, rgba(255, 90, 30, 1) 0 4px, transparent 5px)," +
      "radial-gradient(circle at 62% 92%, rgba(255, 180, 60, 1) 0 3px, transparent 4px)," +
      "radial-gradient(circle at 78% 95%, rgba(255, 100, 30, 1) 0 3px, transparent 4px)," +
      "radial-gradient(circle at 88% 88%, rgba(255, 220, 120, 1) 0 3px, transparent 4px)";
    lv.style.backgroundSize = "400px 500px";
    lv.style.mixBlendMode = "screen";
    lv.style.pointerEvents = "none";
    append(root, lv);
    const as = createElement("div", "", {
      id: ash,
      inset: 72,
      start: at,
      duration,
      trackIndex: tk + 4,
    });
    as.style.background = "radial-gradient(ellipse at 50% 0%, rgba(40, 30, 30, 0.75) 0%, rgba(40,30,30,0) 55%)";
    as.style.mixBlendMode = "multiply";
    as.style.pointerEvents = "none";
    append(root, as);
    createFilmGrain(root, {
      id: grain,
      inset: 72,
      opacity: 0.55,
      start: at,
      duration,
      trackIndex: tk + 5,
    });
    animateBlurIn(tl, `#${photo}`, { at, duration: 0.6 });
    // shake ground
    const steps = Math.floor(duration / 0.1);
    for (let i = 0; i < steps; i++) {
      tl.to(`#${photo}`, {
        x: (Math.random() - 0.5) * 14,
        y: (Math.random() - 0.5) * 10,
        duration: 0.1,
        ease: "none",
      }, at + i * 0.1);
    }
    // glow pulses
    tl.to(`#${glow}`, { opacity: 0.6, duration: 0.8, yoyo: true, repeat: Math.ceil(duration / 0.8), ease: "sine.inOut" }, at);
    // lava spits upward
    tl.fromTo(`#${lava}`, { y: 120, backgroundPosition: "0 0" }, { y: -260, backgroundPosition: "0 -500px", duration: duration * 1.1, ease: "none" }, at);
    // color wash
    tl.to(`#${photo}`, { filter: "saturate(1.35) brightness(0.85) contrast(1.25) hue-rotate(-10deg)", duration: 1, yoyo: true, repeat: Math.ceil(duration / 1), ease: "sine.inOut" }, at + 0.3);
    const ids = [`#${bg}`, `#${photo}`, `#${glow}`, `#${lava}`, `#${ash}`, `#${grain}`];
    if (o.sfx) {
      const fx = kitRef.id("vc-fx", at);
      createSfxBurst(root, {
        id: fx,
        text: o.sfx,
        x: 240,
        y: 300,
        rotation: -5,
        fontSize: 156,
        color: o.sfxColor || "#ff7a30",
        start: at + 0.4,
        duration: duration - 0.7,
        trackIndex: tk + 6,
      });
      animateBounceIn(tl, `#${fx}`, { at: at + 0.4, from: -50, duration: 0.4 });
      animateScreamShake(tl, `#${fx}`, { at: at + 0.9, amplitude: 14, duration: duration - 1.2 });
      ids.push(`#${fx}`);
    }
    withLabel(tl, root, ctx, ids);
    withExit(tl, ids, at, duration);
  };

  window.storyMotionKit = {
    ensureStyles,
    createSurfacePanel,
    createKicker,
    createHeadline,
    createBodyCopy,
    createBadgeRow,
    createQuoteCard,
    createSceneTag,
    createLowerThird,
    createCaptionBand,
    createAmbientOrb,
    createHalftoneOverlay,
    createRainLines,
    createSpeedLines,
    createInkSlash,
    createFilmGrain,
    createVignette,
    createScanlines,
    createGridPaper,
    createRadialBurst,
    createGradientBackdrop,
    createFocusRing,
    createStampBadge,
    createSfxBurst,
    createNarrationBox,
    createChapterMark,
    createScenePlate,
    createPhotoPanel,
    createSpeechBubble,
    createThoughtBubble,
    createActCard,
    createSplitPanel,
    createLabelChip,
    createCaptionBubble,
    createCountdown,
    createTicker,
    createComicPanel,
    createTypewriter,
    createTagRibbon,
    createSepiaOverlay,
    scenes,
    animateReveal,
    animateCascade,
    animateDrift,
    animatePulse,
    animateFlicker,
    animateShake,
    animateScreamShake,
    animateVibrate,
    animateHeartbeat,
    animateZoomPunch,
    animateColorFlash,
    animateSpin,
    animateSlideIn,
    animateSlideOut,
    animateKenBurns,
    animateWipeReveal,
    animateFadeOut,
    animateTypewriter,
    animateGlitch,
    animateFloat,
    animateSwing,
    animateBounceIn,
    animateBlurIn,
    animateTickerScroll,
    animateBurstExpand,
  };
})();