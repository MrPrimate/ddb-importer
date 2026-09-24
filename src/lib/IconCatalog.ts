import { createRanker, queryTokens } from "./IconCatalogSearch.mjs";
import { stableSystemIcons } from "../config/systemIcons";
import logger from "./Logger";
import utils from "./Utils";

/** Hidden world setting: extra icon lists (JSON files under the Foundry data root, or URLs). */
export const CUSTOM_ICON_CATALOGS_SETTING = "icon-catalog-custom-paths";

let catalogue: { key: string; icons: Promise<IIconCatalogEntry[]> } | null = null;
const ranks = new WeakMap<IIconCatalogEntry[], ReturnType<typeof createRanker>>();
const merged = new WeakMap<IIconCatalogEntry[], { key: string; icons: IIconCatalogEntry[] }>();

/** A status as `CONFIG.statusEffects` lists it; only the fields the picker reads. */
interface IStatusEffectEntry {
  id?: string;
  img?: string | null;
  name?: string | null;
}

/** One image in a user-supplied icon list: a bare path, or a path with optional name and tags. */
type TCustomIconEntry = string | { path?: unknown; name?: unknown; tags?: unknown; manual?: unknown };

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

/**
 * The entries of a user icon list. Accepts the shipped catalogue shape (`{ version, icons }`) or a
 * bare array; each entry is a path string or `{ path, name?, tags?, manual? }`. A missing name
 * comes from the file name, as the shipped catalogue's do; malformed entries are skipped.
 */
