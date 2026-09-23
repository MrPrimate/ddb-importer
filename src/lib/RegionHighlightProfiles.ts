import {
  BUILTIN_REGION_HIGHLIGHT_PROFILES,
  REGION_HIGHLIGHT_LIMITS,
  REGION_HIGHLIGHT_PATTERNS,
} from "../config/regionHighlightProfiles";
import logger from "./Logger";
import utils from "./Utils";

const SETTING = "region-highlight-profiles";
const ENABLED_SETTING = "enable-region-highlight-profiles";

/**
 * Fired on every client after the profile store changes, so open sheets and the canvas can
 * refresh. The world setting's `onChange` (config/settings) raises it, which covers other
 * clients as well as the one that saved.
 */
export const REGION_HIGHLIGHT_PROFILES_CHANGED = "ddb-importer.regionHighlightProfilesChanged";

type TLimitKey = keyof typeof REGION_HIGHLIGHT_LIMITS;

/**
 * The world's region highlight profiles: the shipped set plus whatever the GM built or
 * tuned in the profile editor. A stored profile with a shipped id replaces the shipped
 * one, which is how the defaults are customised without renaming them everywhere.
 */
export default class RegionHighlightProfiles {
  /**
   * The master switch. Only an explicit false disables: the setting defaults to true and the
   * feature must keep working before the setting exists (imports in tests, early hooks).
   */
  static get enabled(): boolean {
    return utils.getSetting<boolean>(ENABLED_SETTING) !== false;
  }

  static get builtins(): readonly IRegionHighlightProfile[] {
    return BUILTIN_REGION_HIGHLIGHT_PROFILES;
  }

  static isBuiltinId(id: string): boolean {
    return BUILTIN_REGION_HIGHLIGHT_PROFILES.some((profile) => profile.id === id);
  }

