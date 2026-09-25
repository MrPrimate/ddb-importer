import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";

export default class MirrorOfLifeTrapping extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Trap Reflection",
      activationType: "special",
      noConsumeTargets: true,
      noTemplate: true,
      targetType: "creature",
      targetCount: "1",
      rangeType: "ft",
      rangeValue: 30,
      overrideRange: true,
      activationCondition:
        "When another creature sees its reflection in the active mirror. Knowledge of the mirror grants advantage; Constructs automatically succeed. Track occupied cells manually.",
      data: { save: { ability: ["cha"], dc: { calculation: "", formula: "15" } } },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return ["Activate or Deactivate Mirror", "Contact Trapped Creature", "Free Trapped Creature"].map((name) =>
      itemActivity(name, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "action",
        targetType: "object",
        targetCount: "1",
        rangeType: "ft",
        rangeValue: 5,
        overrideRange: true,
        activationCondition:
          "Speak the appropriate command while within 5 feet of the mirror; resolve cell contents manually",
      }),
    );
  }

}
