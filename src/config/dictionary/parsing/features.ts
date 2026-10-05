export const LEVEL_SCALE = {
  LEVEL_SCALE_EXCLUSIONS: [
    "Fire Rune",
    "Cloud Rune",
    "Stone Rune",
    "Frost Rune",
    "Hill Rune",
    "Storm Rune",
    "Drake Companion: Summon",
    "Drake Companion: Command",
    "Drake Companion",
    "Launch",
    "Grapple",
    "Shove",
    "Spellfire Burst",
    "Spellfire Burst: Radiant Fire (Fire)",
    "Spellfire Burst: Radiant Fire (Radiant)",
    "Spellfire Burst: Bolstering Flames",
    "Channel Divinity: Arcane Abjuration",
    "Fisticuffs",
    "Compression Lock",
    "Groundwork",
    // Blade Breaker actions whose dice the parent's maneuvers/stances-known count scale replaced
    "Iron Punisher",
    "Iron Tempest (4 points)",
    "Refusal to Bleed (1 point)",
    "Unstoppable Missile: Extra Damage (1 point)",
  ],

  LEVEL_SCALE_INFUSIONS: [
    "Unarmed Strike",
    "Arms of the Astral Self (WIS)",
    "Arms of the Astral Self (DEX)",
    "Arms of the Astral Self (DEX/STR)",
    "Arms of the Astral Self",
    "Body of the Astral Self",
    "Starry Form: Archer",
    "Sneak Attack",
  ],

  NATURAL_WEAPONS: [
    "Bite",
    "Claw",
    "Claws",
    "Cat's Claws",
    "Fangs",
    "Gore",
    "Sting",
    "Talon",
    "Talons",
    "Trunk",
  ],

  SPECIAL_ADVANCEMENTS: {},

  UTILITY_FEATURES: [
    "Channel Divinity:",
    "Maneuver:",
  ],
};

