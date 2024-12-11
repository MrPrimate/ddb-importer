export const SPELL = {
  schools: [
    { id: "abj", name: "abjuration", img: "https://www.dndbeyond.com/content/1-0-1337-0/skins/waterdeep/images/spell-schools/35/abjuration.png" },
    { id: "con", name: "conjuration", img: "https://www.dndbeyond.com/content/1-0-1337-0/skins/waterdeep/images/spell-schools/35/conjuration.png" },
    { id: "div", name: "divination", img: "https://www.dndbeyond.com/content/1-0-1337-0/skins/waterdeep/images/spell-schools/35/divination.png" },
    { id: "enc", name: "enchantment", img: "https://www.dndbeyond.com/content/1-0-1337-0/skins/waterdeep/images/spell-schools/35/enchantment.png" },
    { id: "evo", name: "evocation", img: "https://www.dndbeyond.com/content/1-0-1337-0/skins/waterdeep/images/spell-schools/35/evocation.png" },
    { id: "ill", name: "illusion", img: "https://www.dndbeyond.com/content/1-0-1337-0/skins/waterdeep/images/spell-schools/35/illusion.png" },
    { id: "nec", name: "necromancy", img: "https://www.dndbeyond.com/content/1-0-1337-0/skins/waterdeep/images/spell-schools/35/necromancy.png" },
    { id: "trs", name: "transmutation", img: "https://www.dndbeyond.com/content/1-0-1337-0/skins/waterdeep/images/spell-schools/35/transmutation.png" },
  ],
  progression: [
    { name: "Artificer", value: "artificer" },
    { name: "Artificer (UA)", value: "artificer" },
    { name: "Bard", value: "full" },
    { name: "Barbarian", value: "none" },
    { name: "Blood Hunter", value: "pact" },
    { name: "Blood Hunter (archived)", value: "pact" },
    { name: "Cleric", value: "full" },
    { name: "Druid", value: "full" },
    { name: "Fighter", value: "third" },
    { name: "Hunter", value: "half" },
    { name: "Paladin", value: "half" },
    { name: "Ranger", value: "half" },
    { name: "Rogue", value: "third" },
    { name: "Sorcerer", value: "full" },
    { name: "Warlock", value: "pact" },
    { name: "Wizard", value: "full" },
    { name: "Monk", value: "none" },
  ],
  preparationModes: [
    { name: "Artificer", value: "prepared" },
    { name: "Artificer (UA)", value: "prepared" },
    { name: "Bard", value: "always" },
    { name: "Blood Hunter", value: "pact" },
    { name: "Blood Hunter (archived)", value: "pact" },
    { name: "Cleric", value: "prepared" },
    { name: "Druid", value: "prepared" },
    { name: "Fighter", value: "always" },
    { name: "Hunter", value: "always" },
    { name: "Paladin", value: "prepared" },
    { name: "Ranger", value: "always" },
    { name: "Rogue", value: "always" },
    { name: "Sorcerer", value: "always" },
    { name: "Warlock", value: "pact" },
    { name: "Wizard", value: "prepared" },
    { name: "Monk", value: "always" },
  ],
  activationTypes: [
    { activationType: 0, value: "none", name: "No Action" }, // doesn't exist an more
    { activationType: 1, value: "action", name: "Action" }, // action
    { activationType: 2, value: "none", name: "No Action" }, // no action
    { activationType: 3, value: "bonus", name: "Bonus Action" }, // bonus action
    { activationType: 4, value: "reaction", name: "Reaction" }, // reaction
    { activationType: 5, value: "special", name: "Unknown" }, // no longer exists
    { activationType: 6, value: "minute", name: "Minute" }, // minute
    { activationType: 7, value: "hour", name: "Hour" }, // hour
    { activationType: 8, value: "special", name: "Special" }, // special
  ],
};
