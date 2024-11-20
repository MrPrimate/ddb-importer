/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SuperiorHuntersDefense extends DDBEnricherData {

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
    const multiple = DDBEnricherData.allDamageTypes().map((damage) => {
      return {
        name: `Superior Hunter's Defense: Resistance to ${utils.capitalize(damage)}`,
        options: {
          durationSeconds: 6,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(damage, 20, "system.traits.dr.value"),
        ],
      };
    });
    return multiple;
  }

  get clearAutoEffects() {
    return true;
  }

}
