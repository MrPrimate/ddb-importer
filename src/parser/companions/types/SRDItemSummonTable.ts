/**
 * Magic items the dnd5e SRD packs ship with a summon activity, and what each one places. Pure
 * data with no imports: the item enricher reads it to declare the activity and the summons
 * builder reads it to create the actors
 */

const BAG = (match: string, creatures: string[]): ISRDItemSummon => ({
  match,
  activityName: "Pull and Throw",
  placement: "primary",
  profiles: creatures.map((creature) => ({ creature })),
});

const ONE = (match: string, activityName: string, creature: string, count = "1"): ISRDItemSummon => ({
  match,
  activityName,
  placement: "primary",
  profiles: [{ creature, count }],
});

export const SRD_ITEM_SUMMONS: ISRDItemSummon[] = [
  ONE("(Bronze Griffon)", "Become Griffon", "Griffon"),
  ONE("(Ebony Fly)", "Become Giant Fly", "Giant Fly"),
  ONE("(Golden Lions)", "Become Lion", "Lion"),
  {
    match: "(Ivory Goats)",
    activityName: "Become Goat",
    placement: "primary",
    // the Goat of Traveling uses Riding Horse statistics; Travail and Terror are Giant Goats
    profiles: [{ creature: "Riding Horse" }, { creature: "Giant Goat" }],
  },
  ONE("(Marble Elephant)", "Become Elephant", "Elephant"),
  ONE("(Obsidian Steed)", "Become Nightmare", "Nightmare"),
  ONE("(Onyx Dog)", "Become Mastiff", "Mastiff"),
  ONE("(Serpentine Owl)", "Become Giant Owl", "Giant Owl"),
  ONE("(Silver Raven)", "Become Raven", "Raven"),
  BAG("Gray Bag of Tricks", ["Weasel", "Giant Rat", "Badger", "Boar", "Panther", "Giant Badger", "Dire Wolf", "Giant Elk"]),
  BAG("Rust Bag of Tricks", ["Rat", "Owl", "Mastiff", "Goat", "Giant Goat", "Giant Boar", "Lion", "Brown Bear"]),
  BAG("Tan Bag of Tricks", ["Jackal", "Ape", "Baboon", "Axe Beak", "Black Bear", "Giant Weasel", "Giant Hyena", "Tiger"]),
  ONE("Horn of Valhalla (Silver)", "Summon Warriors", "Berserker", "2d4 + 2"),
  ONE("Horn of Valhalla (Brass)", "Summon Warriors", "Berserker", "3d4 + 3"),
  ONE("Horn of Valhalla (Bronze)", "Summon Warriors", "Berserker", "4d4 + 4"),
  ONE("Horn of Valhalla (Iron)", "Summon Warriors", "Berserker", "5d4 + 5"),
  ONE("Elemental Gem (Blue Sapphire)", "Summon Elemental", "Air Elemental"),
  ONE("Elemental Gem (Emerald)", "Summon Elemental", "Water Elemental"),
  ONE("Elemental Gem (Red Corundum)", "Summon Elemental", "Fire Elemental"),
  ONE("Elemental Gem (Yellow Diamond)", "Summon Elemental", "Earth Elemental"),
  {
    match: "Elemental Gem",
    activityName: "Summon Elemental",
    placement: "primary",
    profiles: [{ creature: "Air Elemental" }, { creature: "Water Elemental" }, { creature: "Fire Elemental" }, { creature: "Earth Elemental" }],
  },
  ONE("Bowl of Commanding Water Elementals", "Summon Elemental", "Water Elemental"),
  ONE("Brazier of Commanding Fire Elementals", "Summon Elemental", "Fire Elemental"),
  ONE("Censer of Controlling Air Elementals", "Summon Elemental", "Air Elemental"),
  ONE("Stone of Controlling Earth Elementals", "Summon Elemental", "Earth Elemental"),
  ONE("Feather Token (Bird)", "Summon Roc", "Roc"),
  { match: "Feather Token (Whip)", activityName: "Create Whip", placement: "additional", profiles: [{ object: "SRDObjectFloatingWhip" }] },
  ONE("Efreeti Bottle", "Release Efreeti", "Efreeti"),
  ONE("Ring of Djinni Summoning", "Summon Djinni", "Djinni"),
  {
    match: "Manual of Golems",
    activityName: "Create Golem",
    placement: "additional",
    activationType: "special",
    profiles: [{ creature: "Clay Golem" }, { creature: "Flesh Golem" }, { creature: "Iron Golem" }, { creature: "Stone Golem" }],
  },
  { match: "Pipes of the Sewers", activityName: "Call Swarm of Rats", placement: "additional", activationType: "bonus", profiles: [{ creature: "Swarm of Rats" }] },
  { match: "Staff of the Python", activityName: "Transform into Snake", placement: "additional", profiles: [{ creature: "Giant Constrictor Snake" }] },
  {
    match: "Carpet of Flying",
    activityName: "Activate Carpet",
    placement: "primary",
    profiles: [{ object: "SRDObjectCarpetOfFlying3x5" }, { object: "SRDObjectCarpetOfFlying4x6" }, { object: "SRDObjectCarpetOfFlying5x7" }, { object: "SRDObjectCarpetOfFlying6x9" }],
  },
  { match: "Folding Boat", activityName: "Unfold Boat", placement: "primary", profiles: [{ object: "SRDObjectRowboat" }, { object: "SRDObjectKeelboat" }] },
  { match: "Deck of Illusions", activityName: "Draw Card", placement: "primary", profiles: [{ object: "SRDObjectIllusoryCreature" }] },
  { match: "Iron Flask", activityName: "Release Creature", placement: "additional", profiles: [], blankProfile: true },
  { match: "Dancing Sword", activityName: "Activate Sword", placement: "additional", activationType: "bonus", profiles: [{ object: "SRDObjectDancingSword" }] },
];

