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
    { name: "Artificer", method: "spell", preparation: (prepared) => {
      return prepared ? CONFIG.DND5E.spellPreparationStates.prepared.value : CONFIG.DND5E.spellPreparationStates.unprepared.value;
    } },
    { name: "Bard", method: "spell", preparation: () => CONFIG.DND5E.spellPreparationStates.always.value },
    { name: "Blood Hunter", method: "pact", preparation: (prepared) => {
      return prepared ? CONFIG.DND5E.spellPreparationStates.prepared.value : CONFIG.DND5E.spellPreparationStates.unprepared.value;
    } },
    { name: "Cleric", method: "spell", preparation: (prepared) => {
      return prepared ? CONFIG.DND5E.spellPreparationStates.prepared.value : CONFIG.DND5E.spellPreparationStates.unprepared.value;
    } },
    { name: "Druid", method: "spell", preparation: (prepared) => {
      return prepared ? CONFIG.DND5E.spellPreparationStates.prepared.value : CONFIG.DND5E.spellPreparationStates.unprepared.value;
    } },
    { name: "Fighter", method: "spell", preparation: (prepared) => {
      return prepared ? CONFIG.DND5E.spellPreparationStates.prepared.value : CONFIG.DND5E.spellPreparationStates.unprepared.value;
    } },
    { name: "Hunter", method: "spell", preparation: (prepared) => {
      return prepared ? CONFIG.DND5E.spellPreparationStates.prepared.value : CONFIG.DND5E.spellPreparationStates.unprepared.value;
    } },
    { name: "Paladin", method: "spell", preparation: (prepared) => {
      return prepared ? CONFIG.DND5E.spellPreparationStates.prepared.value : CONFIG.DND5E.spellPreparationStates.unprepared.value;
    } },
    { name: "Ranger", version: "2024", method: "spell", preparation: (prepared) => {
      return prepared ? CONFIG.DND5E.spellPreparationStates.prepared.value : CONFIG.DND5E.spellPreparationStates.unprepared.value;
    } },
    { name: "Ranger", version: "2014", method: "spell", preparation: () => CONFIG.DND5E.spellPreparationStates.always.value },
    { name: "Rogue", method: "spell", preparation: (prepared) => {
      return prepared ? CONFIG.DND5E.spellPreparationStates.prepared.value : CONFIG.DND5E.spellPreparationStates.unprepared.value;
    } },
    { name: "Sorcerer", method: "spell", preparation: () => CONFIG.DND5E.spellPreparationStates.always.value },
    { name: "Warlock", method: "pact", preparation: () => CONFIG.DND5E.spellPreparationStates.always.value },
    { name: "Wizard", method: "spell", preparation: (prepared) => {
      return prepared ? CONFIG.DND5E.spellPreparationStates.prepared.value : CONFIG.DND5E.spellPreparationStates.unprepared.value;
    } },
    { name: "Monk", method: "atwill", preparation: () => CONFIG.DND5E.spellPreparationStates.always.value },
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
