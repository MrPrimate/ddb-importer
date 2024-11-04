/* eslint-disable class-methods-use-this */
import utils from "../../../../lib/utils.js";
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class SuperiorHuntersDefense extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      activationType: "reaction",
    };
  }

  get effects() {
    const multiple = DDBEnricherMixin.allDamageTypes().map((damage) => {
      return {
        name: `Superior Hunter's Defense: Resistance to ${utils.capitalize(damage)}`,
        options: {
          durationSeconds: 6,
        },
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange(damage, 20, "system.traits.dr.value"),
        ],
      };
    });
    return multiple;
  }

  get clearAutoEffects() {
    return true;
  }

}
