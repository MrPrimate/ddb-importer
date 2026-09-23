import { REGION_HIGHLIGHT_LIMITS, REGION_HIGHLIGHT_PATTERN_LABELS } from "../../config/regionHighlightProfiles";
import RegionHighlightProfiles from "../../lib/RegionHighlightProfiles";
import { previewCss } from "./regionHighlightPreview";

/**
 * What the Region config box and the activity's appearance behavior share: the words for a
 * highlight flag, the row that shows them beside a Configure button, and the mapping between
 * a flag and the `ddbHighlight` behavior config (which stores blanks where a flag omits keys).
 *
 * Leaf module: the behavior data model imports it at init, so it must not reach the app tree.
 */

type TNumericKey = keyof typeof REGION_HIGHLIGHT_LIMITS;

/** The numeric overrides in the order the editor shows them; blank means "the profile's value". */
export const REGION_HIGHLIGHT_NUMERIC_OVERRIDES: { key: TNumericKey; label: string; hint: string }[] = [
  { key: "opacity", label: "Fill Opacity", hint: "0 to 1." },
  { key: "gapOpacity", label: "Gap Opacity", hint: "Relative to fill opacity; zero makes pattern gaps transparent." },
  { key: "borderOpacity", label: "Border Opacity", hint: "Independent of fill opacity." },
  { key: "spacing", label: "Spacing", hint: "Distance between lines or symbols, in grid squares." },
  { key: "thickness", label: "Thickness", hint: "Line width or symbol diameter as a share of the spacing, 0 to 1." },
  { key: "edgeWidth", label: "Edge Width", hint: "Band width of the Edge Band pattern, in grid squares." },
  { key: "dashLength", label: "Dash Length", hint: "Length of each dash and of the gap after it, in grid squares." },
  { key: "angle", label: "Line Angle", hint: "Direction the lines face, in degrees." },
  { key: "borderWidth", label: "Border Width", hint: "Band width inside the edge, in grid squares." },
];

/** Every key a highlight flag (and the behavior config) can carry. */
export const REGION_HIGHLIGHT_FLAG_KEYS: (keyof IRegionHighlightFlag)[] = [
  "profile",
  "pattern",
  "dashed",
  "border",
  "color",
  ...REGION_HIGHLIGHT_NUMERIC_OVERRIDES.map((field) => field.key),
];

/** The colour the previews use when neither the flag, the profile nor the host names one. */
export const REGION_HIGHLIGHT_FALLBACK_COLOR = "#ff6400";

/**
 * The words for a flag: the profile name and each override that departs from it, or the
 * Foundry default when there is no profile.
 */
export function describeHighlightFlag(flag: IRegionHighlightFlag | null | undefined): string {
  const profile = RegionHighlightProfiles.get(flag?.profile);
  if (!flag?.profile) return "None (Foundry default)";
  if (!profile) return `Unknown profile "${flag.profile}" (Foundry default)`;
  const parts: string[] = [];
  if (RegionHighlightProfiles.isPattern(flag.pattern)) {
    parts.push(REGION_HIGHLIGHT_PATTERN_LABELS[flag.pattern].toLowerCase());
  }
  const dashed = RegionHighlightProfiles.dashedValue(flag.dashed);
  if (dashed !== null) parts.push(dashed ? "dashed" : "continuous");
  const border = RegionHighlightProfiles.borderValue(flag.border);
  if (border !== null) parts.push(border ? "border" : "no border");
  for (const { key, label } of REGION_HIGHLIGHT_NUMERIC_OVERRIDES) {
    const value = RegionHighlightProfiles.clamp(key, flag[key], NaN);
    if (Number.isFinite(value)) parts.push(`${label.toLowerCase()} ${value}${key === "angle" ? "°" : ""}`);
  }
  if (typeof flag.color === "string" && flag.color.trim()) parts.push(`colour ${flag.color.trim()}`);
  return parts.length ? `${profile.name}, ${parts.join(", ")}` : profile.name;
}

