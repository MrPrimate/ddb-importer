/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FlamingSphere extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Cast/Place Template",
    };
  }

  get additionalActivities() {
    return [{
      constructor: {
        name: "Save vs Damage",
        type: "save",
      },
      build: {
        generateDamage: true,
        generateSave: true,
        generateActivation: false,
        generateConsumption: false,
        noSpellslot: true,
      },
    }];
  }

  get override() {
    return {
      data: {
        "system.target.template": {
          size: "2.5",
        },
      },
    };
  }

}
