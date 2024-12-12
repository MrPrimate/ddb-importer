
export const COMPENDIUMS = [
  {
    title: "Backgrounds",
    setting: "entity-background-compendium",
    type: "Item",
    image: "https://media.dndbeyond.com/mega-menu/86797d176a398d9f2f05b75b2f54b6dd.jpg",
    auto: true,
    types: ["feat"],
    version: 1,
  },
  {
    title: "Classes",
    setting: "entity-class-compendium",
    type: "Item",
    image: "https://media.dndbeyond.com/mega-menu/b778ff3ca3f18e5f75ad4b348615cab5.jpg",
    auto: true,
    types: ["class", "subclass", "feat", "weapon"],
    version: 1,
  },
  {
    title: "Feats",
    setting: "entity-feat-compendium",
    type: "Item",
    image: "https://media.dndbeyond.com/mega-menu/a69ab5bf67b03308893b582dbef700e9.jpg",
    auto: true,
    types: ["feat"],
    version: 1,
  },
  {
    title: "Items",
    setting: "entity-item-compendium",
    type: "Item",
    image: "https://media.dndbeyond.com/mega-menu/c06b79eae8ee234d1cea4688e117152b.jpg",
    auto: true,
    types: [
      "weapon",
      "equipment",
      "consumable",
      "tool",
      "loot",
      "feat",
      "container",
    ],
    version: 1,
  },
  {
    title: "Monsters",
    setting: "entity-monster-compendium",
    type: "Actor",
    image: "https://media.dndbeyond.com/mega-menu/36ee49066331fc36e3b37147d123463a.jpg",
    auto: true,
    types: ["npc"],
    version: 1,
  },
  {
    title: "Vehicles",
    setting: "entity-vehicle-compendium",
    type: "Actor",
    image: "https://media.dndbeyond.com/mega-menu/e95485e82519aa807da5011d42b8c9d3.jpg",
    auto: true,
    types: ["npc", "vehicle"],
    version: 1,
  },
  {
    title: "Species",
    setting: "entity-species-compendium",
    type: "Item",
    image: "https://media.dndbeyond.com/mega-menu/bfe65858aaa13919ce3d86d938bcb05b.jpg",
    auto: true,
    types: ["race", "feat", "weapon"],
    version: 1,
  },
  {
    title: "Spells",
    setting: "entity-spell-compendium",
    type: "Item",
    image: "https://media.dndbeyond.com/mega-menu/8894f93deeca83cdf0a6df3f36ffb52e.jpg",
    auto: true,
    types: ["spell"],
    version: 1,
  },
  {
    title: "Tables",
    setting: "entity-table-compendium",
    type: "RollTable",
    image: "https://media.dndbeyond.com/mega-menu/f1a2343aee786f21827daf763c60d30f.jpg",
    auto: true,
    types: [],
    version: 1,
  },
  {
    title: "Override",
    setting: "entity-override-compendium",
    type: "Item",
    image: "https://media.dndbeyond.com/mega-menu/e116466f43544117a34ed5f642c680f7.jpg",
    auto: true,
    types: [
      "weapon",
      "equipment",
      "consumable",
      "tool",
      "loot",
      "feat",
      "container",
      "spell",
      "feat",
      "class",
      "subclass",
    ],
    version: 1,
  },
  {
    title: "Adventures",
    setting: "entity-adventure-compendium",
    type: "Adventure",
    image: "https://media.dndbeyond.com/mega-menu/4af3d4c196428ab0809cf71d332d540d.png",
    auto: false,
    types: [],
    version: 1,
  },
  {
    title: "Journals",
    setting: "entity-journal-compendium",
    type: "JournalEntry",
    image: "https://media.dndbeyond.com/mega-menu/4af3d4c196428ab0809cf71d332d540d.png",
    auto: true,
    types: [],
    version: 1,
  },
  {
    title: "Summons",
    setting: "entity-summons-compendium",
    type: "Actor",
    image: "https://media.dndbeyond.com/mega-menu/4af3d4c196428ab0809cf71d332d540d.png",
    auto: true,
    types: ["npc"],
    version: 1,
  },
];

export const SRD_COMPENDIUM_LOOKUPS = [
  { type: "inventory", name: "dnd5e.items" },
  { type: "spells", name: "dnd5e.spells" },
  { type: "features", name: "dnd5e.classfeatures" },
  { type: "races", name: "dnd5e.races" },
  { type: "species", name: "dnd5e.races" },
  { type: "traits", name: "dnd5e.races" },
  { type: "features", name: "dnd5e.classfeatures" },
  { type: "feat", name: "dnd5e.classfeatures" },
  { type: "feats", name: "dnd5e.classfeatures" },
  { type: "classes", name: "dnd5e.classes" },
  { type: "subclasses", name: "dnd5e.subclasses" },
  { type: "weapon", name: "dnd5e.items" },
  { type: "consumable", name: "dnd5e.items" },
  { type: "tool", name: "dnd5e.items" },
  { type: "loot", name: "dnd5e.items" },
  { type: "container", name: "dnd5e.items" },
  { type: "spell", name: "dnd5e.spells" },
  { type: "equipment", name: "dnd5e.items" },
  { type: "monsters", name: "dnd5e.monsters" },
  { type: "monsterfeatures", name: "dnd5e.monsterfeatures" },
  { type: "backgrounds", name: "dnd5e.backgrounds" },
];

