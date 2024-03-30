import DDBCharacter from "../DDBCharacter.js";
import { getDivineSmiteSpell } from "./additions/divineSmite.js";

DDBCharacter.prototype._addSpecialAdditions = function _addSpecialAdditions() {
  const checkList = this.data.features.concat(this.data.actions);
  const divineSmite = checkList.find((f) => f.name === "Divine Smite" && f.type === "feat");
  if (divineSmite) {
    this.data.spells.push(getDivineSmiteSpell(divineSmite));
  }

  const feyAncestry = checkList.find((f) => f.name === "Fey Ancestry" && f.type === "feat");
  if (feyAncestry && (foundry.utils.getProperty(feyAncestry, "system.description.value") ?? "").includes("sleep")) {
    const ci = ["Sleep"];
    if (this.data.character.system.traits.ci.custom && this.data.character.system.traits.ci.custom.trim() !== "")
      ci.push(this.data.character.system.traits.ci.custom);
    this.data.character.system.traits.ci.custom = ci.join(";");
  }
};
