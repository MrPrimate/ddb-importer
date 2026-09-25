import {
  builtinRegionDisplayProfiles,
  isImagePattern,
  isTextureChoice,
  REGION_DISPLAY_DEFAULT_NAME,
  REGION_DISPLAY_DEFAULTS,
  REGION_DISPLAY_FIELDS,
  REGION_DISPLAY_I18N,
  REGION_DISPLAY_LIMITS,
  REGION_DISPLAY_PATTERNS,
  REGION_DISPLAY_TOGGLE_PATTERNS,
} from "../config/regionDisplayProfiles";
import logger from "./Logger";
import utils from "./Utils";

/**
 * Fired on every client after the profile store changes, so open sheets and the canvas can
 * refresh. The world setting's `onChange` (config/settings) raises it, which covers other
 * clients as well as the one that saved.
 */
export { REGION_DISPLAY_PROFILES_CHANGED } from "../config/regionDisplayProfiles";

const SETTING = "region-display-profiles";
const ENABLED_SETTING = "enable-region-display-profiles";

interface IBuiltinProfileCache {
  language: string;
  profiles: readonly IRegionDisplayProfile[];
  byId: Map<string, IRegionDisplayProfile>;
}

let builtinCache: IBuiltinProfileCache | undefined;

/** Set from the `setup` hook, once translations and dnd5e's configuration are final. */
let settled = false;

/**
 * The shipped profiles and an id index. The system icon presets localize their names and read
 * dnd5e's configuration, so they are rebuilt until setup has run and then kept per language:
 * `resolve()` runs on every animation frame of a moving region, and the first canvas draws
 * regions before the game is ready.
 */
function shippedProfiles(): IBuiltinProfileCache {
  if (builtinCache && settled && builtinCache.language === game.i18n.lang) return builtinCache;
  const profiles = builtinRegionDisplayProfiles((name) => game.i18n.localize(name));
  const cache = { language: game.i18n.lang, profiles, byId: new Map(profiles.map((profile) => [profile.id, profile])) };
  if (settled) builtinCache = cache;
  return cache;
}

/**
 * The world's region display profiles: the shipped set plus whatever the GM built or
 * tuned in the profile editor. A stored profile with a shipped id replaces the shipped
 * one, which is how the defaults are customised without renaming them everywhere.
 */
export default class RegionDisplayProfiles {
  /**
   * The master switch. Only an explicit false disables: the setting defaults to true and the
   * feature must keep working before the setting exists (imports in tests, early hooks).
   */
  static get enabled(): boolean {
    return utils.getSetting<boolean>(ENABLED_SETTING) !== false;
  }

  /**
   * Mark translations and dnd5e's configuration as final, from the `setup` hook, so the shipped
   * profiles are cached from then on rather than only once the game is ready.
   */
  static markSettled(): void {
    settled = true;
    builtinCache = undefined;
  }

  static get builtins(): readonly IRegionDisplayProfile[] {
    return shippedProfiles().profiles;
  }

  static isBuiltinId(id: string): boolean {
    return shippedProfiles().byId.has(id);
  }

  /** The shipped profile with this id as it ships, ignoring any stored replacement. */
  static builtin(id: string): IRegionDisplayProfile | null {
    return shippedProfiles().byId.get(id) ?? null;
  }

  /**
   * Drop the cached shipped profiles and return to the pre-setup state, for tests that switch
   * language or system configuration.
   */
  static resetBuiltinCache(): void {
    builtinCache = undefined;
    settled = false;
  }