function overrideValue(value: unknown): number | string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") return value.trim() ? value.trim() : null;
  return null;
}

/**
 * The flag a `ddbHighlight` behavior config describes. The config stores a blank or null
 * for every override it does not make; the flag simply omits those keys. Booleans are
 * accepted for `dashed` / `border` because enrichers build configs from code.
 */
export function flagFromBehaviorConfig(config: Record<string, unknown> | null | undefined): IRegionHighlightFlag {
  const source = config ?? {};
  const flag: IRegionHighlightFlag = { profile: typeof source.profile === "string" ? source.profile : "" };
  const pattern = overrideValue(source.pattern);
  if (RegionHighlightProfiles.isPattern(pattern)) flag.pattern = pattern;
  for (const { key } of REGION_HIGHLIGHT_NUMERIC_OVERRIDES) {
    const value = overrideValue(source[key]);
    if (value !== null) flag[key] = value;
  }
  if (typeof source.dashed === "boolean" || source.dashed === "dashed" || source.dashed === "continuous") {
    flag.dashed = source.dashed;
  }
  if (typeof source.border === "boolean" || source.border === "border" || source.border === "none") {
    flag.border = source.border;
  }
  const color = overrideValue(source.color);
  if (typeof color === "string") flag.color = color;
  return flag;
}

/** The full behavior config for a flag: every key present, blanks and nulls where the flag omits one. */
export function behaviorConfigFromFlag(flag: IRegionHighlightFlag | null | undefined): Record<string, unknown> {
  const source = flag ?? {};
  const config: Record<string, unknown> = {
    profile: source.profile ?? "",
    pattern: RegionHighlightProfiles.isPattern(source.pattern) ? source.pattern : "",
    color: typeof source.color === "string" && source.color.trim() ? source.color.trim() : null,
  };
  const dashed = RegionHighlightProfiles.dashedValue(source.dashed);
  config.dashed = dashed === null ? "" : dashed ? "dashed" : "continuous";
  const border = RegionHighlightProfiles.borderValue(source.border);
  config.border = border === null ? "" : border ? "border" : "none";
  for (const { key } of REGION_HIGHLIGHT_NUMERIC_OVERRIDES) {
    const value = RegionHighlightProfiles.clamp(key, source[key], NaN);
    config[key] = Number.isFinite(value) ? value : null;
  }
  return config;
}

export interface IHighlightSummaryRowConfig {
  flag: IRegionHighlightFlag | null | undefined;
  /** The colour a profile without its own takes: the region's, or the placing user's. */
  color: string;
  /** Class the Configure button carries so its click can be routed. */
  buttonClass: string;
}

/**
 * One row: a swatch (when the flag resolves), the summary text and a Configure button. The
 * button has no listener of its own so the row survives dnd5e's HTML serialisation; the
 * caller either listens on it directly (Region config) or through a document delegate
 * (activity sheet).
 */
export function buildHighlightSummaryRow({ flag, color, buttonClass }: IHighlightSummaryRowConfig): HTMLElement {
  const row = document.createElement("div");
  row.classList.add("ddbi-highlight-summary");

  const style = RegionHighlightProfiles.resolve(flag);
  if (style) {
    const swatch = document.createElement("span");
    swatch.classList.add("ddbi-highlight-swatch");
    const fill = document.createElement("span");
    fill.classList.add("ddbi-highlight-fill");
    swatch.append(fill);
    swatch.setAttribute("style", previewCss(style, color, 24));
    row.append(swatch);
  }

  const text = document.createElement("span");
  text.classList.add("ddbi-highlight-summary-text");
  text.textContent = describeHighlightFlag(flag);
  row.append(text);

  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("ddbi-highlight-configure", buttonClass);
  button.innerHTML = `<i class="fa-solid fa-sliders" inert></i> Configure`;
  row.append(button);
  return row;
}