export const PARSING_FEATURES = {
  // Phrases that mark a DDB character-sheet instruction block, removed from every
  // feature description. Keep these specific: "select this option" and "drop down"
  // also appear in real rules text (Armed Combat Lessons, Dark Bargain, Evocation Lessons).
  DDB_SHEET_NOTE_MARKERS: [
    "Deselect",
    "Character Builder",
    "updated the character sheet",
  ],
  LEGACY_SKIPPED_FEATURES: [
    "Hit Points",
    "Languages",
    "Bonus Proficiency",
    "Bonus Proficiencies",
    "Speed",
    "Skills",
    "Feat",
    "Creature Type",
    "Age",
    "Alignment",
    "Blood Hunter Order",
    "Hybrid Transformation Features",
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
    "Core Monster Hunter Traits",
    "Core Artificer Traits",
    "Core Pugilist Traits",
    "Core Gunslinger Traits",
    "Core Kindred Traits",
    "Monster Hunter Subclass: Hunting Guild",
    "Weapon Mastery",
    // "Maneuver Options",
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
    "Roguish Archetype",
    "Tool Proficiency",
    "Tools Proficiency",
    "Skillful",
    "The Crooked Moon: Dark Bargain",
    "Fighting Style feat",
    "Muscle Mass",
    "Werewolf Instincts",
    "Strange Endurance",
  ],
  SKIPPED_FEATURES_STARTS_WITH: [
    "Metamagic Options:",
    "Weapon Mastery -",
    "Expertise",
    "Size",
    "Proficiencies",
    // "Skills",
    "Advanced Enchantments:",
    "Arcane Prototype:",
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
    "Starry Form",
    "Rage",
    "Mantle of Majesty",
    "Unarmored Movement",
    "Brand of Castigation",
    "Noble Scion",
    "Frozen Haunt",
    "Circle Forms",
    "Crown of Spellfire",
    "Bladesong",
    "Brutal Critical",
    "Kensei Weapon",
    "Umbral Form",
    "Form of Dread",
    "Gifts of the Beast",
    "Gangrel Bane",
    "Gifts of Survival",
    "Corporeal Mastery",
    "Protean Rewards",
    "Adaptive Wild Shape",
    "Critical Shot",
    "Travel along the Tree",
  ],
  FORCE_DUPLICATE_OVERWRITE: [
    "Cosmic Omen",
    "Trance of Order",
    "Divine Foreknowledge",
    "Vestige Companion",
  ],
  FORCE_FEATURE_CLASS_MATCH: [
    "Psionic Power",
  ],
  // Container features DDB ships on the character (klass.classFeatures) but leaves out of
  // klass.definition.classFeatures, so deriveFeatures never yields them. Keyed by class name
  // so a shared feature name (Fighter also has "Maneuvers") is not force-included everywhere.
  FORCE_DERIVED_FEATURES: {
    "Gunslinger": [
      "Maneuvers",
    ],
    // AU 2024 Arcane Archer: the options container is in klass.classFeatures but in neither
    // definition list, and it owns the Banishing Shot... choices
    "Fighter": [
      "Arcane Shot Options",
    ],
  } as Record<string, string[]>,
  IGNORED_PARENT_CHOICE_FEATURES: [
    "Dark Bargain",
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
    "Genie's Vessel",
    "Hunter's Prey",
    // "Mantle of Majesty",
    "Power of the Wilds",
    "Primal Order",
    "The Third Eye",
    // "Unbreakable Majesty",
    "Aspect of the Beast",
    "Totem Spirit",
    "Totemic Attunement",
    "Arcane Shot Options",
    "Dark Bargain",
    "Elemental Affinity",
    "Dragon Ancestor",
    "Pact Boon",
    "Fighting Style",
    "Additional Fighting Style",
    // "Draconic Ancestry",
  ],
  KEEP_CHOICE_FEATURE_NAME: [
    "Defensive Tactics",
    "Druidic Warrior",
    "Hunter's Prey",
    // "Mantle of Majesty",
    // "Primal Companion",
    "The Third Eye",
    // "Unbreakable Majesty",
    "Full of Stars",
    "Dragon Ancestor",
    // "Draconic Ancestry",
    "Elegant Courtier",
    "Draconic Disciple",
    // the option child must stay a companion feature by name (companions.ts)
    "Vestige Companion",
  ],
  KEEP_CHOICE_FEATURE_NAME_STARTSWITH: [
    "Boon of ",
  ],
  // A lone DDB option that is really part of its feature (a renamed form or sub-benefit) merges
  // into the parent, which keeps its own name, on character imports and munches alike. DDB ships
  // several of these features twice, so the merged copy needs the parent's name to collapse with
  // the other (otherwise an empty parent sits beside "Feature: Option").
  FOLD_CHOICE_INTO_PARENT: [
    "Bough and Branch",
    "Borrowed Tongues and Hides",
    "Extradimensional Mastery",
    "Frozen Haunt",
    "Martial Sorcery",
    "Primal Symbiote",
    "The Beast",
    "Tokens of the Departed",
    "Wrath of the Wild",
  ],
  // DDB models on/off toggle features as a choice with a single "Activate X" /
  // "Invoke the X" option; building that as a choice just renames the parent to
  // "X: Activate X". Suppress the choice build so the parent imports untouched.
  // Opt out per feature via KEEP_CHOICE_FEATURE.
  SINGLE_CHOICE_TOGGLE_PREFIXES: [
    "Activate ",
    "Invoke the ",
  ],
  // Replace the parent prefix on a choice document, for DDB feature names that are
  // long or repeat the subclass: "Carrion Raven Martial Maneuvers: Apex Dominance"
  // becomes "Maneuver: Apex Dominance". Use NO_FEATURE_PREFIX_NAME to drop it entirely.
  CHOICE_FEATURE_PREFIX_RENAME: {
    "Carrion Raven Martial Maneuvers": "Maneuver",
  } as Record<string, string>,
  NO_FEATURE_PREFIX_NAME: [
    "Rune Carver",
    // AU 2024 Arcane Archer hangs its shot options off the pool feature itself
    "Arcane Shot",
    "Primal Companion",
    "Giant Ancestry",
    "Arcane Shot Options",
    "Pact Boon",
    // "Martial Adept",
    // "Fighting Style",
    // "Additional Fighting Style",
  ],
  // Choice options never built as documents. Most features need no entry: proficiency and
  // spellbook picks, toggles, options restating their feature, feat options that are only picks
  // or a bare ability or damage type, and species options that are a bare ability are derived from
  // DDB's choice data (DDBFeature.suppressesChoiceBuild), and an enricher that models its
  // feature's options sets noChoiceBuild. Entries left here are real options an enricher models,
  // features without fixture coverage, or exceptions to those rules (Signature Spells and Black
  // Magic cast their picks like Mystic Arcanum but import them as spells).
  NO_CHOICE_BUILD: [
    "Circle of the Land Spells",
    // lineage-and-ability options ("Drow Lineage - Charisma"), so the bare ability rule misses them
    "Elven Lineage Spells",
    "Gnomish Lineage Spells",
    // Lycan hybrid form is a Foundry side enchantment toggle, the DDB Hybrid/Normal Form choice
    // sub features would duplicate it (and rename the parent, as it is a single choice)
    "Hybrid Transformation Features",
    "Nature's Ward",
    "Thieves' Cant",
    "Bond of Fang and Scale",
    "Hunter's Prey",
    "Full of Stars",
    "Twinkling Constellations",
    "Elemental Affinity (Fire)",
    "Elemental Affinity (Cold)",
    "Elemental Affinity (Lightning)",
    "Elemental Affinity (Acid)",
    "Elemental Affinity (Poison)",
    // "Draconic Ancestry",
    "Genie's Splendor",
    "Aura of Malevolence",
    "Bestial Instincts",
    "Shifting",
    "Celestial Revelation",
    "Sangromancy Savant",
    "Black Magic",
    "Giant's Power",
    "Metamagic",
    "Stalker's Prowess",
    "Signature Spells",
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
    "Armor Model",
    "Pact Boon",
    "Aspect of the Beast",
    "Arcane Shot Options",
    "Monster Grimoire",
    "Draconic Ancestry",
    "Blessed Strikes",
    "Full of Stars: Archer: Full of Stars",
    "Archer: Full of Stars",
    "Full of Stars",
    "Dragon Ancestor",
    "Draconic Ancestry",
    "Totem Spirit",
    "Totemic Attunement",
    "Variant Tiefling",
    "Genie's Vessel",
    "Reanimator's Skillset",
    "Storm Aura",
    "Vestige Spells",
  ],
  USE_ALL_CHOICES: [
    // "Primal Companion",
  ] as string[],
  USE_CHOSEN_ONLY: [
    "Elven Lineage",
    // "Pact Boon",
    "Dark Bargain",
    // "Variant Tiefling",
    // "Totem Spirit",
    // "Totemic Attunement",
    "Storm Aura",
  ] as string[],
  // Parent features whose DDB description is a dump of every option (e.g. Blood
  // Curses ships all curses). Replace it with the chosen options' own descriptions.
  REPLACE_DESCRIPTION_WITH_CHOICES: [
    "Blood Curses",
  ] as string[],
  NO_CHOICE_ACTIVITY: [
    "Mystic Arcanum (",
    // "Arcane Shot Options",
  ] as string[],
  // Choice options never appended to the parent's description. Class proficiency and spell picks
  // (bare names) and options repeating the parent's text are left out without an entry
  // (DDBFeature.isPickChoice / isChoiceDescriptionRedundant); entries here are judgement calls,
  // mostly options an enricher models or lists too long to append, plus feats and species.
  NO_CHOICE_DESCRIPTION_ADDITION: [
    // the parent's own <ul> already enumerates the options, and each option is
    // built as its own feature by AdaptiveWildShape's parseAllChoiceFeatures
    "Adaptive Wild Shape",
    // the chosen form's spirit stat block; the feature summons all three spirits
    "Semblance of Life",
    "Enchantments",
    "Advanced Enchantments",
    "Aspect of the Wilds",
    "Breath Weapon (Acid)",
    "Breath Weapon (Cold)",
    "Breath Weapon (Fire)",
    "Breath Weapon (Lightning)",
    "Breath Weapon (Poison)",
    "Eldritch Invocations",
    "Improved Elemental Fury: Potent Spellcasting",
    "Improved Elemental Fury: Primal Strike",
    "Improved Elemental Fury",
    "Nature's Ward",
    "Power of the Wilds",
    "Thieves' Cant",
    "Asmodeus's Blessing",
    "Celestial Revelation",
    "Raging Storm",
    "Storm Soul",
    "Drake Companion",
    "Bond of Fang and Scale",
    "Variable Trait",
    // "Maneuver Options",
    "Full of Stars: Archer: Full of Stars",
    "Archer: Full of Stars",
    "Full of Stars",
    "Genie's Splendor",
    "Mutate Shape",
    "Dread Allegiance",
    "Aura of Malevolence",
    "Magic Item Plans",
    "Lorwyn-Shadowmoor Origin",
    "Sangromancy Savant",
    "Fiendish Legacy",
    "Mystic Arcanum",
    "Divine Magic",
    "Giant's Power",
    "Genie Kind",
    "Ghaal'Shaarat",
    "Reanimated Companion",
    "Hybrid Transformation Features",
    "Hybrid Transformation",
    "Hunter's Bane",
    "Brand of Tethering",
    "Dark Augmentation",
    "Brand of Castigation",
    "Stalker's Prowess",
    "Aether Walk",
    "Floral Form",
    "Floral Legacy",
    "Floral Breath Weapon",
    "Floral Fortitude",
    "Transmuter's Stone",
    "Vestige Spells",
  ],
  OVERRIDE_CHOICE_FEATURE: [
    "Eldritch Invocations",
  ],
  DISCARD_CHOICE_FEATURE: [
    "Fighting Style feat",
  ],
  DISCARD_FEATURE_AFTER_CHOICES: [
    "Fighting Style",
    "Additional Fighting Style",
    "Pact Boon",
    "Magic Item Plans",
    // duplicates the Martial Maneuvers rules text verbatim; only its maneuver
    // choices are wanted, and the point pool lives on Martial Maneuvers
    "Carrion Raven Martial Maneuvers",
  ],
  FORCE_FEAT_CHOICES: [
    "Dark Bargain",
  ],
};

