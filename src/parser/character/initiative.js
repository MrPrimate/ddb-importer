import DDBHelper from "../../lib/DDBHelper.js";

export function getInitiative(data, character) {
  const initiativeBonus = DDBHelper.getModifierSum(DDBHelper.filterBaseModifiers(data, "bonus", "initiative"), character);
  const characterAbilities = character.flags.ddbimporter.dndbeyond.effectAbilities;

  // If we have the alert Feat set, lets sub 5 so it's correct
  const initiative = character.flags.dnd5e.initiativeAlert
    ? {
      value: initiativeBonus - 5,
      bonus: 5, // used by FVTT internally
      mod: characterAbilities.dex.mod,
    }
    : {
      value: initiativeBonus,
      bonus: 0, // used by FVTT internally
      mod: characterAbilities.dex.mod,
    };

  return initiative;
}
