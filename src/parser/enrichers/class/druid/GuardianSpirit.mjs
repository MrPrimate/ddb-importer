/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class GuardianSpirit extends DDBEnricherData {

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Temp HP",
          type: "heal",
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: false,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@classes.druid.levels / 2",
            type: "tempHP",
          }),
        },
      },
    ];
  }

}


