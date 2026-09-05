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
