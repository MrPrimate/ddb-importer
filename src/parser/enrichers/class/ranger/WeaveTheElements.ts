import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class WeaveTheElements extends DDBEnricherData {

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return ["acid", "cold", "fire", "lightning", "thunder"].map((element) => {
      return {
        name: `Weave the Elements: ${utils.capitalize(element)} Resistance`,
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange(element),
        ],
      };
    });
  }

}
