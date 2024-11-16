/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class RingOfTheRam extends DDBEnricherData {
  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Break Object",
          type: "utility",
        },
        build: {
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          generateRoll: true,
          generateConsumption: true,
          roll: {
            name: "Strength Check",
            formula: "1d20 + @scaling * 5",
          },
        },
        overrides: {
          addScalingMode: "amount",
          addConsumptionScalingMax: "3",
        },
      },
    ];
  }
}