// always-prepared feature spells DDB sends only as the feature's slot-less casting: the enricher
// builds that casting, and the spellbook gets a prepared copy that spends slots instead
export const FEATURE_SPELLS_FORCE_PREPARED = [
  "Share the Burden",
];

export const FEATURE_SPELLS_IGNORE = [
  // the chosen arcanum spell is a cast activity on the feature (warlock/MysticArcanum)
  "Mystic Arcanum (6th level)",
  "Mystic Arcanum (7th level)",
  "Mystic Arcanum (8th level)",
  "Mystic Arcanum (9th level)",
  "Mystic Arcanum (Level 6 Spell)",
  "Mystic Arcanum (Level 7 Spell)",
  "Mystic Arcanum (Level 8 Spell)",
  "Mystic Arcanum (Level 9 Spell)",
  // "Mantle of Majesty",
  "Activate Mantle of Majesty",
  "Gaseous Form",
  "Otto's Irresistible Dance",
  "Empty Body",
  "Searing Arc Strike",
  "Bewitching Whispers",
  "Dreadful Word",
  "Armor of Shadows",
  "Ascendant Step",
  "Beast Speech",
  "Eldritch Sight",
  "Chains of Carceri",
  "Far Scribe",
  "Mask of Many Faces",
  "Fiendish Vigor",
  "Gift of the Depths",
  "Master of Myriad Forms",
  "Minions of Chaos",
  "Mire the Mind",
  "Misty Visions",
  "Otherworldly Leap",
  "Sculptor of Flesh",
  "Shroud of Shadow",
  "Sign of Ill Omen",
  "Thief of Five Fates",
  "Trickster's Escape",
  "Undying Servitude",
  "Visions of Distant Realms",
  "Whispers of the Grave",
  "Return to Life",
  "Circle of Mortality",
  "Voice of Death",
  "Spirit Query",
  "Tokens of the Departed",
  "Beasts of Ill Omen",
  "Share the Burden",
  "Spiteful Curse",
  "Shape-Shifter",
  "Wondrous Alteration",
  "Undead Thralls",
  "Phantasmal Creatures",
  "Shapechanger",
  "Faithful Steed",
  "Paladin's Smite",
  "Contact Patron",
  "Steps of the Fey",
  "Fey Reinforcements",
  "Misty Wanderer",
  "Ethereal Step",
  "Dragon Companion",
  "Star Map",
  "Consult the Spirits",
  "Restorative Reagents",
  "Chemical Mastery",
  "Mapping Magic",
  "Superior Atlas",
  "War God's Blessing",
  "Curse Caster",
];

