import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class SuperiorHuntersDefense extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "reaction",
    };
  }

  override get effects(): IDDBEffectHint[] {
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

  override get clearAutoEffects(): boolean {
    return true;
  }

}
