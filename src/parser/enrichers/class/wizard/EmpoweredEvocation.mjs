/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class EmpoweredEvocation extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      activationType: "special",
      targetType: "creature",
      damageParts: [
        DDBEnricherData.basicDamagePart({
          customFormula: "@abilities.int.mod",
          types: this.allDamageTypes,
        }),
      ],
    };
  }

}