export const IGNORE_SPELLS_GRANTED_BY_CLASS_FEATURES = [
  "Faithful Summons",
  "Searing Arc Strike",
  "Bewitching Whispers",
  "Dreadful Word",
  "Armor of Shadows",
  "Ascendant Step",
  "Beast Speech",
  "Eldritch Sight",
  "Chains of Carceri",
  "Far Scribe",
  "Fiendish Vigor",
  "Gift of the Depths",
  "Mask of Many Faces",
  "Master of Myriad Forms",
  "Minions of Chaos",
  "Mire the Mind",
  "Misty Visions",
  "Otherworldly Leap",
  "Sculptor of Flesh",
  "Shroud of Shadow",
  "Sign of Ill Omen",
  "Thief of Five Fates",
  "Trickster's Escape",
  "Undying Servitude",
  "Visions of Distant Realms",
  "Whispers of the Grave",
  "Refined Reanimation",
  "Circle of Mortality",
  "Return to Life",
  "Channeler",
  "Voice of Death",
  "Spirit Query",
  "Tokens of the Departed",
  "Beasts of Ill Omen",
];

export const IGNORE_SPELLS_GRANTED_BY_FEATS = [
  "Spellfire Spark",
];

// Race and background grants decide their slot-castable copy from the trait text
// (CharacterSpellFactory.grantAllowsSlotCasting); these lists only apply when there is no text.
export const NO_GRANTED_SPELL_LIST_FEATURE_2024_INCLUDES = [
  "Argent Gleam",
];

