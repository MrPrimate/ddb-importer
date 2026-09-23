/**
 * Shipped region display profiles, the pattern table the display shader understands and
 * the field rules both editors follow. Pure data: `src/config` is a leaf package, which is
 * why the enricher tree, the settings and the behavior data model can all import it.
 */

/** Fired on every client after the profile store changes (raised by the setting's onChange). */
export const REGION_DISPLAY_PROFILES_CHANGED = "ddb-importer.regionDisplayProfilesChanged";

/** Where a region's display choice lives on its document. */
export const REGION_DISPLAY_FLAG_PATH = "flags.ddbimporter.display";

/** The activity behavior type that carries a region display choice. */
export const REGION_DISPLAY_BEHAVIOR_TYPE = "ddbDisplay";

/** The colour previews use when neither the flag, the profile nor the host names one. */
export const REGION_DISPLAY_FALLBACK_COLOR = "#ff6400";

/** Logger prefix for the region display hooks. */
export const REGION_DISPLAY_LOG = "RegionDisplay |";

/** Localization root for the display behavior, its fields and the pattern names. */
export const REGION_DISPLAY_I18N = "ddb-importer.behaviors.display";

export const REGION_DISPLAY_PATTERNS: readonly TRegionDisplayPattern[] = [
  "hatch",
  "solid",
  "crosshatch",
  "dots",
  "edge",
  "hollowDots",
  "diamonds",
  "crosses",
  "checkerboard",
  "waves",
  "chevrons",
];

/** The `pattern` uniform value for each fill pattern; the shader branches on these. */
export const REGION_DISPLAY_PATTERN_IDS: Record<TRegionDisplayPattern, number> = {
  hatch: 0,
  solid: 1,
  crosshatch: 2,
  dots: 3,
  edge: 4,
  hollowDots: 5,
  diamonds: 6,
  crosses: 7,
  checkerboard: 8,
  waves: 9,
  chevrons: 10,
};

/** Bounds for the numeric profile fields, shared by the store, the builder and the behavior schema. */
export const REGION_DISPLAY_LIMITS = {
  opacity: { min: 0, max: 1, step: 0.05 },
  gapOpacity: { min: 0, max: 1, step: 0.05 },
  borderOpacity: { min: 0, max: 1, step: 0.05 },
  spacing: { min: 0.05, max: 4, step: 0.05 },
  thickness: { min: 0.02, max: 1, step: 0.01 },
  edgeWidth: { min: 0.05, max: 2, step: 0.05 },
  dashLength: { min: 0.05, max: 4, step: 0.05 },
  angle: { min: 0, max: 180, step: 5 },
  crossRotation: { min: 0, max: 90, step: 5 },
  crossLength: { min: 1, max: 3, step: 0.1 },
  waveAmplitude: { min: 0, max: 1, step: 0.05 },
  waveLength: { min: 0.25, max: 4, step: 0.05 },
  offset: { min: 0, max: 1, step: 0.05 },
  borderWidth: { min: 0.05, max: 2, step: 0.05 },
} as const satisfies Record<TRegionDisplayNumericKey, { min: number; max: number; step: number }>;

/**
 * The values a profile takes for anything it does not set: Foundry's own look. Core's
 * HighlightRegionShader draws a 45 degree hatch at alpha 0.5, half ink and half gap, with
 * the gap at a third of the fill; its period is 4 * sqrt(2) * 2 px at the default UI scale,
 * roughly a tenth of a 100 px grid square. The remaining fields are neutral: no dashes,
 * no border, upright crosses and no offset.
 */
export const REGION_DISPLAY_DEFAULTS: Readonly<Omit<IRegionDisplayProfile, "id" | "name" | "builtin">> = {
  pattern: "hatch",
  opacity: 0.5,
  gapOpacity: 0.3333,
  borderOpacity: null,
  spacing: 0.11,
  thickness: 0.5,
  edgeWidth: 0.25,
  dashed: false,
  dashLength: 0.25,
  angle: 45,
  crossRotation: 0,
  crossLength: 1,
  waveAmplitude: 0.25,
  waveLength: 1,
  offset: 0,
  border: false,
  borderWidth: 0.1,
  color: null,
};

/** The name a profile takes when none is given. */
export const REGION_DISPLAY_DEFAULT_NAME = "New Profile";

/** Patterns drawn as lines, which take an angle and can be dashed. */
const LINE_PATTERNS: readonly TRegionDisplayPattern[] = ["hatch", "crosshatch", "waves", "chevrons"];

