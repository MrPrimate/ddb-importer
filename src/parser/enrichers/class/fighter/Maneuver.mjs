/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Maneuver extends DDBEnricherData {
  get fighterAbility() {
    const characterAbilities = this.ddbParser.ddbCharacter.abilities.withEffects;
    const ability = characterAbilities.str?.value > characterAbilities.dex?.value ? "str" : "dex";
    return ability;
  }

  get diceString() {
    if (this.isClass("Fighter")) {
      if (this.hasClassFeature({ featureName: "Combat Superiority", className: "Fighter" })) {
        return "@scale.battle-master.combat-superiority-die";
      }
    }
    return "1d6";
  }

}
