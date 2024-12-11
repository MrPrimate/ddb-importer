export const PARSING_FEATURES = {
  LEGACY_SKIPPED_FEATURES: [
    "Hit Points",
    "Languages",
    "Bonus Proficiency",
    "Bonus Proficiencies",
    "Speed",
    "Skills",
    "Feat",
    "Creature Type",
  ],
  SKIPPED_FEATURES_2014: [
    "Primal Knowledge",
  ],
  TASHA_VERSATILE: [
    "Martial Versatility",
    "Bardic Versatility",
    "Cantrip Versatility",
    "Sorcerous Versatility",
    "Eldritch Versatility",
  ],
  SKIPPED_FEATURES: [
    "Equipment",
    "Expertise",
    "Darkvision",
    "Core Barbarian Traits",
    "Core Bard Traits",
    "Core Cleric Traits",
    "Core Druid Traits",
    "Core Fighter Traits",
    "Core Monk Traits",
    "Core Paladin Traits",
    "Core Ranger Traits",
    "Core Rogue Traits",
    "Core Sorcerer Traits",
    "Core Warlock Traits",
    "Core Wizard Traits",
    "Weapon Mastery",
    "Maneuver Options",
    // "Lay On Hands", // 2024
    // "Lay on Hands", // 2014
    "Epic Boon: Choose an Epic Boon feat",
    "Epic Boon",
    "Maneuver: Trip Attack (Dex.)",
    "Maneuver: Disarming Attack (Dex.)",
    "Maneuver: Parry (Dex.)",
    "Maneuver: Menacing Attack (Dex.)",
    "Elven Lineage Spells",
    "Gnomish Lineage Spells",
    "Fiendish Legacy Spells",
    "Keen Senses",
  ],
  SKIPPED_FEATURES_STARTS_WITH: [
    "Metamagic Options:",
    "Weapon Mastery -",
    "Expertise",
    "Size",
    "Proficiencies",
    // "Skills",
  ],
  SKIPPED_FEATURES_ENDS_WITH: [
    "Subclass",
    // " Weapon Mastery",
  ],
  SKIPPED_FEATURES_INCLUDES: [
    "Ability Score",
  ],
  // if there are duplicate name entries in your feature use this, due to multiple features in builder
  // and sheet with different descriptions.
  // you may also wish to exclude features that have the leveled information repeated
  FORCE_DUPLICATE_FEATURE: [
    "Blessed Strikes",
    "Wrath of the Sea",
    "Elemental Attunement",
    "Living Legend",
    "Elder Champion",
    "Defensive Tactics",
    "Innate Sorcery",
    "Magical Secrets",
    "Infernal Majesty",
  ],
  FORCE_DUPLICATE_OVERWRITE: [
    "Trance of Order",
  ],
};

export const PARSING_CHOICE_FEATURES = {
  KEEP_CHOICE_FEATURE: [
    "Aspect of the Wilds",
    "Blessed Strikes",
    "Circle of the Land Spells",
    "Defensive Tactics",
    "Divine Order",
    "Elemental Fury",
    "Fighting Style",
    "Genie's Vessel",
    "Hunter's Prey",
    "Mantle of Majesty",
    "Power of the Wilds",
    "Primal Order",
    "The Third Eye",
    "Unbreakable Majesty",
  ],
  KEEP_CHOICE_FEATURE_NAME: [
    "Defensive Tactics",
    "Druidic Warrior",
    "Hunter's Prey",
    "Mantle of Majesty",
    "Pact Boon",
    "Primal Companion",
    "The Third Eye",
    "Unbreakable Majesty",
  ],
  KEEP_CHOICE_FEATURE_NAME_STARTSWITH: [
    "Boon of ",
  ],
  NO_FEATURE_PREFIX_NAME: [
    "Rune Carver",
  ],
  NO_CHOICE_BUILD: [
    "Aspect of the Wilds",
    "Boon of Energy Resistance",
    "Charger",
    "Circle of the Land Spells",
    "Crusher",
    "Deft Explorer",
    "Dual Wielder",
    "Elemental Adept",
    "Elemental Affinity",
    "Elven Lineage Spells",
    "Fiendish Resilience",
    "Gnomish Lineage Spells",
    "Linguist",
    "Magic Initiate (Cleric)",
    "Magic Initiate (Druid)",
    "Magic Initiate (Sorcerer)",
    "Magic Initiate (Warlock)",
    "Magic Initiate (Wizard)",
    "Magical Secrets",
    "Mantle of Majesty",
    "Metamagic Options",
    "Musician",
    "Nature's Ward",
    "Piercer",
    "Poisoner",
    "Power of the Wilds",
    "Primal Knowledge",
    "Rune Shaper",
    "Shadow Touched",
    "Shadow-Touched",
    "Slasher",
    "Telekinetic",
    "Telepathic",
    "The Third Eye",
    "Thieves' Cant",
    "Unbreakable Majesty",
    "Forked Tongue",
  ],
  NO_CHOICE_SECRET: [
    "Divine Order",
    "Divine Order: Protector",
    "Divine Order: Thaumaturge",
    "Improved Blessed Strikes: Divine Strike",
    "Improved Blessed Strikes: Potent Spellcasting",
    "Improved Blessed Strikes",
    "Circle of the Land Spells",
    "Primal Order",
    "Elemental Fury",
    "Improved Elemental Fury",
    "Improved Elemental Fury: Potent Spellcasting",
    "Improved Elemental Fury: Primal Strike",
    "Hunter's Prey",
    "Defensive Tactics",
    "Elven Lineage",
  ],
  USE_ALL_CHOICES: [
  ],
  USE_CHOSEN_ONLY: [
    "Elven Lineage",
  ],
  NO_CHOICE_ACTIVITY: [
    "Mystic Arcanum (",
  ],
  NO_CHOICE_DESCRIPTION_ADDITION: [
    "Aspect of the Wilds",
    "Breath Weapon (Acid)",
    "Breath Weapon (Cold)",
    "Breath Weapon (Fire)",
    "Breath Weapon (Lightning)",
    "Breath Weapon (Poison)",
    "Breath Weapon",
    "Charger",
    "Crusher",
    "Deft Explorer",
    "Dual Wielder",
    "Eldritch Invocations",
    "Elemental Affinity",
    "Elven Lineage Spells",
    "Giant Ancestry",
    "Gnomish Lineage Spells",
    "Gnomish Lineage",
    "Improved Elemental Fury: Potent Spellcasting",
    "Improved Elemental Fury: Primal Strike",
    "Improved Elemental Fury",
    "Linguist",
    "Magical Secrets",
    "Mantle of Majesty",
    "Nature's Ward",
    "Otherworldly Glamour",
    "Piercer",
    "Poisoner",
    "Power of the Wilds",
    "Rune Carver",
    "Rune Shaper",
    "Slasher",
    "Thieves' Cant",
    "Unbreakable Majesty",
    "Forked Tongue",
    "Asmodeus's Blessing",
    "Interdict Boons",
    "Terrorizing Force",
  ],
};
