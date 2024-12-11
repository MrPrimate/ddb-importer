export const EQUIPMENT = {
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
};
