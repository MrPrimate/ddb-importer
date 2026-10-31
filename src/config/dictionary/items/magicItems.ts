export const MAGIC_ITEMS = {
  rechargeUnits: [
    { id: 1, value: "r4" },
    { id: "ShortRest", value: "r4" },
    { id: 2, value: "r5" },
    { id: "LongRest", value: "r5" },
    { id: "Long", value: "r5" },
    { id: "long", value: "r5" },
    { id: "Dawn", value: "r2" },
    { id: "dawn", value: "r2" },
    { id: "Day", value: "r2" },
    { id: "day", value: "r2" },
    { id: "daily", value: "r1" },
    { id: "DawnRest", value: "r2" },
    { id: "Dusk", value: "r3" },
    { id: "dusk", value: "r3" },
    { id: "DuskRest", value: "r3" },
    { id: "Sunset", value: "r3" },
    { id: "Consumable", value: "" },
    { id: "Other", value: "" },
    { id: "Daily", value: "r1" },
    { id: "sr", value: "r4" },
    { id: "lr", value: "r5" },
    { id: "", value: "" },
    { id: null, value: "" },
    { id: 3, value: "r2" },
    { id: 4, value: "" },
  ],
  nums: [
    { id: "once", value: 1 },
    { id: "twice", value: 2 },
    { id: "thrice", value: 3 },
    { id: "one", value: 1 },
    { id: "two", value: 2 },
    { id: "three", value: 3 },
  ],
  /**
   * Generic DDB items that hold one spell chosen when the item is made. DDB ships them without the
   * spell, so a character import reads it from the custom name ("Spell Scroll of Fireball").
   * `ddbName` matches DDB's own item name, `words` are the carrier words to strip from the custom
   * name, `ignoredProperties` are the components the item text waives, and `printedValues` marks
   * items whose text prints their own DC and attack bonus instead of the spell scroll table,
   * `activation` replaces the spell's casting time, and `singleUse` marks items that hold one casting
   * DDB gives no uses for (a Spell Gem's spell "disappears from the gem").
   */
  spellCarriers: [
    { kind: "scroll", ddbName: /^Spell Scroll\b/i, words: /\b(?:spell\s+)?scroll\b/gi, ignoredProperties: ["material"], printedValues: false },
    { kind: "tattoo", ddbName: /^Spellwrought Tattoo\b/i, words: /\b(?:spellwrought\s+)?tattoo\b/gi, ignoredProperties: ["material"], printedValues: false },
    { kind: "enspelled", ddbName: /^Enspelled\b/i, words: /\benspelled\b/gi, ignoredProperties: ["vocal", "somatic", "material"], printedValues: false },
    { kind: "gem", ddbName: /^Spell Gem\b/i, words: /\b(?:spell\s+)?gem\b/gi, ignoredProperties: ["vocal", "somatic", "material"], printedValues: true, activation: "action", singleUse: true },
  ] as IDDBSpellCarrier[],
};
