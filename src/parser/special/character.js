import DDBCharacter from "../DDBCharacter.js";
import { getDivineSmiteSpell } from "./additions/divineSmite.js";

DDBCharacter.prototype._addSpecialAdditions = function _addSpecialAdditions() {
  const checkList = this.data.features.concat(this.data.actions);
  const divineSmite = checkList.find((f) => f.name === "Divine Smite" && f.type === "feat");
  if (divineSmite) {
    this.data.spells.push(getDivineSmiteSpell(divineSmite));
  }

  const sleepFeatures = [
    "Fey Ancestry",
    "Trance",
  ];
  const features = checkList.filter((f) => sleepFeatures.includes(f.name) && f.type === "feat");
  let customs = new Set(this.data.character.system.traits.ci.custom.split(":"));
  for (const sleepFeature of features) {
    if (sleepFeature && (foundry.utils.getProperty(sleepFeature, "system.description.value") ?? "").includes("magic can’t put you to sleep")) {
      customs.add("Sleep");
    }
  }
  this.data.character.system.traits.ci.custom = Array.from(customs).join(";");

};
