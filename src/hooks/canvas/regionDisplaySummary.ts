import {
  isTextureChoice,
  REGION_DISPLAY_FALLBACK_COLOR,
  REGION_DISPLAY_FIELDS,
  REGION_DISPLAY_I18N,
} from "../../config/regionDisplayProfiles";
import RegionDisplayProfiles from "../../lib/RegionDisplayProfiles";
import { imagePreviewData } from "./regionDisplayImagePreview";
import { previewCss } from "./regionDisplayPreview";

/**
 * What the Region config box and the activity's region display behavior share: the words
 * for a display flag, the row that shows them beside a Configure button, and the mapping
 * between a flag and the `ddbDisplay` behavior config (which stores blanks where a flag omits
 * keys).
 *
 * Leaf module: the behavior data model imports it at init, so it must not reach the app tree.
 */

/** The class the activity sheet's Configure button carries (hooks/canvas/regionDisplayBehaviorConfigure.ts). */
export const BEHAVIOR_CONFIGURE_CLASS = "ddbi-display-region-configure-behavior";

/** Every key a display flag (and the behavior config) can carry. */
export const REGION_DISPLAY_FLAG_KEYS: (keyof IRegionDisplayFlag)[] = [
  "profile",
  "pattern",
  "dashed",
  "border",
  "color",
  "textureSrc",
  "textureColorMode",
  "textureAnchor",
  "textureFit",
  ...REGION_DISPLAY_FIELDS.map((field) => field.key),
];

/** The placing user's colour, which a profile without its own takes in activity previews. */
export function userPreviewColor(): string {
  const color = game.user?.color;
  return typeof color === "string" && color ? color : REGION_DISPLAY_FALLBACK_COLOR;
}

/**
 * The words for a flag: the profile name and each override that departs from it (and that
 * the resolved pattern uses), or the Foundry default when there is no profile.
 */
export function describeDisplayFlag(stored: IRegionDisplayFlag | null | undefined): string {
  if (!stored?.profile) return RegionDisplayProfiles.localize("noProfile");
  const profile = RegionDisplayProfiles.get(stored.profile);
  if (!profile) return game.i18n.format(`${REGION_DISPLAY_I18N}.unknownProfile`, { profile: stored.profile });
  // an editor's draft may still hold overrides for controls another pattern hid; they do not draw
  const flag = RegionDisplayProfiles.applicable(stored);
  // labels keep the language's own casing: lowercasing them is wrong wherever nouns are capitalised
  const parts: string[] = [];
  if (RegionDisplayProfiles.isPattern(flag.pattern)) {
    parts.push(RegionDisplayProfiles.patternLabel(flag.pattern));
  }
  const dashed = RegionDisplayProfiles.dashedValue(flag.dashed);
  if (dashed !== null) parts.push(RegionDisplayProfiles.localize(dashed ? "dashed" : "continuous"));
  const border = RegionDisplayProfiles.borderValue(flag.border);
  if (border !== null) parts.push(RegionDisplayProfiles.localize(border ? "border" : "noBorder"));
  for (const { key } of REGION_DISPLAY_FIELDS) {
    const value = RegionDisplayProfiles.clamp(key, flag[key], NaN);
    if (!Number.isFinite(value)) continue;
    const degrees = key === "angle" || key === "crossRotation" ? "°" : "";
    parts.push(RegionDisplayProfiles.format("summary.field", {
      field: RegionDisplayProfiles.fieldLabel(key),
      value: `${value}${degrees}`,
    }));
  }
  if (typeof flag.color === "string" && flag.color.trim()) {
    parts.push(game.i18n.format(`${REGION_DISPLAY_I18N}.summaryColor`, { color: flag.color.trim() }));
  }
  if (flag.textureSrc) parts.push(flag.textureSrc.split("/").pop() ?? flag.textureSrc);
  if (flag.textureColorMode) parts.push(RegionDisplayProfiles.localize(`texture.${flag.textureColorMode}`));
  if (flag.textureFit) parts.push(RegionDisplayProfiles.localize(`texture.fit.${flag.textureFit}`));
  if (flag.textureAnchor) parts.push(RegionDisplayProfiles.localize(`texture.anchor.${flag.textureAnchor}`));
  if (!parts.length) return profile.name;
  return RegionDisplayProfiles.format("summary.text", {
    profile: profile.name,
    parts: game.i18n.getListFormatter({ type: "unit", style: "short" }).format(parts),
  });
}

function overrideValue(value: unknown): number | string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") return value.trim() ? value.trim() : null;
  return null;
}

