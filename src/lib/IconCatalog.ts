import { createRanker, queryTokens } from "./IconCatalogSearch.mjs";
import { stableSystemIcons } from "../config/systemIcons";

let catalogue: Promise<IIconCatalogEntry[]> | null = null;
const ranks = new WeakMap<IIconCatalogEntry[], ReturnType<typeof createRanker>>();
const merged = new WeakMap<IIconCatalogEntry[], { key: string; icons: IIconCatalogEntry[] }>();

/** A status as `CONFIG.statusEffects` lists it; only the fields the picker reads. */
interface IStatusEffectEntry {
  id?: string;
  img?: string | null;
  name?: string | null;
}

/** Download metadata only when a picker first opens; images load with visible thumbnails. */
export function loadIconCatalog(): Promise<IIconCatalogEntry[]> {
  catalogue ??= fetch("modules/ddb-importer/dist/icon-catalog.json")
    .then(async (response) => {
      if (!response.ok) throw new Error(`Icon catalogue: HTTP ${response.status}`);
      const data = (await response.json()) as { version: number; icons: Omit<IIconCatalogEntry, "id" | "hash">[] };
      if (data.version !== 1 || !Array.isArray(data.icons)) throw new Error("Invalid icon catalogue");
      return data.icons.map((icon) => ({ ...icon, id: icon.path, hash: "" }));
    })
    .catch((error: unknown) => {
      catalogue = null;
      throw error;
    });
  return catalogue;
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
