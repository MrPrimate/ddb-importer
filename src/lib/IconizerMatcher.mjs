// These are split out in pure JS for the icon matcher tool

import { nameString } from "./NameNormalizer.mjs";

/**
 * @typedef {{ name: string, path: string, monster?: string, _iconFile?: string, _iconIndex?: number }} IIconEntry
 * @typedef {{ name?: string | null, type?: string, system?: object,
 * flags?: { ddbimporter?: object } }} IIconDocument
 * @typedef {{ path: string, file: string | null, entryIndex: number, entry: IIconEntry, kind: string }} IIconMatch
 */

/** Offline caches are immutable between saves; runtime caches retain their ordinary live-array behavior.
 * @type {WeakMap<IIconEntry[], { names: string[], prefixes: string[], exact: Map<string, number[]> }>}
 */
const preparedCaches = new WeakMap();

/** @param {string} name */
export function normaliseIconName(name) {
  return nameString(name).toLowerCase();
}

/** Attach provenance to cached entries, never to the persisted mapping files.
 * @param {IIconEntry[]} entries
 * @param {string} file
 */
export function annotateIconEntries(entries, file) {
  return entries.map((entry, index) => ({ ...entry, _iconFile: file, _iconIndex: index }));
}

/** @param {Record<string, IIconEntry[]>} files */
export function buildIconCache(files) {
  return Object.fromEntries(Object.entries(FILE_MAP).map(([type, filesForType]) => {
    const entries = filesForType.flatMap((file) => annotateIconEntries(files[file] ?? [], file));
    const names = entries.map((entry) => normaliseIconName(entry.name));
    /** @type {Map<string, number[]>} */
    const exact = new Map();
    names.forEach((name, index) => {
      if (!exact.has(name)) exact.set(name, []);
      exact.get(name)?.push(index);
    });
    preparedCaches.set(entries, { names, prefixes: names.map((name) => name.split(":")[0].trim()), exact });
    return [type, entries];
  }));
}

/**
 * Resolve the built-in mapping, including the historical first-entry and prefix precedence.
 * Keep this independent of Foundry so the reviewer can prove what a saved mapping will do.
 * @param {IIconDocument} item
 * @param {string} type
 * @param {Record<string, IIconEntry[]>} cache
 * @param {string} [monsterName]
 * @returns {IIconMatch | null}
 */
export function resolveIconMatch(item, type, cache, monsterName = "") {
  const entries = cache[TYPE_MAP[type]];
  if (!entries || !item.name) return null;
  const name = normaliseIconName(item.name);
  const prepared = preparedCaches.get(entries);
  /** @param {(entry: IIconEntry, name: string, index: number) => boolean} predicate @param {string} kind @param {string} [exactName] */
  const find = (predicate, kind, exactName) => {
    const index = prepared && exactName !== undefined
      ? (prepared.exact.get(exactName) ?? []).find((i) => predicate(entries[i], prepared.names[i], i)) ?? -1
      : entries.findIndex((entry, i) => predicate(entry, prepared?.names[i] ?? normaliseIconName(entry.name), i));
    if (index < 0) return null;
    const entry = entries[index];
    return { path: entry.path, file: entry._iconFile ?? null, entryIndex: entry._iconIndex ?? index, entry, kind };
  };
  const exactName = type === "monster" ? name.split("(")[0].trim() : name;
  let match = find((entry, entryName) => type === "monster"
    ? entryName === exactName
      && !!entry.monster && normaliseIconName(entry.monster) === normaliseIconName(monsterName)
    : entryName === name, type === "monster" ? "monster-exact" : "exact", exactName);
  if (match) return match;
  if (type === "monster") {
    match = find((entry, entryName) => !entry.monster && entryName === name, "generic-monster-exact", name)
      ?? find((_entry, entryName) => entryName === name, "other-monster-exact", name);
    if (match) return match;
  }
  const flags = item.flags?.ddbimporter;
  const originalName = flags && "originalName" in flags && typeof flags.originalName === "string" ? flags.originalName : "";
  if (originalName) {
    const original = normaliseIconName(originalName);
    match = find((_entry, entryName) => entryName === original, "original-name", original);
    if (match) return match;
  }
  if (item.name.includes(":")) {
    const parts = name.split(":");
    match = find((_entry, entryName) => entryName === parts[1].trim(), "colon-suffix", parts[1].trim())
      ?? find((_entry, entryName) => entryName === parts[0].trim(), "colon-prefix", parts[0].trim());
    if (match) return match;
  }
  const prefix = name.split(":")[0].trim();
  match = find((_entry, entryName, i) => prefix.startsWith(prepared?.prefixes[i] ?? entryName.split(":")[0].trim()), "entry-prefix")
    ?? find((_entry, entryName, i) => (prepared?.prefixes[i] ?? entryName.split(":")[0].trim()).startsWith(prefix), "item-prefix");
  if (match) return match;
  if (item.type === "subclass" && item.system && "classIdentifier" in item.system && typeof item.system.classIdentifier === "string") {
    const className = normaliseIconName(item.system.classIdentifier);
    return find((_entry, entryName) => entryName.startsWith(className), "subclass");
  }
  return null;
}

/** Match the same monster-first branch used by Iconizer._copyInbuiltIcons.
 * @param {IIconDocument} item
 * @param {Record<string, IIconEntry[]>} cache
 * @param {string} [monsterName]
 */
export function resolveDocumentIcon(item, cache, monsterName = "") {
  const monster = monsterName && item.type !== "spell" ? resolveIconMatch(item, "monster", cache, monsterName) : null;
  return monster?.path ? monster : resolveIconMatch(item, item.type ?? "undefined", cache);
}

/** @type {Record<string, string>} */
export const TYPE_MAP = {
  items: "items",
  weapons: "items",
  weapon: "items",
  item: "items",
  equipment: "items",
  consumable: "items",
  tool: "items",
  loot: "items",
  container: "items",
  inventory: "items",
  spells: "spells",
  spell: "spells",
  feats: "feats",
  feat: "feats",
  classes: "classes",
  class: "classes",
  subclass: "classes",
  monster: "monster",
  summons: "monster",
  summon: "monster",
  backgrounds: "backgrounds",
  background: "backgrounds",
  traits: "traits",
  races: "races",
  race: "races",
  tattoo: "items",
  "dnd-tashas-cauldron.tattoo": "items",
  vehicle: "vehicle",
  character: "character",
  npc: "npc",
  table: "table",
  rolltable: "table",
  journal: "journal",
  macro: "macro",
  undefined: "null",
  null: "null",
};

/** @type {Record<string, string[]>} */
export const FILE_MAP = {
  null: [],
  character: [],
  npc: [],
  vehicle: [],
  table: [],
  macro: [],
  journal: [],
  items: ["items.json", "class-features.json", "races.json"],
  traits: ["class-features.json", "races.json", "general.json", "items.json"],
  spells: ["spells.json"],
  races: ["races.json"],
  feats: ["feats.json", "class-features.json", "races.json", "general.json"],
  classes: ["classes.json"],
  monster: ["named-monster-features.json", "generic-monster-features.json", "spells.json", "items.json", "general.json"],
  backgrounds: ["backgrounds.json", "feats.json", "class-features.json", "races.json", "general.json"],
};