export const NO_GRANTED_SPELL_LIST_FEATURE_2014_INCLUDES = [
  "Dragonmark",
  "Magical Detection",
  "Finder's Magic",
  "Primal Connection",
  "Healing Touch",
  "Innkeeper's Magic",
  "Spellsmith",
  "Magical Passage",
  "Scribe's Insight",
  "Guardian's Shield",
  "Shape Shadows",
  "Headwinds",
  "Wards and Seals",
];

export const FORCE_TRAIT_SPELL_ADVANCEMENT_ON_RACE: string[] = [

];

/** DDB choices that configure their parent rather than creating another item. */
export const NON_ITEM_CHOICE_LABELS: string[] = [
  "Strength",
  "Dexterity",
  "Constitution",
  "Intelligence",
  "Wisdom",
  "Charisma",
  "Strength Score",
  "Dexterity Score",
  "Constitution Score",
  "Intelligence Score",
  "Wisdom Score",
  "Charisma Score",
  "Fighting Style feat",
];

/**
 * DDB template expressions that are wrong at source. Matched on the exact template body and a
 * feature-name fragment; the formula replaces the whole template as an inline roll value.
 */
export const TEMPLATE_CORRECTIONS: { featureNameIncludes: string; template: string; formula: string }[] = [
  {
    // the 2024 Divine Spark die count, held as a ScaleValue on the feature by its enricher
    featureNameIncludes: "Divine Spark",
    template: "1+(classlevel/7)@rounddown,max:1+(classlevel/13)@rounddown+(classlevel/18)@rounddown",
    formula: "@scale.channel-divinity.spark",
  },
];

/** Spell names that contain a list separator, so splitting a parsed spell list must not break them. */
export const SPELL_NAMES_WITH_CONJUNCTIONS: string[] = [
  "purify food and drink",
  "create or destroy water",
  "detect poison and disease",
  "detect evil and good",
  "protection from evil and good",
  "dispel evil and good",
  "antipathy/sympathy",
  "blindness/deafness",
  "enlarge/reduce",
];
