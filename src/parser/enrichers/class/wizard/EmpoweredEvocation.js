/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class EmpoweredEvocation extends DDBEnricherMixin {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      activationType: "special",
      targetType: "creature",
      damageParts: [
        DDBEnricherMixin.basicDamagePart({
          customFormula: "@abilities.int.mod",
          types: this.allDamageTypes,
        }),
      ],
    };
  }

}
