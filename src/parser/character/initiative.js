import utils from "../../utils.js";

export function getInitiative(data, character) {
  const initiativeBonus = utils.getModifierSum(utils.filterBaseModifiers(data, "bonus", "initiative"), character);

  // If we have the alert Feat set, lets sub 5 so it's correct
  const initiative = character.flags.dnd5e.initiativeAlert
    ? {
        value: initiativeBonus - 5,
        bonus: 5, // used by FVTT internally
        mod: character.data.abilities.dex.mod,
      }
    : {
        value: initiativeBonus,
        bonus: 0, // used by FVTT internally
        mod: character.data.abilities.dex.mod,
      };

  return initiative;
}