function patternsExcept(...excluded: TRegionDisplayPattern[]): readonly TRegionDisplayPattern[] {
  return REGION_DISPLAY_PATTERNS.filter((pattern) => !excluded.includes(pattern));
}

/**
 * The numeric fields in the order the editors show them, with the patterns and toggles each
 * one needs. The profile editor and the per-region editor both read this, so a field is shown
 * (and hinted) the same way in each.
 */
export const REGION_DISPLAY_FIELDS: readonly IRegionDisplayField[] = [
  { key: "opacity" },
  { key: "gapOpacity", patterns: patternsExcept("solid", "edge") },
  { key: "borderOpacity", requires: "band" },
  { key: "spacing", patterns: patternsExcept("solid", "edge"), patternHints: ["checkerboard", "waves", "chevrons"] },
  { key: "thickness", patterns: patternsExcept("solid", "edge", "checkerboard"), patternHints: ["crosses"] },
  { key: "edgeWidth", patterns: ["edge"] },
  { key: "dashLength", patterns: LINE_PATTERNS, requires: "dashed" },
  { key: "angle", patterns: LINE_PATTERNS },
  { key: "crossRotation", patterns: ["crosses"] },
  { key: "crossLength", patterns: ["crosses"] },
  { key: "waveAmplitude", patterns: ["waves"] },
  { key: "waveLength", patterns: ["waves"] },
  { key: "offset", patterns: patternsExcept("solid", "edge") },
  { key: "borderWidth", patterns: patternsExcept("edge"), requires: "border" },
];

/** The patterns each on/off choice applies to: dashes break lines, and the edge band is always bordered. */
export const REGION_DISPLAY_TOGGLE_PATTERNS: Readonly<Record<"dashed" | "border", readonly TRegionDisplayPattern[]>> = {
  dashed: LINE_PATTERNS,
  border: patternsExcept("edge"),
};

export const BUILTIN_REGION_DISPLAY_PROFILES: readonly IRegionDisplayProfile[] = [
  {
    id: "aura",
    name: "Aura",
    pattern: "hatch",
    opacity: 0.3,
    gapOpacity: 0,
    borderOpacity: null,
    spacing: 0.1,
    thickness: 0.15,
    edgeWidth: 0.25,
    dashed: false,
    dashLength: 0.25,
    angle: 135,
    crossRotation: 0,
    crossLength: 1,
    waveAmplitude: 0.25,
    waveLength: 1,
    offset: 0,
    border: true,
    borderWidth: 0.1,
    color: null,
    builtin: true,
  },
  {
    id: "damage",
    name: "Ongoing Damage",
    pattern: "crosshatch",
    opacity: 0.5,
    gapOpacity: 0,
    borderOpacity: null,
    spacing: 0.25,
    thickness: 0.2,
    edgeWidth: 0.25,
    dashed: false,
    dashLength: 0.25,
    angle: 45,
    crossRotation: 0,
    crossLength: 1,
    waveAmplitude: 0.25,
    waveLength: 1,
    offset: 0,
    border: false,
    borderWidth: 0.1,
    color: null,
    builtin: true,
  },
  {
    id: "status",
    name: "Status Effect",
    pattern: "dots",
    opacity: 0.5,
    gapOpacity: 0,
    borderOpacity: null,
    spacing: 0.2,
    thickness: 0.35,
    edgeWidth: 0.25,
    dashed: false,
    dashLength: 0.25,
    angle: 45,
    crossRotation: 0,
    crossLength: 1,
    waveAmplitude: 0.25,
    waveLength: 1,
    offset: 0,
    border: false,
    borderWidth: 0.1,
    color: null,
    builtin: true,
  },
  {
    id: "minimal",
    name: "Minimal",
    pattern: "hatch",
    opacity: 0.2,
    gapOpacity: 0,
    borderOpacity: null,
    spacing: 0.5,
    thickness: 0.08,
    edgeWidth: 0.25,
    dashed: false,
    dashLength: 0.25,
    angle: 45,
    crossRotation: 0,
    crossLength: 1,
    waveAmplitude: 0.25,
    waveLength: 1,
    offset: 0,
    border: false,
    borderWidth: 0.1,
    color: null,
    builtin: true,
  },
];

/** The ids the importer assigns by default; see DDBActivityFactoryMixin._activityDisplayDefaults. */
export const DEFAULT_REGION_DISPLAY_PROFILES = {
  aura: "aura",
  damage: "damage",
  status: "status",
  minimal: "minimal",
} as const;
