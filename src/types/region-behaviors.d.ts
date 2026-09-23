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
  // ---- Region highlight profiles (the appearance of aura / template Regions) ----

  /** Fill patterns the DDB highlight shader can draw; `hatch` is Foundry's own diagonal stripes. */
  type TRegionHighlightPattern = "hatch" | "solid" | "crosshatch" | "dots" | "edge" | "hollowDots" | "diamonds";

  /** A named appearance for the Region highlight, shipped or user-built. */
  interface IRegionHighlightProfile {
    /** Slug used as the stable key on activities and regions. */
    id: string;
    name: string;
    pattern: TRegionHighlightPattern;
    /** Mesh alpha, 0-1. Foundry draws every region at 0.5. */
    opacity: number;
    /** Gap alpha relative to fill opacity; zero is transparent. */
    gapOpacity: number;
    /** Independent border alpha; null follows the effective fill opacity. */
    borderOpacity: number | null;
    /** Pattern period as a fraction of a grid square. */
    spacing: number;
    /** Share of the period that is ink: line width for stripes, dot diameter for dots, 0-1. */
    thickness: number;
    /** Width of the edge band as a fraction of a grid square (edge pattern only). */
    edgeWidth: number;
    /** Break the lines of the hatch and crosshatch patterns into dashes. */
    dashed: boolean;
    /** Length of one dash (and of the gap after it) as a fraction of a grid square. */
    dashLength: number;
    /** Direction the lines of the hatch and crosshatch patterns face, in degrees; 45 is Foundry's diagonal. */
    angle: number;
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
   * The per-region choice, stored at `flags.ddbimporter.highlight` and on the `ddbHighlight`
   * activity behavior: a profile id plus optional overrides. Null, undefined and blank
   * override values inherit from the profile.
   */
  interface IRegionHighlightFlag {
    profile?: string;
    pattern?: TRegionHighlightPattern | "" | null;
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
    /** Booleans from code; the behavior form stores "border" / "none" (blank inherits). */
    border?: boolean | "border" | "none" | "" | null;
    borderWidth?: number | string | null;
    color?: string | null;
  }

  /** A fully resolved appearance, ready to apply to a highlight mesh. */
  interface IRegionHighlightStyle {
    profile: string;
    pattern: TRegionHighlightPattern;
    opacity: number;
    gapOpacity: number;
    borderOpacity: number;
    spacing: number;
    thickness: number;
    edgeWidth: number;
    dashed: boolean;
    dashLength: number;
    angle: number;
    border: boolean;
    borderWidth: number;
    color: string | null;
  }
}
