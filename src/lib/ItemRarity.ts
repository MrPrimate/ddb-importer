/**
 * Item rarity helpers for dnd5e 6.0, where `system.rarity` became the set `system.rarities` and
 * `rarity` is only a runtime getter (the first member, undefined when empty).
 *
 * This file is a leaf on purpose: it is read from enrichers, lib and the muncher, and must never
 * pull the enricher tree in behind it.
 */

/** A loosely typed `system` block as found on a parsed item, a live document or a compendium index entry. */
export interface IRaritySystemLike {
  rarities?: Iterable<string> | null;
  rarity?: string | null;
}

export class ItemRarity {
  /** DDB display labels to dnd5e rarity keys. "Varies" and "Unknown Rarity" have no key any more. */
  static DDB_RARITY_KEYS: Record<string, TItemRarity> = {
    "Common": "common",
    "Uncommon": "uncommon",
    "Rare": "rare",
    "Very Rare": "veryRare",
    "Legendary": "legendary",
    "Artifact": "artifact",
  };

  /** dnd5e rarity keys from lowest to highest; the order a rarities set is emitted in. */
  static TIER_ORDER: TItemRarity[] = ["common", "uncommon", "rare", "veryRare", "legendary", "artifact"];

  /** A DDB label or dnd5e key in any casing ("Very rare", "veryRare", "VERY RARE") to its key. */
  static fromLabel(raw: string | null | undefined): TItemRarity | undefined {
    if (!raw) return undefined;
    const collapsed = raw.trim().replace(/\s+/g, "").toLowerCase();
    return ItemRarity.TIER_ORDER.find((key) => key.toLowerCase() === collapsed);
  }

  /** Dedupe and order keys by tier, dropping anything that is not a dnd5e rarity key. */
  static sort(keys: Iterable<string>): TItemRarity[] {
    const wanted = new Set(keys);
    return ItemRarity.TIER_ORDER.filter((key) => wanted.has(key));
  }

  /**
   * Convert DDB's rarity label into the dnd5e rarity set. Non-magical "Common" gear is mundane and
   * carries no rarity, matching the pre-6.0 import behaviour.
   */
  static fromDDB(raw: string | null | undefined, magic: boolean): TItemRarity[] {
    if (!raw) return [];
    if (raw === "Common" && !magic) return [];
    const key = ItemRarity.DDB_RARITY_KEYS[raw.trim()];
    return key ? [key] : [];
  }

  /**
   * Rarity tiers named by an item's own description: the values of any table column headed
   * "Rarity" (Potion of Healing, Spell Scroll, Belt of Giant Strength) plus parenthesised tiers in
   * prose ("1d4 + 3 (rare), 1d6 + 4 (very rare)", "Magentan Sun-Saw (Uncommon)"). Regex on the
   * HTML rather than a DOM walk so this stays usable outside a browser.
   */
  static fromDescription(description: string | null | undefined): TItemRarity[] {
    if (!description) return [];
    const found = new Set<TItemRarity>();
    const cellText = (cell: string) => ItemRarity.#stripHtml(cell);
    for (const table of description.match(/<table[\s\S]*?<\/table>/gi) ?? []) {
      const [header, ...body] = table.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
      if (!header || body.length === 0) continue;
      const cells = (row: string) => (row.match(/<t[hd][\s\S]*?<\/t[hd]>/gi) ?? []).map(cellText);
      const column = cells(header).findIndex((text) => text.toLowerCase() === "rarity");
      if (column < 0) continue;
      for (const row of body) {
        const value = cells(row)[column];
        const key = ItemRarity.fromLabel(value?.match(/^(very rare|common|uncommon|rare|legendary|artifact)\b/i)?.[1]);
        if (key) found.add(key);
      }
    }
    const prose = ItemRarity.#stripHtml(description);
    for (const match of prose.matchAll(/\((?:[^()]*?,\s*)?(very rare|common|uncommon|rare|legendary|artifact)\)/gi)) {
      const key = ItemRarity.fromLabel(match[1]);
      if (key) found.add(key);
    }
    return ItemRarity.sort(found);
  }

