/**
 * Shipped region highlight profiles and the pattern table the highlight shader
 * understands. Pure data: `src/config` is a leaf package.
 */

export const REGION_HIGHLIGHT_PATTERNS: readonly TRegionHighlightPattern[] = [
  "hatch",
  "solid",
  "crosshatch",
  "dots",
  "edge",
];

/** The `pattern` uniform value for each fill pattern; the shader branches on these. */
export const REGION_HIGHLIGHT_PATTERN_IDS: Record<TRegionHighlightPattern, number> = {
  hatch: 0,
  solid: 1,
  crosshatch: 2,
  dots: 3,
  edge: 4,
};

export const REGION_HIGHLIGHT_PATTERN_LABELS: Record<TRegionHighlightPattern, string> = {
  hatch: "Diagonal Lines",
  solid: "Solid",
  crosshatch: "Crosshatch",
  dots: "Dots",
  edge: "Edge Band",
};

/** Bounds for the numeric profile fields, shared by the store, the builder and the behavior schema. */
export const REGION_HIGHLIGHT_LIMITS = {
  opacity: { min: 0, max: 1, step: 0.05 },
  spacing: { min: 0.05, max: 4, step: 0.05 },
  thickness: { min: 0.02, max: 1, step: 0.01 },
  edgeWidth: { min: 0.05, max: 2, step: 0.05 },
  dashLength: { min: 0.05, max: 4, step: 0.05 },
  angle: { min: 0, max: 180, step: 5 },
  borderWidth: { min: 0.05, max: 2, step: 0.05 },
} as const;

/**
 * What Foundry itself draws, for reference: alpha 0.5 and a hatch whose period is
 * 4 * sqrt(2) * 2 px at the default UI scale, roughly a tenth of a 100 px grid square.
 */
export const FOUNDRY_REGION_HIGHLIGHT = {
  opacity: 0.5,
  spacing: 0.11,
  thickness: 0.5,
} as const;

export const BUILTIN_REGION_HIGHLIGHT_PROFILES: readonly IRegionHighlightProfile[] = [
  {
    id: "aura",
    name: "Aura",
    pattern: "hatch",
    opacity: 0.8,
    spacing: 0.5,
    thickness: 0.15,
    edgeWidth: 0.25,
    dashed: false,
    dashLength: 0.25,
    angle: 45,
    border: false,
    borderWidth: 0.1,
    color: null,
    builtin: true,
  },
  {
    id: "damage",
    name: "Ongoing Damage",
    pattern: "crosshatch",
    opacity: 0.5,
    spacing: 0.25,
    thickness: 0.2,
    edgeWidth: 0.25,
    dashed: false,
    dashLength: 0.25,
    angle: 45,
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
    spacing: 0.2,
    thickness: 0.35,
    edgeWidth: 0.25,
    dashed: false,
    dashLength: 0.25,
    angle: 45,
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
    spacing: 0.5,
    thickness: 0.08,
    edgeWidth: 0.25,
    dashed: false,
    dashLength: 0.25,
    angle: 45,
    border: false,
    borderWidth: 0.1,
    color: null,
    builtin: true,
  },
];

/** The ids the importer assigns by default; see DDBActivityFactoryMixin._activityHighlightDefaults. */
export const DEFAULT_REGION_HIGHLIGHT_PROFILES = {
  aura: "aura",
  damage: "damage",
  status: "status",
  minimal: "minimal",
} as const;
