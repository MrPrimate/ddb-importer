import DDBHelper from "../../lib/DDBHelper.js";
import DDBCharacter from "../DDBCharacter.js";

DDBCharacter.prototype._generateInitiative = function _generateInitiative() {
  const initMods = DDBHelper.filterBaseModifiers(this.source.ddb, "bonus", { subType: "initiative" });
  // const initiativeBonus = DDBHelper.getModifierSum(initMods, this.raw.character);

  let initiativeBonus = DDBHelper.getValueFromModifiers(initMods, "initiative", "initiative", "bonus");

  if (initiativeBonus && this.raw.character.flags.dnd5e.initiativeAlert) {
    if (initiativeBonus.includes("+ 5")) {
      initiativeBonus = initiativeBonus.replace("+ 5", "");
    } else if ([5].includes(Number.parseInt(initiativeBonus))) {
      initiativeBonus = "";
    }
  }
  if ([0].includes(Number.parseInt(initiativeBonus))) {
    initiativeBonus = "";
  }

  // If we have the alert Feat set, lets sub 5 so it's correct
  this.raw.character.system.attributes.init = {
    ability: "dex",
    bonus: (Number.isInteger(Number.parseInt(initiativeBonus)) ? Number.parseInt(initiativeBonus) : initiativeBonus) ?? "",
  };

};
