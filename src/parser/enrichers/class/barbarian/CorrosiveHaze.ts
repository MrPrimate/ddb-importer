import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacerData, regionTrigger } from "../../data/RegionBuilders";

/**
 * The upgraded smoke blinds. Placing it rolls nothing: the 10-foot emanation fires a Constitution
 * save, against a DC built on the barbarian's own Constitution, at a hostile creature that enters
 * the smoke or starts its turn there. The parser's Blinded effect already ends at the start of
 * the creature's next turn, so it is kept and only steered away from the placer.
 */
export default class CorrosiveHaze extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Emanate Corrosive Smoke", {
      template: { type: "radius", size: "10" },
      affects: "enemy",
      activationType: "special",
      activationCondition: "While raging",
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter", "tokenTurnStart"],
          activityName: "Corrosive Haze Save",
          excludeSelf: true,
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionTrigger("Corrosive Haze Save", {
        affects: "enemy",
        condition: "A hostile creature enters the smoke or starts its turn there; creatures that don't rely on eyesight are immune",
        save: { ability: ["con"], calculation: "con" },
      }),
    ];
  }

}
