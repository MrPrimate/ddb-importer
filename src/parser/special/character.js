import DDBCharacter from "../DDBCharacter.js";
import { getDivineSmiteSpell } from "./additions/divineSmite.js";

DDBCharacter.prototype._addSpecialAdditions = function _addSpecialAdditions() {
  const divineSmite = this.data.features
    .concat(this.data.actions)
    .find((f) => f.name === "Divine Smite" && f.type === "feat");
  if (divineSmite) {
    this.data.spells.push(getDivineSmiteSpell(divineSmite));
  }
};
