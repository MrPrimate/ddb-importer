import DDBHelper from "../../lib/DDBHelper.js";
import DDBCharacter from "../DDBCharacter.js";

DDBCharacter.prototype._generateInitiative = function _generateInitiative() {
  const initMods = DDBHelper.filterBaseModifiers(this.source.ddb, "bonus", "initiative");
  const initiativeBonus = DDBHelper.getModifierSum(initMods, this.raw.character);

  // If we have the alert Feat set, lets sub 5 so it's correct
  this.raw.character.system.attributes.init = this.raw.character.flags.dnd5e.initiativeAlert
    ? {
      value: initiativeBonus - 5,
      bonus: 5, // used by FVTT internally
      mod: this.abilities.withEffects.dex.mod,
    }
    : {
      value: initiativeBonus,
      bonus: 0, // used by FVTT internally
      mod: this.abilities.withEffects.dex.mod,
    };

};
