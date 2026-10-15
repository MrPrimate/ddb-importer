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

/** 2014 horns summon dice of berserkers, 2024 horns a fixed number of spirits; reusable after 7 days. */
const HORN = (metal: string, count2014: string, count2024: string): ISRDItemSummon => ({
  match: `Horn of Valhalla (${metal})`,
  activityName: "Summon Warriors",
  placement: "primary",
  reuseDays: 7,
  profiles: [{ creature: "Berserker", count: count2014, count2024 }],
});

/**
 * Items whose use places an SRD creature or object. `match` is a substring of the item's DDB
 * name and the first entry that matches wins (findSRDItemSummon), so an entry for a specific
 * variant must come before any entry whose match is a shorter part of the same name.
 */
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
    aura: {
      name: "Goat of Terror",
      size: "30",
      affects: "enemy",
      events: ["tokenTurnStart"],
      save: { ability: ["wis"], dc: "15" },
      status: "Frightened",
      durationSeconds: 60,
      condition: "While riding the Goat of Terror; place the aura on the goat's token",
    },
  },
  ONE("(Marble Elephant)", "Become Elephant", "Elephant"),
  ONE("(Obsidian Steed)", "Become Nightmare", "Nightmare"),
  ONE("(Onyx Dog)", "Become Mastiff", "Mastiff"),
  ONE("(Serpentine Owl)", "Become Giant Owl", "Giant Owl"),
  ONE("(Silver Raven)", "Become Raven", "Raven"),
  BAG("Gray Bag of Tricks", ["Weasel", "Giant Rat", "Badger", "Boar", "Panther", "Giant Badger", "Dire Wolf", "Giant Elk"]),
  BAG("Rust Bag of Tricks", ["Rat", "Owl", "Mastiff", "Goat", "Giant Goat", "Giant Boar", "Lion", "Brown Bear"]),
  BAG("Tan Bag of Tricks", ["Jackal", "Ape", "Baboon", "Axe Beak", "Black Bear", "Giant Weasel", "Giant Hyena", "Tiger"]),
  HORN("Silver", "2d4 + 2", "2"),
  HORN("Brass", "3d4 + 3", "3"),
  HORN("Bronze", "4d4 + 4", "4"),
  HORN("Iron", "5d4 + 5", "5"),
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
  // "it can't be summoned again for 24 hours"
  { ...ONE("Ring of Djinni Summoning", "Summon Djinni", "Djinni"), reuseDays: 1 },
  {
    match: "Manual of Golems",
    activityName: "Create Golem",
    placement: "additional",
    activationType: "special",
    profiles: [{ creature: "Clay Golem" }, { creature: "Flesh Golem" }, { creature: "Iron Golem" }, { creature: "Stone Golem" }],
  },
  {
    match: "Hat of Vermin",
    activityName: "Summon Vermin",
    placement: "primary",
    // the creature tries to get away from you and is not under your control
    uncontrolled: true,
    duration: { value: "1", units: "hour" },
    profiles: [{ creature: "Bat" }, { creature: "Frog" }, { creature: "Rat" }],
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
  {
    // The Magus Class: one Dust Mephit per charge spent, up to the level of the spell cast through the vial
    match: "Restless Cremains",
    activityName: "Summon Dust Mephits",
    placement: "primary",
    profiles: [{ creature: "Dust Mephit", count: "@scaling" }],
    chargesPerCreature: { max: "9" },
    activationCondition: "You cast a spell using the vial as a Spellcasting Focus; spend charges up to the spell's level",
    duration: { value: "10", units: "minute" },
  },
  { match: "Dancing Sword", activityName: "Activate Sword", placement: "additional", activationType: "bonus", profiles: [{ object: "SRDObjectDancingSword" }] },
];

/** The summon an item's DDB name maps to, if any: the first table entry its name contains. */
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