  /**
   * The stored profiles, tolerating an unset or malformed setting. Anything a stored
   * profile does not carry takes Foundry's own look (REGION_DISPLAY_DEFAULTS).
   */
  static stored(): Record<string, IRegionDisplayProfile> {
    const raw = utils.getSetting<unknown>(SETTING);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const result: Record<string, IRegionDisplayProfile> = {};
    for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
      if (!value || typeof value !== "object") continue;
      result[id] = RegionDisplayProfiles.normalize({ ...(value as Partial<IRegionDisplayProfile>), id });
    }
    return result;
  }

  /** A stored profile is shadowing a shipped one. */
  static isOverriddenBuiltin(id: string): boolean {
    return RegionDisplayProfiles.isBuiltinId(id) && id in RegionDisplayProfiles.stored();
  }

  /** Shipped profiles first (with any stored replacement applied), then custom ones by name. */
  static all(): IRegionDisplayProfile[] {
    const stored = RegionDisplayProfiles.stored();
    const builtins = RegionDisplayProfiles.builtins.map((profile) =>
      stored[profile.id] ? { ...stored[profile.id], builtin: true } : { ...profile },
    );
    const custom = Object.values(stored)
      .filter((profile) => !RegionDisplayProfiles.isBuiltinId(profile.id))
      .map((profile) => ({ ...profile, builtin: false }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return [...builtins, ...custom];
  }

  static get(id: string | null | undefined): IRegionDisplayProfile | null {
    if (!id) return null;
    const shipped = RegionDisplayProfiles.builtin(id);
    const stored = utils.getSetting<Record<string, Partial<IRegionDisplayProfile>> | null>(SETTING)?.[id];
    return stored && typeof stored === "object" ? RegionDisplayProfiles.normalize({ ...stored, id }) : shipped ?? null;
  }

  /** Select options for the pickers. */
  static choices(): { value: string; label: string }[] {
    return RegionDisplayProfiles.all().map((profile) => ({ value: profile.id, label: profile.name }));
  }

  /** A fresh id for a custom profile: a Foundry document id, never derived from the name. */
  static newId(): string {
    return foundry.utils.randomID();
  }

  static clamp(key: TRegionDisplayNumericKey, value: unknown, fallback: number): number {
    const number = typeof value === "string" ? parseFloat(value) : value;
    if (typeof number !== "number" || !Number.isFinite(number)) return fallback;
    const { min, max } = REGION_DISPLAY_LIMITS[key];
    return Math.min(max, Math.max(min, number));
  }

  /** An image option from stored or flag data, or the fallback when it is not a valid choice. */
  static textureChoice<K extends TRegionDisplayTextureKey>(
    key: K,
    value: unknown,
    fallback: TRegionDisplayTextureChoice<K>,
  ): TRegionDisplayTextureChoice<K> {
    return isTextureChoice(key, value) ? value : fallback;
  }

  /** A trimmed image path, or the fallback when the value is not a non-blank string. */
  static textureSrc(value: unknown, fallback: string): string {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  /**
   * The spacing that fits a whole number of symbols or lines into one grid square, to four
   * decimals so three per square stays three across a whole region. Null for no count.
   */
  static spacingForCount(count: unknown): number | null {
    const number = typeof count === "string" ? parseFloat(count) : count;
    if (typeof number !== "number" || !Number.isFinite(number) || number < 1) return null;
    const { min, max } = REGION_DISPLAY_LIMITS.spacing;
    return Math.min(max, Math.max(min, Math.round(10000 / Math.round(number)) / 10000));
  }

  /** The whole number of symbols per grid square a spacing gives, or null when it is not a whole number. */
  static countForSpacing(spacing: unknown): number | null {
    const number = typeof spacing === "string" ? parseFloat(spacing) : spacing;
    if (typeof number !== "number" || !Number.isFinite(number) || number <= 0) return null;
    const count = 1 / number;
    const rounded = Math.round(count);
    return rounded >= 1 && Math.abs(count - rounded) < 0.01 ? rounded : null;
  }

  static isPattern(value: unknown): value is TRegionDisplayPattern {
    return typeof value === "string" && (REGION_DISPLAY_PATTERNS as readonly string[]).includes(value);
  }

  /**
   * A complete, in-range profile from partial or untrusted data, filling gaps from `base`,
   * or from Foundry's own look when there is none.
   */
  static normalize(data: Partial<IRegionDisplayProfile>, base?: IRegionDisplayProfile): IRegionDisplayProfile {
    const fallback = base ?? { ...REGION_DISPLAY_DEFAULTS, name: REGION_DISPLAY_DEFAULT_NAME };
    const name = typeof data.name === "string" && data.name.trim() ? data.name.trim() : fallback.name;
    const id = typeof data.id === "string" && data.id.trim() ? data.id.trim() : RegionDisplayProfiles.newId();
    const color = typeof data.color === "string" && data.color.trim() ? data.color.trim() : null;
    const borderOpacity = RegionDisplayProfiles.clamp("borderOpacity", data.borderOpacity, NaN);
    return {
      id,
      name,
      pattern: RegionDisplayProfiles.isPattern(data.pattern) ? data.pattern : fallback.pattern,
      textureSrc: typeof data.textureSrc === "string" ? data.textureSrc.trim() : fallback.textureSrc,
      textureColorMode: RegionDisplayProfiles.textureChoice(
        "textureColorMode",
        data.textureColorMode,
        fallback.textureColorMode,
      ),
      textureAnchor: RegionDisplayProfiles.textureChoice("textureAnchor", data.textureAnchor, fallback.textureAnchor),
      textureFit: RegionDisplayProfiles.textureChoice("textureFit", data.textureFit, fallback.textureFit),
      opacity: RegionDisplayProfiles.clamp("opacity", data.opacity, fallback.opacity),
      gapOpacity: RegionDisplayProfiles.clamp("gapOpacity", data.gapOpacity, fallback.gapOpacity),
      borderOpacity: data.borderOpacity === null ? null
        : Number.isFinite(borderOpacity) ? borderOpacity : fallback.borderOpacity,
      spacing: RegionDisplayProfiles.clamp("spacing", data.spacing, fallback.spacing),
      thickness: RegionDisplayProfiles.clamp("thickness", data.thickness, fallback.thickness),
      edgeWidth: RegionDisplayProfiles.clamp("edgeWidth", data.edgeWidth, fallback.edgeWidth),
      dashed: RegionDisplayProfiles.dashedValue(data.dashed) ?? fallback.dashed,
      dashLength: RegionDisplayProfiles.clamp("dashLength", data.dashLength, fallback.dashLength),
      angle: RegionDisplayProfiles.clamp("angle", data.angle, fallback.angle),
      crossRotation: RegionDisplayProfiles.clamp("crossRotation", data.crossRotation, fallback.crossRotation),
      crossLength: RegionDisplayProfiles.clamp("crossLength", data.crossLength, fallback.crossLength),
      waveAmplitude: RegionDisplayProfiles.clamp("waveAmplitude", data.waveAmplitude, fallback.waveAmplitude),
      waveLength: RegionDisplayProfiles.clamp("waveLength", data.waveLength, fallback.waveLength),
      offset: RegionDisplayProfiles.clamp("offset", data.offset, fallback.offset),
      border: RegionDisplayProfiles.borderValue(data.border) ?? fallback.border,
      borderWidth: RegionDisplayProfiles.clamp("borderWidth", data.borderWidth, fallback.borderWidth),
      color,
      builtin: RegionDisplayProfiles.isBuiltinId(id),
    };
  }

  /**
   * Merge a region's or behavior's choice over its profile. Null when nothing is chosen
   * or the profile no longer exists, in which case the region keeps Foundry's own look.
   */
  static resolve(flag: IRegionDisplayFlag | null | undefined): IRegionDisplayStyle | null {
    if (!flag || typeof flag !== "object") return null;
    const profile = RegionDisplayProfiles.get(flag.profile);
    if (!profile) {
      if (flag.profile) {
        logger.debug(`Region display profile "${flag.profile}" is not defined; using the Foundry look`);
      }
      return null;
    }
    const color = typeof flag.color === "string" && flag.color.trim() ? flag.color.trim() : profile.color;
    const opacity = RegionDisplayProfiles.clamp("opacity", flag.opacity, profile.opacity);
    return {
      profile: profile.id,
      pattern: RegionDisplayProfiles.isPattern(flag.pattern) ? flag.pattern : profile.pattern,
      textureSrc: RegionDisplayProfiles.textureSrc(flag.textureSrc, profile.textureSrc),
      textureColorMode: RegionDisplayProfiles.textureChoice(
        "textureColorMode",
        flag.textureColorMode,
        profile.textureColorMode,
      ),
      textureAnchor: RegionDisplayProfiles.textureChoice("textureAnchor", flag.textureAnchor, profile.textureAnchor),
      textureFit: RegionDisplayProfiles.textureChoice("textureFit", flag.textureFit, profile.textureFit),
      opacity,
      gapOpacity: RegionDisplayProfiles.clamp("gapOpacity", flag.gapOpacity, profile.gapOpacity),
      borderOpacity: RegionDisplayProfiles.clamp("borderOpacity", flag.borderOpacity, profile.borderOpacity ?? opacity),
      spacing: RegionDisplayProfiles.clamp("spacing", flag.spacing, profile.spacing),
      thickness: RegionDisplayProfiles.clamp("thickness", flag.thickness, profile.thickness),
      edgeWidth: RegionDisplayProfiles.clamp("edgeWidth", flag.edgeWidth, profile.edgeWidth),
      dashed: RegionDisplayProfiles.dashedValue(flag.dashed) ?? profile.dashed,
      dashLength: RegionDisplayProfiles.clamp("dashLength", flag.dashLength, profile.dashLength),
      angle: RegionDisplayProfiles.clamp("angle", flag.angle, profile.angle),
      crossRotation: RegionDisplayProfiles.clamp("crossRotation", flag.crossRotation, profile.crossRotation),
      crossLength: RegionDisplayProfiles.clamp("crossLength", flag.crossLength, profile.crossLength),
      waveAmplitude: RegionDisplayProfiles.clamp("waveAmplitude", flag.waveAmplitude, profile.waveAmplitude),
      waveLength: RegionDisplayProfiles.clamp("waveLength", flag.waveLength, profile.waveLength),
      offset: RegionDisplayProfiles.clamp("offset", flag.offset, profile.offset),
      border: RegionDisplayProfiles.borderValue(flag.border) ?? profile.border,
      borderWidth: RegionDisplayProfiles.clamp("borderWidth", flag.borderWidth, profile.borderWidth),
      color,
    };
  }

  /** A three-state choice as a boolean: code passes booleans, the behavior form its strings; anything else inherits. */
  static tristate(value: unknown, yes: string, no: string): boolean | null {
    if (typeof value === "boolean") return value;
    if (value === yes) return true;
    if (value === no) return false;
    return null;
  }

  static dashedValue(value: unknown): boolean | null {
    return RegionDisplayProfiles.tristate(value, "dashed", "continuous");
  }

  static borderValue(value: unknown): boolean | null {
    return RegionDisplayProfiles.tristate(value, "border", "none");
  }

  /** Whether an editor shows a numeric field for a pattern and its dashed / border choices. */
  static fieldApplies(key: TRegionDisplayNumericKey, context: TRegionDisplayFieldContext): boolean {
    const field = REGION_DISPLAY_FIELDS.find((entry) => entry.key === key);
    if (!field) return false;
    if (field.patterns && !field.patterns.includes(context.pattern)) return false;
    switch (field.requires) {
      case "dashed":
        return context.dashed;
      case "border":
        return context.border;
      case "band":
        return context.border || context.pattern === "edge";
      default:
        return true;
    }
  }

  /** Whether the dashed or border choice means anything for a pattern. */
  static toggleApplies(toggle: "dashed" | "border", pattern: TRegionDisplayPattern): boolean {
    return REGION_DISPLAY_TOGGLE_PATTERNS[toggle].includes(pattern);
  }

  /**
   * A copy of a flag without the overrides its resolved style cannot use: an angle left
   * over from a line pattern after switching to dots, a dash length while the lines are
   * continuous. An editor keeps those in its draft so switching back restores them; what
   * is stored and summarised should only carry what draws. Unresolvable flags pass through.
   */
  static applicable(flag: IRegionDisplayFlag): IRegionDisplayFlag {
    const style = RegionDisplayProfiles.resolve(flag);
    if (!style) return { ...flag };
    const result: IRegionDisplayFlag = { ...flag };
    for (const { key } of REGION_DISPLAY_FIELDS) {
      if (key in result && !RegionDisplayProfiles.fieldApplies(key, style)) delete result[key];
    }
    if ("dashed" in result && !RegionDisplayProfiles.toggleApplies("dashed", style.pattern)) delete result.dashed;
    if ("border" in result && !RegionDisplayProfiles.toggleApplies("border", style.pattern)) delete result.border;
    if (!isImagePattern(style.pattern)) {
      delete result.textureSrc;
      delete result.textureColorMode;
    }
    if (!isImagePattern(style.pattern) || style.pattern === "imageStretch") delete result.textureAnchor;
    if (style.pattern !== "imageStretch") delete result.textureFit;
    return result;
  }

  /** A localized string under the display behavior's i18n root. */
  static localize(path: string): string {
    return game.i18n.localize(`${REGION_DISPLAY_I18N}.${path}`);
  }

  static fieldLabel(key: TRegionDisplayNumericKey): string {
    return RegionDisplayProfiles.localize(`FIELDS.${key}.label`);
  }

  /** A field's hint, or the pattern's own wording where the field reads differently for it. */
  static fieldHint(key: TRegionDisplayNumericKey, pattern: TRegionDisplayPattern | null | undefined): string {
    const field = REGION_DISPLAY_FIELDS.find((entry) => entry.key === key);
    const own = pattern && field?.patternHints?.includes(pattern);
    return RegionDisplayProfiles.localize(own ? `FIELDS.${key}.hints.${pattern}` : `FIELDS.${key}.hint`);
  }

  static patternLabel(pattern: TRegionDisplayPattern): string {
    return RegionDisplayProfiles.localize(`patterns.${pattern}`);
  }

  static async #write(store: Record<string, IRegionDisplayProfile>): Promise<void> {
    const persisted: Record<string, Omit<IRegionDisplayProfile, "builtin">> = {};
    for (const [id, profile] of Object.entries(store)) {
      const { builtin: _builtin, ...rest } = profile;
      persisted[id] = rest;
    }
    await utils.setSetting(SETTING, persisted);
  }

  /** Create or replace a profile (a shipped id becomes a stored override). */
  static async save(data: Partial<IRegionDisplayProfile>): Promise<IRegionDisplayProfile> {
    const base = RegionDisplayProfiles.get(data.id) ?? undefined;
    const profile = RegionDisplayProfiles.normalize(data, base);
    const store = RegionDisplayProfiles.stored();
    store[profile.id] = profile;
    await RegionDisplayProfiles.#write(store);
    logger.info(`Saved region display profile "${profile.name}" (${profile.id})`);
    return profile;
  }

  /** Delete a custom profile, or drop the stored override of a shipped one (restoring it). */
  static async remove(id: string): Promise<void> {
    const store = RegionDisplayProfiles.stored();
    if (!(id in store)) return;
    delete store[id];
    await RegionDisplayProfiles.#write(store);
    logger.info(`Removed region display profile ${id}`);
  }
}
