import { DDBHelper } from "../../lib/_module.mjs";
import DDBCharacter from "../DDBCharacter.js";

DDBCharacter.prototype._generateInitiative = function _generateInitiative() {
  const initMods = DDBHelper.filterBaseModifiers(this.source.ddb, "bonus", { subType: "initiative" });
  // const initiativeBonus = DDBHelper.getModifierSum(initMods, this.raw.character);

  let initiativeBonus = DDBHelper.getValueFromModifiers(initMods, "initiative", "initiative", "bonus");

  // if (initiativeBonus && this.raw.character.flags.dnd5e.initiativeAlert) {
  //   if (initiativeBonus.includes("+ 5")) {
  //     initiativeBonus = initiativeBonus.replace("+ 5", "");
  //   } else if ([5].includes(Number.parseInt(initiativeBonus))) {
  //     initiativeBonus = "";
  //   }
  // }
  if (Number.parseInt(initiativeBonus) === 0) {
    initiativeBonus = "";
  }

  // If we have the alert Feat set, lets sub 5 so it's correct
  this.raw.character.system.attributes.init = {
    ability: "dex",
    bonus: initiativeBonus ?? "",
  };

};
