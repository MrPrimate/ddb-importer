/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class ArmorOfAgathys extends DDBEnricherMixin {

  get type() {
    return "heal";
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [DDBEnricherMixin.basicDamagePart({ bonus: "5", type: "cold", scalingFormula: "5", scalingMode: "whole" })],
          noeffect: true,
        },
      },
    ];
  }

}
