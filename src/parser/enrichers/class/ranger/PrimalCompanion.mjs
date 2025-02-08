/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PrimalCompanion extends DDBEnricherData {

  get activity() {
    return {
      name: "Command",
      type: "utility",
      activationType: "bonus",
    };
  }

  get additionalActivities() {
    return this.is2014
      ? [{
        constructor: {
          name: "Summon",
          type: "summon",
        },
        build: {
          generateRange: true,
          generateSummon: true,
          generateConsumption: true,
        },
      }]
      : [
        {
          action: {
            name: "Primal Companion: Summon",
            type: "class",
          },
          overrides: {
            id: "summonPriCSclNe1",
          },
        },
        {
          action: {
            name: "Primal Companion: Restore Beast",
            type: "class",
          },
        },
      ];
  }

  get parseAllChoiceFeatures() {
    return true;
  }

}
