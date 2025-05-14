/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Launch extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Leap",
      activationType: "bonus",
      targetSelf: true,
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Bonus Damage",
          type: "damage",
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          damageParts: [DDBEnricherData.basicDamagePart({
            customFormula: "1@scale.steel-hawk.launch.die",
            types: DDBEnricherData.allDamageTypes(),
          })],
        },
      },
    ];
  }

  get override() {
    const uses = this._getUsesWithSpent({
      name: "Launch",
      type: "class",
      max: "@scale.steel-hawk.launch.number",
    });
    return {
      data: {
        "system.uses": uses,
        "flags.ddbimporter.skipScale": true,
      },
    };
  }

}
