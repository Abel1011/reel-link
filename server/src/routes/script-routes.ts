import { Hono } from "hono";
import { Type, type Schema } from "@google/genai";
import { getProject } from "../repositories/project-repository.js";
import { getCharactersByProjectId } from "../repositories/character-repository.js";
import { getLocationsByProjectId } from "../repositories/location-repository.js";
import { getStyleByProjectId } from "../repositories/style-repository.js";
import { saveScript, updateScriptSection } from "../repositories/script-repository.js";
import { textImageProvider } from "../services/providers.js";
import { runWithDebug, withStage } from "../services/debug-logger.js";
import { buildSameLanguageInstruction, inferProjectStoryLanguage } from "../services/story-language.js";

const scriptRoutes = new Hono();

const LENGTH_TO_SECTIONS: Record<string, { count: number; label: string }> = {
  short: { count: 3, label: "3 sections (about 30 seconds total)" },
  standard: { count: 5, label: "5 sections (about 60 seconds total)" },
  long: { count: 7, label: "7 sections (about 90 seconds total)" },
};

type PlannedMusicAsset = {
  id: string;
  prompt: string;
  minDurationSeconds: number;
  coversSectionOrders: number[];
  narrativeUse: string;
};

type SceneBlockPlan = {
  sectionOrder: number;
  title: string;
  locationId: string;
  objective: string;
  directorNotes: string;
  visualSteps: string[];
  speakingCharacterIds: string[];
  musicAssetId: string;
  soundDesign: string;
  effectNotes: string[];
  narratorText: string;
  dialogueLines: Array<{
    characterId: string;
    lineText: string;
    lineOrder: number;
  }>;
};

type ScriptPlan = {
  musicAssets: PlannedMusicAsset[];
  sceneBlocks: SceneBlockPlan[];
};

type SceneSectionOutput = {
  soundEffectCue: string;
  imageLayers: Array<{
    layerType: "background" | "character" | "overlay";
    layerOrder: number;
    description: string;
    positionX: number;
    positionY: number;
    scale: number;
    characterId?: string | null;
  }>;
};

const musicAssetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    prompt: { type: Type.STRING },
    minDurationSeconds: { type: Type.INTEGER, minimum: 30 },
    coversSectionOrders: { type: Type.ARRAY, items: { type: Type.INTEGER }, minItems: "1" },
    narrativeUse: { type: Type.STRING },
  },
  required: ["id", "prompt", "minDurationSeconds", "coversSectionOrders", "narrativeUse"],
  propertyOrdering: ["id", "prompt", "minDurationSeconds", "coversSectionOrders", "narrativeUse"],
};

const dialogueLineSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    characterId: { type: Type.STRING },
    lineText: { type: Type.STRING },
    lineOrder: { type: Type.INTEGER, minimum: 0 },
  },
  required: ["characterId", "lineText", "lineOrder"],
  propertyOrdering: ["characterId", "lineText", "lineOrder"],
};

const sceneBlockSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sectionOrder: { type: Type.INTEGER, minimum: 0 },
    title: { type: Type.STRING },
    locationId: { type: Type.STRING },
    objective: { type: Type.STRING },
    directorNotes: { type: Type.STRING },
    visualSteps: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: "2" },
    speakingCharacterIds: { type: Type.ARRAY, items: { type: Type.STRING } },
    musicAssetId: { type: Type.STRING },
    soundDesign: { type: Type.STRING },
    effectNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
    narratorText: { type: Type.STRING },
    dialogueLines: { type: Type.ARRAY, items: dialogueLineSchema },
  },
  required: [
    "sectionOrder",
    "title",
    "locationId",
    "objective",
    "directorNotes",
    "visualSteps",
    "speakingCharacterIds",
    "musicAssetId",
    "soundDesign",
    "effectNotes",
    "narratorText",
    "dialogueLines",
  ],
  propertyOrdering: [
    "sectionOrder",
    "title",
    "locationId",
    "objective",
    "directorNotes",
    "visualSteps",
    "speakingCharacterIds",
    "musicAssetId",
    "soundDesign",
    "effectNotes",
    "narratorText",
    "dialogueLines",
  ],
};

const scriptPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    musicAssets: { type: Type.ARRAY, items: musicAssetSchema, minItems: "1" },
    sceneBlocks: { type: Type.ARRAY, items: sceneBlockSchema, minItems: "1" },
  },
  required: ["musicAssets", "sceneBlocks"],
  propertyOrdering: ["musicAssets", "sceneBlocks"],
};

const imageLayerSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    layerType: {
      type: Type.STRING,
      format: "enum",
      enum: ["background", "character", "overlay"],
    },
    layerOrder: { type: Type.INTEGER, minimum: 0 },
    description: { type: Type.STRING },
    positionX: { type: Type.NUMBER, minimum: 0, maximum: 1 },
    positionY: { type: Type.NUMBER, minimum: 0, maximum: 1 },
    scale: { type: Type.NUMBER, minimum: 0.1, maximum: 2 },
    characterId: { type: Type.STRING, nullable: true },
  },
  required: ["layerType", "layerOrder", "description", "positionX", "positionY", "scale", "characterId"],
  propertyOrdering: ["layerType", "layerOrder", "description", "positionX", "positionY", "scale", "characterId"],
};

const sceneSectionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    soundEffectCue: { type: Type.STRING },
    imageLayers: { type: Type.ARRAY, items: imageLayerSchema, minItems: "1" },
  },
  required: ["soundEffectCue", "imageLayers"],
  propertyOrdering: ["soundEffectCue", "imageLayers"],
};