/** The summon an item's DDB name maps to, if any. */
export function findSRDItemSummon(name: string | null | undefined): ISRDItemSummon | null {
  if (!name) return null;
  return SRD_ITEM_SUMMONS.find((entry) => name.includes(entry.match)) ?? null;
}

/**
 * Creatures DDB publishes once for both rulesets. They parse to a single actor, so they take a
 * single key: a key per ruleset would give two keys fighting over one compendium document.
 */
const SINGLE_PRINTING = ["Giant Fly"];

/** The key a summoned SRD creature is stored under, shared by every spell and item that calls it. */
export function srdCreatureKey(name: string, is2014: boolean): string {
  const rules = SINGLE_PRINTING.includes(name) ? "" : (is2014 ? "2014" : "2024");
  return `SRDCreature${name.replaceAll(" ", "")}${rules}`;
}

/**
 * Keys these creatures were stored under before they moved to the shared `SRDCreature` keys. The
 * summons compendium ids an actor by name and ruleset, so a world that munched under an old key
 * already holds the document the new key wants; with "update existing" off it is never rewritten
 * and keeps its old key. The summons manager reads this to re-key such a document and to resolve
 * a profile against it meanwhile.
 */
const LEGACY_SUMMON_KEYS: Record<string, string[]> = {
  SRDCreatureWarhorse2014: ["FindSteedWarhorse2014"],
  SRDCreaturePony2014: ["FindSteedPony2014"],
  SRDCreatureCamel2014: ["FindSteedCamel2014"],
  SRDCreatureElk2014: ["FindSteedElk2014"],
  SRDCreatureMastiff2014: ["FindSteedMastiff2014"],
  SRDCreatureGiantCentipede2014: ["GiantInsectGiantCentipede2014"],
  SRDCreatureGiantSpider2014: ["GiantInsectGiantSpider2014"],
  SRDCreatureGiantWasp2014: ["GiantInsectGiantWasp2014"],
  SRDCreatureGiantScorpion2014: ["GiantInsectGiantScorpion2014"],
  SRDCreatureGiantFly: ["SRDCreatureGiantFly2014", "SRDCreatureGiantFly2024"],
};

/** Older keys the same summoned actor may still be stored under; empty for most keys. */
export function legacySummonKeys(key: string): string[] {
  return LEGACY_SUMMON_KEYS[key] ?? [];
}