/**
 * The flag a `ddbDisplay` behavior config describes. The config stores a blank or null
 * for every override it does not make; the flag simply omits those keys. Booleans are
 * accepted for `dashed` / `border` because enrichers build configs from code.
 */
export function flagFromBehaviorConfig(config: Record<string, unknown> | null | undefined): IRegionDisplayFlag {
  const source = config ?? {};
  const flag: IRegionDisplayFlag = { profile: typeof source.profile === "string" ? source.profile : "" };
  const pattern = overrideValue(source.pattern);
  if (RegionDisplayProfiles.isPattern(pattern)) flag.pattern = pattern;
  for (const { key } of REGION_DISPLAY_FIELDS) {
    const value = overrideValue(source[key]);
    if (value !== null) flag[key] = value;
  }
  if (typeof source.dashed === "boolean" || source.dashed === "dashed" || source.dashed === "continuous") {
    flag.dashed = source.dashed;
  }
  if (typeof source.border === "boolean" || source.border === "border" || source.border === "none") {
    flag.border = source.border;
  }
  if (typeof source.textureSrc === "string" && source.textureSrc.trim()) flag.textureSrc = source.textureSrc.trim();
  if (isTextureChoice("textureColorMode", source.textureColorMode)) flag.textureColorMode = source.textureColorMode;
  if (isTextureChoice("textureAnchor", source.textureAnchor)) flag.textureAnchor = source.textureAnchor;
  if (isTextureChoice("textureFit", source.textureFit)) flag.textureFit = source.textureFit;
  const color = overrideValue(source.color);
  if (typeof color === "string") flag.color = color;
  return flag;
}

/** The full behavior config for a flag: every key present, blanks and nulls where the flag omits one. */
export function behaviorConfigFromFlag(flag: IRegionDisplayFlag | null | undefined): Record<string, unknown> {
  const source = flag ?? {};
  const config: Record<string, unknown> = {
    profile: source.profile ?? "",
    textureSrc: source.textureSrc?.trim() ?? "",
    textureColorMode: source.textureColorMode ?? "",
    textureAnchor: source.textureAnchor ?? "",
    textureFit: source.textureFit ?? "",
    pattern: RegionDisplayProfiles.isPattern(source.pattern) ? source.pattern : "",
    color: typeof source.color === "string" && source.color.trim() ? source.color.trim() : null,
  };
  const dashed = RegionDisplayProfiles.dashedValue(source.dashed);
  config.dashed = dashed === null ? "" : dashed ? "dashed" : "continuous";
  const border = RegionDisplayProfiles.borderValue(source.border);
  config.border = border === null ? "" : border ? "border" : "none";
  for (const { key } of REGION_DISPLAY_FIELDS) {
    const value = RegionDisplayProfiles.clamp(key, source[key], NaN);
    config[key] = Number.isFinite(value) ? value : null;
  }
  return config;
}

interface IDisplaySummaryRowConfig {
  flag: IRegionDisplayFlag | null | undefined;
  /** The colour a profile without its own takes: the region's, or the placing user's. */
  color: string;
  /** Class the Configure button carries so its click can be routed. */
  buttonClass: string;
  /** False leaves the Configure button out, for a user who could not save the change. */
  editable?: boolean;
}

/**
 * One row: a swatch (when the flag resolves), the summary text and a Configure button. The
 * button has no listener of its own so the row survives dnd5e's HTML serialisation; the
 * caller either listens on it directly (Region config) or through a document delegate
 * (activity sheet).
 */
export function buildDisplaySummaryRow({
  flag,
  color,
  buttonClass,
  editable = true,
}: IDisplaySummaryRowConfig): HTMLElement {
  const row = document.createElement("div");
  row.classList.add("ddbi-display-region-summary");

  const style = RegionDisplayProfiles.resolve(flag);
  if (style) {
    const swatch = document.createElement("span");
    swatch.classList.add("ddbi-display-region-swatch");
    const fill = document.createElement("span");
    fill.classList.add("ddbi-display-region-fill");
    swatch.append(fill);
    swatch.setAttribute("style", previewCss(style, color, 24));
    swatch.dataset.imagePreview = imagePreviewData(style, color, 24);
    row.append(swatch);
  }

  const text = document.createElement("span");
  text.classList.add("ddbi-display-region-summary-text");
  text.textContent = describeDisplayFlag(flag);
  row.append(text);
  if (!editable) return row;

  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("ddbi-display-region-configure", buttonClass);
  button.innerHTML = `<i class="fa-solid fa-sliders" inert></i> `;
  button.append(RegionDisplayProfiles.localize("configure"));
  row.append(button);
  return row;
}