export const FOUNDRY_COMPENDIUM_LOOKUPS = {
  PHB2024: [
    { type: "inventory", name: "dnd-players-handbook.equipment" },
    { type: "spells", name: "dnd-players-handbook.spells" },
    { type: "features", name: "dnd-players-handbook.classes" },
    { type: "races", name: "dnd-players-handbook.origins" },
    { type: "species", name: "dnd-players-handbook.origins" },
    { type: "traits", name: "dnd-players-handbook.origins" },
    { type: "features", name: "dnd-players-handbook.classes" },
    { type: "feat", name: "dnd-players-handbook.feats" },
    { type: "feats", name: "dnd-players-handbook.feats" },
    { type: "classes", name: "dnd-players-handbook.classes" },
    { type: "subclasses", name: "dnd-players-handbook.classes" },
    { type: "weapon", name: "dnd-players-handbook.equipment" },
    { type: "consumable", name: "dnd-players-handbook.equipment" },
    { type: "tool", name: "dnd-players-handbook.equipment" },
    { type: "loot", name: "dnd-players-handbook.equipment" },
    { type: "container", name: "dnd-players-handbook.equipment" },
    { type: "spell", name: "dnd-players-handbook.spells" },
    { type: "equipment", name: "dnd-players-handbook.equipment" },
    { type: "backgrounds", name: "dnd-players-handbook.origins" },
  ],
  TASHAS: [
    { type: "inventory", name: "dnd-tashas-cauldron.tcoe-magic-items" },
    { type: "spells", name: "dnd-tashas-cauldron.tcoe-character-options" },
    { type: "features", name: "dnd-tashas-cauldron.tcoe-character-options" },
    { type: "races", name: "dnd-tashas-cauldron.tcoe-character-options" },
    { type: "species", name: "dnd-tashas-cauldron.tcoe-character-options" },
    { type: "traits", name: "dnd-tashas-cauldron.tcoe-character-options" },
    { type: "features", name: "dnd-tashas-cauldron.tcoe-character-options" },
    { type: "feat", name: "dnd-tashas-cauldron.tcoe-character-options" },
    { type: "feats", name: "dnd-tashas-cauldron.tcoe-character-options" },
    { type: "classes", name: "dnd-tashas-cauldron.tcoe-character-options" },
    { type: "subclasses", name: "dnd-tashas-cauldron.tcoe-character-options" },
    { type: "weapon", name: "dnd-tashas-cauldron.tcoe-magic-items" },
    { type: "consumable", name: "dnd-tashas-cauldron.tcoe-magic-items" },
    { type: "tool", name: "dnd-tashas-cauldron.tcoe-magic-items" },
    { type: "loot", name: "dnd-tashas-cauldron.tcoe-magic-items" },
    { type: "container", name: "dnd-tashas-cauldron.tcoe-magic-items" },
    { type: "spell", name: "dnd-tashas-cauldron.tcoe-character-options" },
    { type: "equipment", name: "dnd-tashas-cauldron.tcoe-magic-items" },
    { type: "backgrounds", name: "dnd-tashas-cauldron.tcoe-character-options" },
  ],
};

export const FOUNDRY_COMPENDIUM_MAP = {
  "classes": [
    "dnd5e.classes",
    "dnd-tashas-cauldron.tcoe-character-options",
  ],
  "classes2024": [
    "dnd-tashas-cauldron.tcoe-character-options",
    "dnd-players-handbook.classes",
  ],
  "spells": [
    "dnd5e.spells",
    "dnd-tashas-cauldron.tcoe-character-options",
  ],
  "spells2024": [
    "dnd-players-handbook.spells",
    "dnd-tashas-cauldron.tcoe-character-options",
  ],
  "items": [
    "dnd-tashas-cauldron.tcoe-magic-items",
  ],
  "items2024": [
    "dnd-tashas-cauldron.tcoe-magic-items",
    "dnd-players-handbook.equipment",
  ],
};

export const COMPENDIUM_REMOVE_FLAGS = [
  "flags.ddbimporter.overrideId",
  "flags.ddbimporter.ignoreItemImport",
  "flags.ddbimporter.retainResourceConsumption",
  "flags.ddbimporter.ignoreIcon",
];