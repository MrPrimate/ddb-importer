import DDBHelper from "../../lib/DDBHelper.js";
import DDBCharacter from "../DDBCharacter.js";

DDBCharacter.prototype._generateInitiative = function _generateInitiative() {
  const initMods = DDBHelper.filterBaseModifiers(this.source.ddb, "bonus", "initiative");
  const initiativeBonus = DDBHelper.getModifierSum(initMods, this.raw.character);

  // If we have the alert Feat set, lets sub 5 so it's correct
  this.raw.character.system.attributes.init = this.raw.character.flags.dnd5e.initiativeAlert
    ? {
      ability: "dex",
      bonus: Number.isInteger(Number.parseInt(initiativeBonus)) ? Number.parseInt(initiativeBonus) - 5 : `${initiativeBonus} - 5`,
    }
    : {
      ability: "dex",
      bonus: Number.isInteger(Number.parseInt(initiativeBonus)) ? Number.parseInt(initiativeBonus) : initiativeBonus,
    };

};
