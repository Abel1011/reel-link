export interface StylePreset {
  presetName: string;
  genre: "Comic" | "Anime" | "Painterly" | "3D" | "Retro" | "Minimal";
  description: string;
  visualStyle: string;
  artisticMedium: string;
  colorPalette: string;
  swatches: string[];
  lighting: string;
  mood: string;
  previewPrompt: string;
  previewImagePath?: string;
}

export const stylePresets: StylePreset[] = [
  // Comic
  {
    presetName: "Western Comic",
    genre: "Comic",
    description:
      "Bold inked lines, halftone shading and punchy primary colors. The vibe of a Sunday superhero spread.",
    visualStyle: "Comic book, bold ink lines with halftone shading",
    artisticMedium: "Ink with flat digital color and halftone dots",
    colorPalette: "Punchy primaries — red, yellow, blue, jet black",
    swatches: ["#e63946", "#ffd60a", "#1d4ed8", "#0b0b0b"],
    lighting: "High-contrast, comic-panel lighting",
    mood: "Heroic, punchy, action-packed",
    previewPrompt:
      "A single illustrated comic panel of a cheerful young woman aviator in a bright red leather jacket, round flight goggles and a white scarf, leaning out of the open cockpit of a yellow propeller biplane amid fluffy cotton-candy clouds, giving a confident thumbs-up toward the viewer. Bold black ink outlines, halftone dot shading, flat punchy primary colors (red jacket, yellow plane, blue sky, white clouds), vintage newspaper comic strip style. Original everyday hero, NO capes, NO masks, NO cowls, NO hoods, NO superheroes, NO vigilantes, no logos, no text, no speech bubbles.",
  },
  {
    presetName: "Graphic Noir",
    genre: "Comic",
    description:
      "High-contrast black and white with a single splash of crimson. Hard-boiled detective serial energy.",
    visualStyle: "Graphic noir, heavy shadows, stark silhouettes",
    artisticMedium: "Inked black and white with spot color",
    colorPalette: "Deep black, bone white, single crimson accent",
    swatches: ["#0a0a0a", "#f5f0e6", "#a01a1a", "#4a4a4a"],
    lighting: "Hard single-source, long shadows",
    mood: "Moody, mysterious, cinematic",
    previewPrompt:
      "Graphic noir illustration of a silhouetted detective under a streetlamp in the rain, stark black and white, single crimson umbrella accent, heavy ink shadows, no text",
  },

  // Anime / Manga
  {
    presetName: "Shonen Anime",
    genre: "Anime",
    description:
      "Dynamic anime frames with speed lines, expressive eyes and saturated cel-shading.",
    visualStyle: "Shonen anime, cel-shaded, dynamic action poses",
    artisticMedium: "2D cel animation with crisp line art",
    colorPalette: "Saturated sky blue, fire orange, white highlights",
    swatches: ["#2ea3ff", "#ff7a29", "#ffffff", "#0c1c33"],
    lighting: "Bright daylight with rim lighting",
    mood: "Energetic, heroic, youthful",
    previewPrompt:
      "Cel-shaded anime key visual of a young apprentice archer with short tousled dark hair, a green tunic and a leather quiver, loosing an arrow of glowing light toward a vast sunset sky. Dynamic wind-swept pose, speed lines, sun flare, saturated sky blue and fire orange colors, crisp line art. Original character, no existing franchise, no logos, no text.",
  },
  {
    presetName: "Pastoral Anime",
    genre: "Anime",
    description:
      "Soft hand-painted anime landscapes: wind-blown grass, fluffy clouds and gentle pastels.",
    visualStyle: "Hand-drawn anime with painterly backgrounds",
    artisticMedium: "Hand-painted anime with soft gouache textures",
    colorPalette: "Grass green, cream sky, terracotta roofs",
    swatches: ["#7ab87a", "#f4e8c7", "#d67c5a", "#4a7aa8"],
    lighting: "Warm afternoon sun, soft rim light",
    mood: "Whimsical, peaceful, nostalgic",
    previewPrompt:
      "Painterly anime landscape of a small cottage on a grassy hilltop, wind-blown grass, fluffy clouds, warm afternoon sun, hand-painted feel, no text",
  },
  {
    presetName: "Black & White Manga",
    genre: "Anime",
    description:
      "Screentone shading, expressive linework and panels straight from a tankobon.",
    visualStyle: "Manga, black and white, screentone shading",
    artisticMedium: "Ink pen with screentone patterns",
    colorPalette: "Black ink, white paper, grey screentones",
    swatches: ["#111111", "#f8f6ef", "#8a8a8a", "#cfcfcf"],
    lighting: "Flat with dramatic spot shadows",
    mood: "Intense, focused, dramatic",
    previewPrompt:
      "Black and white manga panel, a young swordsman looking over their shoulder, screentone shading, expressive ink lines, dramatic shadows, no text, no speech bubbles",
  },

  // Painterly
  {
    presetName: "Sunlit Watercolor",
    genre: "Painterly",
    description:
      "Gentle watercolor washes, paper grain and honey-warm light.",
    visualStyle: "Soft pastoral watercolor",
    artisticMedium: "Traditional watercolor on cold-press paper",
    colorPalette: "Warm yellows, soft greens, sky blue",
    swatches: ["#f5d76e", "#a8d8a8", "#87ceeb", "#f5f0e1"],
    lighting: "Diffused golden hour",
    mood: "Gentle, nostalgic, airy",
    previewPrompt:
      "Soft watercolor illustration of a meadow with wildflowers under warm golden hour light, visible paper texture, loose brush strokes, no text",
  },
  {
    presetName: "Storybook Charm",
    genre: "Painterly",
    description:
      "Classic children's book illustration — ink outlines and muted gouache.",
    visualStyle: "Classic storybook illustration",
    artisticMedium: "Ink outlines with gouache",
    colorPalette: "Earthy tones, muted reds, cream",
    swatches: ["#8b6f47", "#c75050", "#f5f0e1", "#3a5a40"],
    lighting: "Warm interior lamplight",
    mood: "Cozy, whimsical, tender",
    previewPrompt:
      "Children's storybook illustration of a fox in a knit scarf reading a book by a lamp, ink outlines, muted gouache, warm cozy lamplight, no text",
  },
  {
    presetName: "Impressionist Oil",
    genre: "Painterly",
    description:
      "Visible brush strokes, plein-air palette and soft dappled light.",
    visualStyle: "Impressionist oil painting",
    artisticMedium: "Thick oil on canvas, palette knife texture",
    colorPalette: "Lavender, sage, ochre, cobalt",
    swatches: ["#b8a1d9", "#9db887", "#d4a017", "#2a528a"],
    lighting: "Dappled sunlight through foliage",
    mood: "Romantic, contemplative",
    previewPrompt:
      "Impressionist oil painting of a woman in a garden under dappled sunlight, visible brush strokes, palette knife texture, plein-air style, no text",
  },

  // 3D
  {
    presetName: "Stylized 3D Animation",
    genre: "3D",
    description:
      "Glossy 3D render with rounded shapes and soft animated-feature lighting.",
    visualStyle: "Modern 3D animation, rounded stylized shapes",
    artisticMedium: "3D CG render with subsurface scattering",
    colorPalette: "Creamy pastels, warm golden highlights",
    swatches: ["#ffd4a3", "#ff9a76", "#a3d5ff", "#7d5a3e"],
    lighting: "Soft key light with fill, cinematic bokeh",
    mood: "Heartwarming, playful, polished",
    previewPrompt:
      "Stylized 3D animation render of a curious toy robot in a sunlit bedroom, rounded stylized shapes, soft cinematic lighting, warm pastel tones, shallow depth of field, no text",
  },
  {
    presetName: "Claymation Diorama",
    genre: "3D",
    description:
      "Hand-made plasticine look with fingerprints, seams and stop-motion charm.",
    visualStyle: "Claymation stop-motion diorama",
    artisticMedium: "Plasticine clay with visible fingerprints",
    colorPalette: "Matte clay pastels, earthy browns",
    swatches: ["#d8a48f", "#8c6a5d", "#bfb07a", "#6b8e7f"],
    lighting: "Soft studio lighting, visible seams",
    mood: "Quirky, tactile, handmade",
    previewPrompt:
      "Claymation stop-motion scene of a tiny plasticine village, visible fingerprints and seams, soft studio lighting, matte clay pastels, diorama feel, no text",
  },

  // Retro
  {
    presetName: "Neon Cyberpunk",
    genre: "Retro",
    description:
      "Hot pink and cyan neon on rain-slicked asphalt. Moody retro-future city vibes.",
    visualStyle: "Futuristic cyberpunk cityscape",
    artisticMedium: "3D render with volumetric neon lighting",
    colorPalette: "Hot pink, electric cyan, dark chrome",
    swatches: ["#ff1493", "#00e5ff", "#2c2c2c", "#7b2cbf"],
    lighting: "Neon glow, wet reflections, volumetric fog",
    mood: "Energetic, edgy, futuristic",
    previewPrompt:
      "Cyberpunk alley at night, hot pink and cyan neon signs reflecting on wet asphalt, volumetric fog, no text or readable signs",
  },
  {
    presetName: "16-bit Pixel Art",
    genre: "Retro",
    description:
      "Chunky pixels, limited palette and retro console charm.",
    visualStyle: "16-bit pixel art",
    artisticMedium: "Pixel art, 64x64 sprite aesthetic",
    colorPalette: "Limited 16-color palette, sunset hues",
    swatches: ["#2a1b3d", "#c75b7a", "#f2a65a", "#f8e9a1"],
    lighting: "Flat shaded with dithered gradients",
    mood: "Nostalgic, adventurous",
    previewPrompt:
      "16-bit pixel art landscape of a hero on a cliff at sunset, limited palette, dithered sky, retro JRPG style, no text",
  },
  {
    presetName: "Ukiyo-e Woodblock",
    genre: "Retro",
    description:
      "Edo-period woodblock prints — flat color, flowing lines and crashing wave motifs.",
    visualStyle: "Japanese ukiyo-e woodblock print",
    artisticMedium: "Woodblock print with visible paper grain",
    colorPalette: "Prussian blue, vermilion, ivory, ink black",
    swatches: ["#1d3557", "#e63946", "#f1faee", "#0a0a0a"],
    lighting: "Flat, no shadows",
    mood: "Elegant, timeless, graceful",
    previewPrompt:
      "Ukiyo-e woodblock print of a crane flying over crashing waves, flat colors, Prussian blue and vermilion, visible paper grain, traditional Edo style, no text",
  },

  // Minimal
  {
    presetName: "Arctic Minimal",
    genre: "Minimal",
    description:
      "Clean vectors, generous white space and a cool, focused palette.",
    visualStyle: "Clean geometric vector illustration",
    artisticMedium: "Flat vector, minimal shapes",
    colorPalette: "Ice blue, white, slate gray",
    swatches: ["#a8d8ea", "#ffffff", "#708090", "#2c3e50"],
    lighting: "Cool ambient, no shadows",
    mood: "Calm, focused, modern",
    previewPrompt:
      "Minimal flat vector illustration of a lone figure skiing down a snowy slope, ice blue and slate gray, generous negative space, no shadows, no text",
  },
  {
    presetName: "Risograph Poster",
    genre: "Minimal",
    description:
      "Two-color riso print with grainy overlays and duotone charm.",
    visualStyle: "Risograph print poster",
    artisticMedium: "Two-color riso with grainy overlay",
    colorPalette: "Fluoro pink, federal blue, cream paper",
    swatches: ["#ff4d8d", "#1c3b6e", "#f5f0e1", "#e8b4bc"],
    lighting: "Flat with grain texture",
    mood: "Indie, graphic, textured",
    previewPrompt:
      "Risograph-style poster of a mountain and bicycle, two-color fluoro pink and federal blue, visible grain overlay, cream paper background, no text",
  },
];
