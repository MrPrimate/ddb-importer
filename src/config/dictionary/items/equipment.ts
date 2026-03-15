interface ArmorType {
  name: string;
  id: number;
  value: string | null;
}

export interface Equipment {
  armorType: ArmorType[];
  priceFormulas: Record<string, string>;
  dmg2024Price: Record<string, string>;
  CLOTHING_ITEMS: string[];
  EQUIPMENT_TRINKET: string[];
  LOOT_ITEM: string[];
  LOOT_TYPES: Record<string, string>;
  NON_CONTAINERS: string[];
  CONSUMABLE_WONDROUS_ITEMS: string[];
  CONSUMABLE_TRINKETS: string[];
  POTIONS: string[];
  AMMUNITION: string[];
}

export const EQUIPMENT: Equipment = {
  armorType: [
    { name: "Light Armor", id: 1, value: "light" },
    { name: "Medium Armor", id: 2, value: "medium" },
    { name: "Heavy Armor", id: 3, value: "heavy" },
    { name: "Shield", id: 4, value: "shield" },
    { name: "Unarmored", id: 0, value: null },
    { name: "Unarmored Defense", id: -1, value: null },
    { name: "Natural Armor", id: -2, value: "natural" },
    { name: "Magical Bonus", id: -3, value: "bonus" },
    { name: "Clothing", id: -4, value: "clothing" },
  ],
  priceFormulas: {
    "common": "1d6 * 10",
    "uncommon": "1d6 * 100",
    "rare": "2d10 * 1000",
    "veryRare": "1d4 * 10000",
    "legendary": "2d6 * 25000",
    "artifact": "2d10 * 50000",
  },
  dmg2024Price: {
    "common": "100",
    "uncommon": "400",
    "rare": "4000",
    "veryRare": "40000",
    "legendary": "200000",
    "artifact": "",
  },
  CLOTHING_ITEMS: [
    "Helm",
    "Boots",
    "Snowshoes",
    "Vestments",
    "Saddle, Exotic",
    "Saddle, Military",
    "Saddle, Pack",
    "Saddle, Riding",
  ],
  EQUIPMENT_TRINKET: [
    "Canoe",
    "Censer",
    "Crowbar",
    "Grenade Launcher",
    "Hammer",
    "Hammer, Sledge",
    "Hourglass",
    "Ladder (10 foot)",
    "Mess Kit",
    "Mirror, Steel",
    "Pick, Miner's",
    "Pole (10-foot)",
    "Shovel",
    "Signal Whistle",
    "Small Knife",
    "Spellbook",
    "Spyglass",
    "Tent, Two-Person",
    "Whetstone",
  ],
  LOOT_ITEM: [
    "Abacus",
    "Barding",
    "Basic Fishing Equipment",
    "Bedroll",
    "Bell",
    "Bit and Bridle",
    "Blanket",
    "Block and Tackle",
    "Book",
    "Magnifying Glass",
    "Scale, Merchant's",
    "Signet Ring",
    "String",
  ],
  LOOT_TYPES: {
    "Gemstone": "gem",
    "Gem": "gem",
    "Art Object": "art",
    "Art": "art",
    "Material": "material",
    "Resource": "resource",
    "Treasure": "treasure",
    "Adventuring Gear": "gear",
    "Junk": "junk",
  },
  NON_CONTAINERS: [
    "Apparatus of the Crab",
    "Folding Boat",
    "Instant Fortress",
    "Carpet of Flying (3 ft. x 5 ft.)",
    "Carpet of Flying (4 ft. x 6 ft.)",
    "Carpet of Flying (5 ft. x 7 ft.)",
    "Carpet of Flying (6 ft. x 9 ft.)",
    "Apparatus of Kwalish",
    "Daern's Instant Fortress",
    // "Flying Chariot",
    "Cauldron of Plenty",
    "Flying Broomstick",
  ],
  CONSUMABLE_WONDROUS_ITEMS: [

  ],
  CONSUMABLE_TRINKETS: [
    "Perfume of Bewitching",
    "Ale Seed",
    "Pressure Capsule",
    "Bonfire Seed",
    "Feather Token",
    "Rain and Thunder Seed",
    "Stallion Seed",
    "Pot of Awakening",
    "Moodmark Paint",
    "Planter Kernels",
    "Tossable Kernels",
    "Orchard Seed",
    "Luckleaf",
    "Poison Popper",
    "Aurora Dust",
    "Quaal's Feather Token",
    "Paper Bird",
    "Deck of Illusions",
    "Baffled Candle",
    "Egg of Primal Water",
    "Gnashing Key",
    "Balloon Pack",
    "Pixie Dust",
    "Life Tether Ankh",
    "Road Seed",
    "Knightly Seed",
    // "Wind Fan",
    "Tossable Kernels",
    "Tavern Seed",
    "Bridge Seed",
    "Instaprint Camera",
    // "Guardian Spheres",
    "Planter Kernels",
    "Deck of Miscellany",
    "Smokepowder",
    // "Propeller Helm",
  ],
  POTIONS: [
    "Melon Soda",
    "Cola Soda",
    "Fish Sauce Soda",
    "Canister of Vreyval's Soothing Tea",
    "Eyedrops of Clarity",
    "Flask",
  ],
  AMMUNITION: [
    "Bag of Bellstones",
  ],
};