export function customCatalogIcons(data: unknown): IIconCatalogEntry[] {
  const list: unknown = Array.isArray(data) ? data : (data as { icons?: unknown } | null)?.icons;
  if (!Array.isArray(list)) throw new Error("expected an array of icons, or an object with an icons array");
  return (list as TCustomIconEntry[]).flatMap((entry) => {
    const record = typeof entry === "string" ? { path: entry } : entry;
    const path = typeof record?.path === "string" ? record.path.trim() : "";
    if (!path) return [];
    const file = path.split(/[?#]/)[0].split("/").pop() ?? path;
    const derived = file.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
    const name = typeof record.name === "string" && record.name.trim() ? record.name.trim() : derived;
    return [{ id: path, path, name, hash: "", tags: strings(record.tags), inferred: [], manual: strings(record.manual) }];
  });
}

/** User lists extend the shipped catalogue; a path already listed gains the extra name and tags. */
export function mergeIconLists(base: IIconCatalogEntry[], extras: IIconCatalogEntry[][]): IIconCatalogEntry[] {
  const entries = new Map(base.map((icon) => [icon.path, icon]));
  for (const icon of extras.flat()) {
    const existing = entries.get(icon.path);
    entries.set(
      icon.path,
      existing
        ? {
          ...existing,
          tags: [...new Set([...existing.tags, ...icon.tags, ...queryTokens(icon.name)])],
          manual: [...new Set([...existing.manual, ...icon.manual])],
        }
        : icon,
    );
  }
  return [...entries.values()];
}

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function loadShippedCatalog(): Promise<IIconCatalogEntry[]> {
  const data = (await fetchJson("modules/ddb-importer/dist/icon-catalog.json")) as {
    version: number;
    icons: Omit<IIconCatalogEntry, "id" | "hash">[];
  };
  if (data.version !== 1 || !Array.isArray(data.icons)) throw new Error("Invalid icon catalogue");
  return data.icons.map((icon) => ({ ...icon, id: icon.path, hash: "" }));
}

/** A broken user list is reported and skipped, never taking the shipped icons down with it. */
async function loadCustomCatalog(path: string): Promise<IIconCatalogEntry[]> {
  try {
    return customCatalogIcons(await fetchJson(path));
  } catch (error) {
    logger.warn(`Unable to load the custom icon list ${path}`, { error });
    ui.notifications.warn(
      game.i18n.format("ddb-importer.behaviors.display.texture.customCatalogError", {
        path,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return [];
  }
}

/** The custom list paths from the hidden setting, trimmed and de-duplicated. */
export function customCatalogPaths(value: unknown): string[] {
  return [...new Set(strings(value).map((path) => path.trim()).filter(Boolean))];
}

/**
 * Download metadata only when a picker first opens; images load with visible thumbnails. The
 * result is cached until the custom list setting changes.
 */
export function loadIconCatalog(): Promise<IIconCatalogEntry[]> {
  const paths = customCatalogPaths(utils.getSetting<string[]>(CUSTOM_ICON_CATALOGS_SETTING));
  const key = JSON.stringify(paths);
  if (catalogue?.key === key) return catalogue.icons;
  const icons = Promise.all([loadShippedCatalog(), Promise.all(paths.map(loadCustomCatalog))])
    .then(([base, extras]) => mergeIconLists(base, extras))
    .catch((error: unknown) => {
      if (catalogue?.icons === icons) catalogue = null;
      throw error;
    });
  catalogue = { key, icons };
  return icons;
}

/** Status names come from this world's configuration and may supply additional module artwork. */
export function withStatusIcons(
  icons: IIconCatalogEntry[],
  statuses: Record<string, IStatusEffectEntry> | IStatusEffectEntry[],
  localize: (name: string) => string,
): IIconCatalogEntry[] {
  const entries = new Map(icons.map((icon) => [icon.path, { ...icon }]));
  for (const status of Object.values(statuses)) {
    if (!status.img) continue;
    const name = localize(status.name ?? status.id ?? status.img);
    const tags = [...queryTokens(name), ...queryTokens(status.id)];
    const existing = entries.get(status.img);
    if (existing) {
      entries.set(status.img, { ...existing, status: true, tags: [...existing.tags, ...tags] });
    } else {
      const entry = { id: status.img, path: status.img, name, hash: "", tags, inferred: [], manual: [], status: true };
      entries.set(status.img, entry);
    }
  }
  return [...entries.values()];
}

/** Include system conditions even when hidden from the token HUD or replaced by a module. */
export function withSystemIcons(
  icons: IIconCatalogEntry[],
  localize: (name: string) => string,
  system: ISystemIcon[] = stableSystemIcons({ includeAdditional: true }),
): IIconCatalogEntry[] {
  const entries = new Map(icons.map((icon) => [icon.path, { ...icon }]));
  for (const icon of system) {
    const localized = localize(icon.name);
    const name = localized === icon.name ? (icon.fallbackName ?? icon.name) : localized;
    const existing = entries.get(icon.path);
    const entry: IIconCatalogEntry = existing ?? {
      id: icon.path,
      path: icon.path,
      name,
      hash: "",
      tags: [],
      inferred: [],
      manual: [],
    };
    entry.tags = [...new Set([...entry.tags, ...queryTokens(name), ...queryTokens(icon.id), icon.category])];
    if (icon.category === "damage") {
      entry.damage = true;
    } else {
      entry.status = true;
      entry.dnd5eStatus = true;
    }
    entries.set(icon.path, entry);
  }
  return [...entries.values()];
}

/** Reuse merged metadata and its index across picker windows until system names/artwork change. */
export function pickerIcons(icons: IIconCatalogEntry[]): IIconCatalogEntry[] {
  const system = stableSystemIcons({ includeAdditional: true });
  const key = JSON.stringify([game.i18n.lang, system, CONFIG.statusEffects]);
  const cached = merged.get(icons);
  if (cached?.key === key) return cached.icons;
  const result = withSystemIcons(
    withStatusIcons(icons, CONFIG.statusEffects, (name) => game.i18n.localize(name)),
    (name) => game.i18n.localize(name),
    system,
  );
  merged.set(icons, { key, icons: result });
  return result;
}

/** Build once per catalogue; switching filters reuses all keyword sets and frequencies. */
export function iconSearch(icons: IIconCatalogEntry[], filter: string) {
  const accepts = (icon: IIconCatalogEntry) => {
    if (filter === "status") return Boolean(icon.status);
    if (filter === "damage") return Boolean(icon.damage);
    if (filter === "dnd5eStatus") return Boolean(icon.dnd5eStatus);
    if (filter === "svg") return (/\.svg(?:[?#]|$)/i).test(icon.path);
    return true;
  };
  let rank = ranks.get(icons);
  if (!rank) {
    rank = createRanker({ icons });
    ranks.set(icons, rank);
  }
  return (query: string): { id: string; path: string; name: string; score: number; matched: string[] }[] =>
    rank({ name: query, tags: [], id: "" }, icons.length, query, accepts);
}