scriptRoutes.post("/:id/generate-script", async (c) => {
  const projectId = c.req.param("id");

  const project = getProject(projectId);
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  const characters = getCharactersByProjectId(projectId);
  const locations = getLocationsByProjectId(projectId);
  const style = getStyleByProjectId(projectId);

  if (characters.length === 0 || locations.length === 0 || !style) {
    return c.json(
      { error: "At least 1 character, 1 location, and a style config are required" },
      400
    );
  }

  const brief = project.brief;
  if (!brief?.premise || brief.premise.trim().length < 10) {
    return c.json(
      { error: "A story premise (at least 10 characters) is required" },
      400
    );
  }

  const characterList = characters
    .map((ch) => `- ID: "${ch.id}", Name: "${ch.name}", Description: "${ch.description}"`)
    .join("\n");

  const locationList = locations
    .map((loc) => `- ID: "${loc.id}", Name: "${loc.name}", Description: "${loc.description}"`)
    .join("\n");

  const lengthPlan =
    LENGTH_TO_SECTIONS[brief.lengthPreset ?? "standard"] ?? LENGTH_TO_SECTIONS.standard;
  const lengthHint = lengthPlan.label;
  const sectionCount = lengthPlan.count;
  const storyLanguage = inferProjectStoryLanguage(project);
  const plannerLanguageRule = buildSameLanguageInstruction(
    storyLanguage,
    "all natural-language story fields, including title, objective, directorNotes, visualSteps, soundDesign, effectNotes, narratorText, and dialogueLines.lineText",
  );
  const sceneLanguageRule = buildSameLanguageInstruction(
    storyLanguage,
    "soundEffectCue and imageLayers.description",
  );
  const toneHint = brief.tone ? `Tone: ${brief.tone}.` : "";
  const narratorHint =
    brief.narratorEnabled === false
      ? "Do NOT include narrator text; rely on dialogue only (set narratorText to empty string)."
      : "Include narrator descriptions that move the plot forward and carry clear emotional intention through word choice and rhythm.";

  const plannerPrompt = `Plan a short animated-video story as a multi-agent director pipeline.

PREMISE: ${brief.premise}
${toneHint}
LENGTH: ${lengthHint}
Need EXACTLY ${sectionCount} scene blocks.

Visual style: ${style.visualStyle}, Medium: ${style.artisticMedium}, Palette: ${style.colorPalette}, Lighting: ${style.lighting}, Mood: ${style.mood}.

Characters:
${characterList}

Locations:
${locationList}

${narratorHint}
Language rule: ${plannerLanguageRule}
Dialogue rule: When any character speaks during a beat, keep that speaker explicitly represented in the visual plan so downstream shots can keep a speech bubble on-screen.
Environment rule: If weather or another environmental condition defines the sequence, keep that state active across every affected section until the story clearly shows it ending.
Music rule: Every music asset must be instrumental underscore only. No lyrics, no sung vocals, no choir, no chant, and no spoken word in the music prompt.
Create reusable music assets that each last at least 30 seconds and can cover one or more scene blocks.`;

  const plannerSystem = `You are the top-level writing and directing agent for an animated short. Return valid JSON only.

Return an object with:
- musicAssets: array of reusable music assets. Each asset needs id, prompt, minDurationSeconds (minimum 30), coversSectionOrders, and narrativeUse.
- sceneBlocks: array of EXACTLY ${sectionCount} scene blocks ordered from 0 to ${sectionCount - 1}. Each scene block needs:
  - sectionOrder
  - title
  - locationId (must be one of the provided location IDs)
  - objective
  - directorNotes (what the camera/story should emphasize)
  - visualSteps (2-5 short beat-by-beat steps describing what is shown)
  - speakingCharacterIds (use only provided character IDs)
  - musicAssetId (must refer to one of the returned music asset ids)
  - soundDesign
  - effectNotes (timed or beat-based motion/effect intentions)
  - narratorText (the final spoken narration for that section; empty string if narration is disabled)
  - dialogueLines: array of final spoken lines with { characterId, lineText, lineOrder }

- ${plannerLanguageRule}
  - Every musicAssets.prompt must explicitly describe an instrumental-only track with no lyrics, no vocals, no choir, and no spoken words.
- The planner is the ONLY agent allowed to define or change narratorText and dialogueLines.lineText.
- Downstream agents will receive these exact texts as immutable source material and are not allowed to rewrite them.
- dialogueLines must match speakingCharacterIds and lineOrder must start at 0 and increase without gaps.
- If a character speaks in a beat, that speaker must remain visually represented in that beat description.
- If an environmental state like storm, rain, snow, dust, fog, or fire is active, keep it active in consecutive scene blocks until there is a clear story change.

Keep the plan cinematic, specific, and executable by downstream scene agents.`;

  const sceneSystemPrompt = `You are a scene-layout agent inside a multi-agent animated-film pipeline. Return valid JSON only.

Return one scene object with:
- soundEffectCue: string
- imageLayers: array of { layerType, layerOrder, description, positionX, positionY, scale, characterId }

Rules:
- Use only the provided character and location IDs.
- narratorText and dialogueLines are already finalized by the superior planner. You must not rewrite, paraphrase, shorten, expand, or reorder them.
- Your job is to translate the approved text into layout data only: soundEffectCue plus imageLayers.
- Provide exactly one background layer at layerOrder 0.
- Provide one character layer for each speaking character.
- Use overlay layers only when needed for story emphasis.
- ${sceneLanguageRule}
- Whenever dialogue is present, the speaking character must stay visually represented in the section imagery so downstream shots can keep a speech bubble on-screen while the line is heard.
- If an environmental condition defines the section or surrounding sequence, keep it active in descriptions and soundEffectCue until the story clearly ends it.
- The image layer descriptions must be rich enough to guide whether the downstream video compositor should reuse or reframe existing assets.`;

  const { plan, scenes } = await runWithDebug({ projectId, stage: "script" }, async () => {
    const generatedPlan = await withStage("script.planner", () =>
      textImageProvider.generateStructured<ScriptPlan>(plannerPrompt, scriptPlanSchema, {
        systemPrompt: plannerSystem,
        model: "pro",
      }),
    );

    const orderedBlocks = [...generatedPlan.sceneBlocks].sort((a, b) => a.sectionOrder - b.sectionOrder);
    if (orderedBlocks.length !== sectionCount || orderedBlocks.some((block, index) => block.sectionOrder !== index)) {
      throw new Error("Planner returned an invalid scene order");
    }

    const musicAssetsById = new Map(generatedPlan.musicAssets.map((asset) => [asset.id, asset] as const));
    const sceneEntries = await Promise.all(
      orderedBlocks.map(async (block) => {
        const musicAsset = musicAssetsById.get(block.musicAssetId) ?? generatedPlan.musicAssets[0];
        const scenePrompt = `Design section ${block.sectionOrder + 1} of ${sectionCount}.

PREMISE: ${brief.premise}
${toneHint}
${narratorHint}

Visual style: ${style.visualStyle}, Medium: ${style.artisticMedium}, Palette: ${style.colorPalette}, Lighting: ${style.lighting}, Mood: ${style.mood}.

Characters:
${characterList}

Locations:
${locationList}

Scene block:
${JSON.stringify(block, null, 2)}

Assigned shared music asset:
${JSON.stringify(musicAsset, null, 2)}

Language rule: ${sceneLanguageRule}

Approved section text from the superior planner. These fields are immutable:
${JSON.stringify(
  {
    narratorText: block.narratorText,
    dialogueLines: block.dialogueLines,
    speakingCharacterIds: block.speakingCharacterIds,
    soundDesign: block.soundDesign,
    effectNotes: block.effectNotes,
  },
  null,
  2,
)}

Create the layout data now.`;

        const scene = await withStage(`script.scene.${block.sectionOrder}`, () =>
          textImageProvider.generateStructured<SceneSectionOutput>(scenePrompt, sceneSectionSchema, {
            systemPrompt: sceneSystemPrompt,
            model: "pro",
          }),
        );
        return [block.sectionOrder, scene] as const;
      }),
    );

    return {
      plan: {
        musicAssets: generatedPlan.musicAssets,
        sceneBlocks: orderedBlocks,
      },
      scenes: new Map(sceneEntries),
    };
  }).catch((err) => {
    console.error(`[script] planner failure for ${projectId}: ${(err as Error).message}`);
    throw err;
  });

  if (!plan.musicAssets.length || !plan.sceneBlocks.length) {
    return c.json({ error: "AI returned an unexpected response" }, 500);
  }

  // Build lookup for resolving layer images from existing assets
  const locationImageById = new Map(
    locations.map((l) => [l.id, l.imagePath] as const)
  );
  const characterPortraitById = new Map(
    characters.map((ch) => [ch.id, ch.portraitPath] as const)
  );
  const musicAssetsById = new Map(plan.musicAssets.map((asset) => [asset.id, asset] as const));

  const sectionInputs = plan.sceneBlocks.map((block) => {
    const scene = scenes.get(block.sectionOrder);
    const locId: string | undefined = block.locationId;
    const bgPath = locId ? locationImageById.get(locId) : undefined;
    const sharedMusic = musicAssetsById.get(block.musicAssetId) ?? plan.musicAssets[0];
    const imageLayers = scene?.imageLayers ?? [];

    return {
      sectionOrder: block.sectionOrder,
      locationId: locId,
      narratorText: block.narratorText,
      musicCue: sharedMusic?.prompt ?? "",
      soundEffectCue: scene?.soundEffectCue ?? block.soundDesign,
      dialogueLines: block.dialogueLines.map((d) => ({
        characterId: d.characterId,
        lineText: d.lineText,
        lineOrder: d.lineOrder ?? 0,
      })),
      imageLayers: imageLayers.map((l) => {
        const layerType = l.layerType ?? "background";
        let imagePath: string | undefined;
        if (layerType === "background") {
          imagePath = bgPath ?? undefined;
        } else if (layerType === "character" && l.characterId) {
          imagePath = characterPortraitById.get(l.characterId) ?? undefined;
        }
        return {
          layerType,
          layerOrder: l.layerOrder ?? 0,
          description: l.description,
          positionX: l.positionX ?? 0,
          positionY: l.positionY ?? 0,
          scale: l.scale ?? 1.0,
          imagePath,
        };
      }),
    };
  });

  const script = saveScript(projectId, sectionInputs);
  void script;
  return c.json(getProject(projectId));
});

scriptRoutes.put("/:id/script/sections/:sectionId", async (c) => {
  const sectionId = c.req.param("sectionId");
  const body = await c.req.json();
  const updated = updateScriptSection(sectionId, body);
  return c.json(updated);
});

export { scriptRoutes };
