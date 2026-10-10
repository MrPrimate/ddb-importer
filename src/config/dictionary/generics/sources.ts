export const SOURCE_CATEGORIES = {
  legacy: [23, 26],
  excluded: [
    3, 6, 9, 11, 13, 28,
  ],
  hidden: [
    16, 9999999, 35,
  ],
  basicRules: [1, 148], // Basic rules and free-rules
  // Mage Hand Press: VSSPP (164), TGC (197), VSSPP2 (281)
  mageHandPress: 32,
  // Wizards of the Coast published categories, the rest are partnered content. Critical Role is
  // counted here as most of its books (EGtW, Call of the Netherdeep, Frozen Sick) are WotC titles.
  firstParty: [
    1, 2, 7, 8, 10, 12, 14, 15, 17, 23, 24, 26, 35, 38, 46,
  ],
  // 2024 (5.5e) rules categories: core, expanded and D&D Beyond Drops
  rules2024: [24, 38, 46],
};

export const SOURCE_DATA = {
  spellDescriptions2014: [150, 151, 152, 154, 155, 156, 158, 159, 162, 9999999],
  spellDescriptions2024: [145, 146, 147, 148, 149, 153, 157, 163, 196],
  is2014: [150, 151, 152, 154, 155, 156, 158, 159, 162, 9999999],
  is2024: [145, 146, 147, 148, 149, 153, 157, 163, 196],
};
