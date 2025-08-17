/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class RagefulNimbus extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Cast",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Attack",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          geneateActivation: true,
          noSpellslot: true,
          generateRange: true,
          generateConsumption: true,
          noeffect: true,
        },
        overrides: {
          activationType: "reaction",
          overrideActivation: true,
          data: {
            duration: {
              value: null,
              units: "inst",
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Rageful Nimbus: Followed by Cloud",
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

}
