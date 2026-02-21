import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

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
          DDBEnricherData.ChangeHelper.damageResistanceChange(damage),
        ],
      };
    });
    return multiple;
  }

  get clearAutoEffects() {
    return true;
  }

}
