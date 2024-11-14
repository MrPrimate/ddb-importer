/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class FlamingSphere extends DDBEnricherMixin {

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