  /** The stored profiles, tolerating an unset or malformed setting. */
  static stored(): Record<string, IRegionHighlightProfile> {
    const raw = utils.getSetting<unknown>(SETTING);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const result: Record<string, IRegionHighlightProfile> = {};
    for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
      if (!value || typeof value !== "object") continue;
      result[id] = RegionHighlightProfiles.normalize({ ...(value as Partial<IRegionHighlightProfile>), id });
    }
    return result;
  }

  /** A stored profile is shadowing a shipped one. */
  static isOverriddenBuiltin(id: string): boolean {
    return RegionHighlightProfiles.isBuiltinId(id) && id in RegionHighlightProfiles.stored();
  }

  /** Shipped profiles first (with any stored replacement applied), then custom ones by name. */
  static all(): IRegionHighlightProfile[] {
    const stored = RegionHighlightProfiles.stored();
    const builtins = BUILTIN_REGION_HIGHLIGHT_PROFILES.map((profile) =>
      stored[profile.id] ? { ...stored[profile.id], builtin: true } : { ...profile },
    );
    const custom = Object.values(stored)
      .filter((profile) => !RegionHighlightProfiles.isBuiltinId(profile.id))
      .map((profile) => ({ ...profile, builtin: false }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return [...builtins, ...custom];
  }

  static get(id: string | null | undefined): IRegionHighlightProfile | null {
    if (!id) return null;
    return RegionHighlightProfiles.all().find((profile) => profile.id === id) ?? null;
  }

  /** Select options for the pickers. */
  static choices(): { value: string; label: string }[] {
    return RegionHighlightProfiles.all().map((profile) => ({ value: profile.id, label: profile.name }));
  }

  /** A fresh id for a custom profile: a Foundry document id, never derived from the name. */
  static newId(): string {
    return foundry.utils.randomID();
  }

  static clamp(key: TLimitKey, value: unknown, fallback: number): number {
    const number = typeof value === "string" ? parseFloat(value) : value;
    if (typeof number !== "number" || !Number.isFinite(number)) return fallback;
    const { min, max } = REGION_HIGHLIGHT_LIMITS[key];
    return Math.min(max, Math.max(min, number));
  }

  static isPattern(value: unknown): value is TRegionHighlightPattern {
    return typeof value === "string" && (REGION_HIGHLIGHT_PATTERNS as readonly string[]).includes(value);
  }

  /** A complete, in-range profile from partial or untrusted data, filling gaps from `base`. */
  static normalize(data: Partial<IRegionHighlightProfile>, base?: IRegionHighlightProfile): IRegionHighlightProfile {
    const fallback = base ?? BUILTIN_REGION_HIGHLIGHT_PROFILES[0];
    const name = typeof data.name === "string" && data.name.trim() ? data.name.trim() : fallback.name;
    const id = typeof data.id === "string" && data.id.trim() ? data.id.trim() : RegionHighlightProfiles.newId();
    const color = typeof data.color === "string" && data.color.trim() ? data.color.trim() : null;
    return {
      id,
      name,
      pattern: RegionHighlightProfiles.isPattern(data.pattern) ? data.pattern : fallback.pattern,
      opacity: RegionHighlightProfiles.clamp("opacity", data.opacity, fallback.opacity),
      spacing: RegionHighlightProfiles.clamp("spacing", data.spacing, fallback.spacing),
      thickness: RegionHighlightProfiles.clamp("thickness", data.thickness, fallback.thickness),
      edgeWidth: RegionHighlightProfiles.clamp("edgeWidth", data.edgeWidth, fallback.edgeWidth),
      dashed: RegionHighlightProfiles.dashedValue(data.dashed) ?? fallback.dashed,
      dashLength: RegionHighlightProfiles.clamp("dashLength", data.dashLength, fallback.dashLength),
      angle: RegionHighlightProfiles.clamp("angle", data.angle, fallback.angle),
      border: RegionHighlightProfiles.borderValue(data.border) ?? fallback.border,
      borderWidth: RegionHighlightProfiles.clamp("borderWidth", data.borderWidth, fallback.borderWidth),
      color,
      builtin: RegionHighlightProfiles.isBuiltinId(id),
    };
  }

  /**
   * Merge a region's or behavior's choice over its profile. Null when nothing is chosen
   * or the profile no longer exists, in which case the region keeps Foundry's own look.
   */
  static resolve(flag: IRegionHighlightFlag | null | undefined): IRegionHighlightStyle | null {
    if (!flag || typeof flag !== "object") return null;
    const profile = RegionHighlightProfiles.get(flag.profile);
    if (!profile) {
      if (flag.profile)
        logger.debug(`Region highlight profile "${flag.profile}" is not defined; using the Foundry look`);
      return null;
    }
    const color = typeof flag.color === "string" && flag.color.trim() ? flag.color.trim() : profile.color;
    return {
      profile: profile.id,
      pattern: RegionHighlightProfiles.isPattern(flag.pattern) ? flag.pattern : profile.pattern,
      opacity: RegionHighlightProfiles.clamp("opacity", flag.opacity, profile.opacity),
      spacing: RegionHighlightProfiles.clamp("spacing", flag.spacing, profile.spacing),
      thickness: RegionHighlightProfiles.clamp("thickness", flag.thickness, profile.thickness),
      edgeWidth: RegionHighlightProfiles.clamp("edgeWidth", flag.edgeWidth, profile.edgeWidth),
      dashed: RegionHighlightProfiles.dashedValue(flag.dashed) ?? profile.dashed,
      dashLength: RegionHighlightProfiles.clamp("dashLength", flag.dashLength, profile.dashLength),
      angle: RegionHighlightProfiles.clamp("angle", flag.angle, profile.angle),
      border: RegionHighlightProfiles.borderValue(flag.border) ?? profile.border,
      borderWidth: RegionHighlightProfiles.clamp("borderWidth", flag.borderWidth, profile.borderWidth),
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
    return RegionHighlightProfiles.tristate(value, "dashed", "continuous");
  }

  static borderValue(value: unknown): boolean | null {
    return RegionHighlightProfiles.tristate(value, "border", "none");
  }

  static async #write(store: Record<string, IRegionHighlightProfile>): Promise<void> {
    const persisted: Record<string, Omit<IRegionHighlightProfile, "builtin">> = {};
    for (const [id, profile] of Object.entries(store)) {
      const { builtin: _builtin, ...rest } = profile;
      persisted[id] = rest;
    }
    await utils.setSetting(SETTING, persisted);
  }

  /** Create or replace a profile (a shipped id becomes a stored override). */
  static async save(data: Partial<IRegionHighlightProfile>): Promise<IRegionHighlightProfile> {
    const base = RegionHighlightProfiles.get(data.id) ?? undefined;
    const profile = RegionHighlightProfiles.normalize(data, base);
    const store = RegionHighlightProfiles.stored();
    store[profile.id] = profile;
    await RegionHighlightProfiles.#write(store);
    logger.info(`Saved region highlight profile "${profile.name}" (${profile.id})`);
    return profile;
  }

  /** Delete a custom profile, or drop the stored override of a shipped one (restoring it). */
  static async remove(id: string): Promise<void> {
    const store = RegionHighlightProfiles.stored();
    if (!(id in store)) return;
    delete store[id];
    await RegionHighlightProfiles.#write(store);
    logger.info(`Removed region highlight profile ${id}`);
  }
}
