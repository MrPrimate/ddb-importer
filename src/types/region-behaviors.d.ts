export {};

declare global {
  /** Runtime arguments share the behavior editor's targeting and owner-turn options. */
  interface IUseActivityArgs extends Omit<I5eActivityBehaviorMacroConfig, "args" | "events" | "function" | "activity" | "macroName" | "macroParameters"> {
    activityName?: string;
    activityId?: string;
    dispositions?: number[];
    macroParameters?: string | Record<string, unknown>;
    expiresAt?: number;
    fallbackExpiresAt?: number;
    placementCombatId?: string;
  }

  /** Stored on the placed behavior; dispatch never interprets its script. */
  interface IOwnerTurnBehavior {
    events: string[];
    args: IUseActivityArgs & Record<string, unknown>;
  }

  interface IRegionTargetRequest {
    id: string;
    actorUuid: string;
    regionUuid: string;
    title: string;
    instruction: string;
    tokenUuids: string[];
    activities: { id: string; name: string; max?: number }[];
    max: number;
  }

  interface IRegionTargetChoice {
    tokens: string[];
    activity: string;
  }
}

declare global {
  // ---- Region display profiles (the appearance of aura / template Regions) ----

  /** Fill patterns the DDB display shader can draw; `hatch` is Foundry's own diagonal stripes. */
  type TRegionDisplayPattern = "hatch" | "solid" | "crosshatch" | "dots" | "edge" | "hollowDots" | "diamonds" | "crosses" | "checkerboard" | "waves" | "chevrons";

  /** A named region display, shipped or user-built. */
  interface IRegionDisplayProfile {
    /** Slug used as the stable key on activities and regions. */
    id: string;
    name: string;
    pattern: TRegionDisplayPattern;
    /** Mesh alpha, 0-1. Foundry draws every region at 0.5. */
    opacity: number;
    /** Gap alpha relative to fill opacity; zero is transparent. */
    gapOpacity: number;
    /** Independent border alpha; null follows the effective fill opacity. */
    borderOpacity: number | null;
    /** Pattern period as a fraction of a grid square; checkerboard uses this for each square's side. */
    spacing: number;
    /** Line width or symbol diameter as a share of the period, 0-1. Unused by checkerboard. */
    thickness: number;
    /** Width of the edge band as a fraction of a grid square (edge pattern only). */
    edgeWidth: number;
    /** Break line patterns into dashes, measured along their overall direction. */
    dashed: boolean;
    /** Length of one dash (and of the gap after it) as a fraction of a grid square. */
    dashLength: number;
    /** Direction line patterns face, in degrees; 45 is Foundry's diagonal. */
    angle: number;
    /** Clockwise rotation of each cross about its centre, in degrees; zero is upright. */
    crossRotation: number;
    /** Arm length multiplier; arm width remains set by thickness. */
    crossLength: number;
    /** Wave displacement from the centre line, as a share of spacing. */
    waveAmplitude: number;
    /** Wave repeat length as a multiple of spacing. */
    waveLength: number;
    /** Shift of the pattern by a share of the spacing: 0 centres symbols in their cells, 0.5 puts them on the cell corners. */
    offset: number;
    /** Draw a band inside the region's edge on top of a fill pattern (the edge pattern always has one). */
    border: boolean;
    /** Width of that band as a fraction of a grid square. */
    borderWidth: number;
    /** CSS colour; null uses the region's own colour. */
    color: string | null;
    /** Shipped with the module. A stored profile with the same id replaces it and can be reset. */
    builtin?: boolean;
  }

  /**
   * The per-region choice, stored at `flags.ddbimporter.display` and on the `ddbDisplay`
   * activity behavior: a profile id plus optional overrides. Null, undefined and blank
   * override values inherit from the profile.
   */
  interface IRegionDisplayFlag {
    profile?: string;
    pattern?: TRegionDisplayPattern | "" | null;
    opacity?: number | string | null;
    gapOpacity?: number | string | null;
    borderOpacity?: number | string | null;
    spacing?: number | string | null;
    thickness?: number | string | null;
    edgeWidth?: number | string | null;
    /** Booleans from code; the behavior form stores "dashed" / "continuous" (blank inherits). */
    dashed?: boolean | "dashed" | "continuous" | "" | null;
    dashLength?: number | string | null;
    angle?: number | string | null;
    crossRotation?: number | string | null;
    crossLength?: number | string | null;
    waveAmplitude?: number | string | null;
    waveLength?: number | string | null;
    offset?: number | string | null;
    /** Booleans from code; the behavior form stores "border" / "none" (blank inherits). */
    border?: boolean | "border" | "none" | "" | null;
    borderWidth?: number | string | null;
    color?: string | null;
  }

  /** A fully resolved display, ready to apply to a region's highlight mesh. */
  interface IRegionDisplayStyle {
    profile: string;
    pattern: TRegionDisplayPattern;
    opacity: number;
    gapOpacity: number;
    borderOpacity: number;
    spacing: number;
    thickness: number;
    edgeWidth: number;
    dashed: boolean;
    dashLength: number;
    angle: number;
    crossRotation: number;
    /** Arm length multiplier; arm width remains set by thickness. */
    crossLength: number;
    /** Wave displacement from the centre line, as a share of spacing. */
    waveAmplitude: number;
    /** Wave repeat length as a multiple of spacing. */
    waveLength: number;
    offset: number;
    border: boolean;
    borderWidth: number;
    color: string | null;
  }

  /** The numeric profile fields: every key whose value is a number (borderOpacity may be null). */
  type TRegionDisplayNumericKey = {
    [K in keyof IRegionDisplayProfile]-?: NonNullable<IRegionDisplayProfile[K]> extends number ? K : never;
  }[keyof IRegionDisplayProfile];

  /**
   * When an editor shows a numeric field (config/regionDisplayProfiles REGION_DISPLAY_FIELDS).
   * Labels and hints live in en.json under `behaviors.display.FIELDS.<key>`.
   */
  interface IRegionDisplayField {
    key: TRegionDisplayNumericKey;
    /** The patterns the field applies to; absent for every pattern. */
    patterns?: readonly TRegionDisplayPattern[];
    /** A toggle the field also needs: dashed lines, a border, or any band (a border or the edge pattern). */
    requires?: "dashed" | "border" | "band";
    /** Patterns with their own hint, at `FIELDS.<key>.hints.<pattern>`. */
    patternHints?: readonly TRegionDisplayPattern[];
  }

  /** What field applicability reads from a profile or a resolved style. */
  type TRegionDisplayFieldContext = Pick<IRegionDisplayProfile, "pattern" | "dashed" | "border">;
}
