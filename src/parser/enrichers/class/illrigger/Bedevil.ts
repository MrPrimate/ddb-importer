import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

export default class Bedevil extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bedevil",
      activationType: "special",
      activationCondition: "When you burn a seal on an interdicted creature (no action required)",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 30,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Bedevilled",
        activityMatch: "Bedevil",
        options: {
          description: "Subtract the illrigger's proficiency bonus from the next saving throw made before the end of your next turn.",
          durationSeconds: 6,
          durationRounds: 1,
          expiry: "targetEnd",
        },
        changes: [
          _Illrigger.originChange(
            DDBEnricherData.ChangeHelper.addChange("-@prof", 20, "system.bonuses.abilities.save"),
          ),
        ],
      },
    ];
  }

}
