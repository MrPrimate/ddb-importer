import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Gusting Blowgun: a ranged hit pushes a Medium or smaller target 5 feet on a failed Strength
 * save, and a charge blows a 30 by 5 foot line of wind that pushes 10 feet.
 */
export default class GustingBlowgun extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Gust", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["str"], formula: "13" },
        condition: "When you hit a Medium or smaller creature with a ranged attack: pushed 5 feet away on a failure",
        range: { value: "100", units: "ft" },
        noeffect: true,
      }),
      itemProperty("Line of Wind", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["str"], formula: "13" },
        activationType: "action",
        condition: "Medium or smaller creatures in the line are pushed 10 feet away on a failure",
        template: { type: "line", size: "30", width: "5" },
        range: { value: null, units: "self" },
        charges: "1",
        noeffect: true,
      }),
    ];
  }

}