  /**
   * Rarity tiers of the concrete variants that sit beside a "Varies" family root in the same
   * payload: "Figurine of Wondrous Power (Bronze Griffon)", "Horn of Valhalla (Iron)",
   * "Banjo of Ol' Jericho Sticks, +3", or a same-named entry with a real rarity. A root that is
   * itself suffixed ("Potion of Healing (Normal)") matches on the name before the suffix.
   */
  static fromSiblings(
    name: string | null | undefined,
    definitions: Iterable<{ name?: string | null; rarity?: string | null } | null | undefined>,
  ): TItemRarity[] {
    const trimmed = name?.trim();
    if (!trimmed) return [];
    const base = trimmed.replace(/\s*\([^()]*\)\s*$/, "");
    const found = new Set<TItemRarity>();
    for (const definition of definitions) {
      const sibling = definition?.name?.trim();
      if (!sibling) continue;
      const related = sibling === base
        || sibling.startsWith(`${base} (`)
        || sibling.startsWith(`${base}, `)
        || sibling.startsWith(`${base} +`);
      if (!related) continue;
      const key = ItemRarity.fromLabel(definition?.rarity);
      if (key) found.add(key);
    }
    return ItemRarity.sort(found);
  }

  /**
   * The rarity set for a DDB "Varies" item: everything its description and its batch siblings name.
   * A single tier is weaker evidence than DDB's own "Varies" label (a lone "(uncommon)" aside, or one
   * variant of several in the batch), so fewer than two tiers yields nothing.
   */
  static forVaries(
    name: string | null | undefined,
    description: string | null | undefined,
    definitions: Iterable<{ name?: string | null; rarity?: string | null } | null | undefined>,
  ): TItemRarity[] {
    const tiers = ItemRarity.sort([...ItemRarity.fromDescription(description), ...ItemRarity.fromSiblings(name, definitions)]);
    return tiers.length >= 2 ? tiers : [];
  }

  static #stripHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim();
  }

  /** Normalise a pre-6.0 `system.rarity` string ("Very Rare", "veryrare") to a dnd5e key shape. */
  static normalizeLegacy(raw: string | null | undefined): string | undefined {
    if (!raw) return undefined;
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const collapsed = trimmed.replace(/\s+/g, "");
    const match = Object.values(ItemRarity.DDB_RARITY_KEYS).find((key) => key.toLowerCase() === collapsed.toLowerCase());
    return match ?? collapsed.charAt(0).toLowerCase() + collapsed.slice(1);
  }

  /**
   * The rarity keys of an item. `rarities` wins whenever it is defined, even when empty: an entry
   * re-munched into an old pack keeps a stale `rarity` alongside the new set, and a compendium index
   * is raw source, so the legacy string must only be consulted when the set is absent altogether.
   */
  static keys(system: IRaritySystemLike | null | undefined): string[] {
    if (!system) return [];
    if (system.rarities !== undefined && system.rarities !== null) {
      return Array.from(system.rarities).filter((r): r is string => typeof r === "string" && r !== "");
    }
    const legacy = ItemRarity.normalizeLegacy(system.rarity);
    return legacy ? [legacy] : [];
  }

  /** The first (lowest) rarity key, mirroring dnd5e's `rarity` getter. */
  static first(system: IRaritySystemLike | null | undefined): string | undefined {
    return ItemRarity.keys(system)[0];
  }

  /** The raw pre-6.0 `system.rarity` string, if the entry still carries one ("varies" lives only here). */
  static legacyString(system: IRaritySystemLike | null | undefined): string | undefined {
    const raw = system?.rarity;
    return typeof raw === "string" && raw.trim() !== "" ? raw : undefined;
  }
}

export default ItemRarity;
