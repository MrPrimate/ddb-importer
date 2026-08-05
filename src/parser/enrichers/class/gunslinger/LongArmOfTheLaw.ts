import DDBEnricherData from "../../data/DDBEnricherData";

export default class LongArmOfTheLaw extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "Once per turn, when you hit a Large or smaller creature with a ranged weapon attack",
      noTemplate: true,
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hobbled",
        options: {
          durationRounds: 1,
          description: "Cannot move on its next turn unless it first takes the Disengage action.",
        },
        daeSpecialDurations: ["turnEnd"],
        changes: [
          DDBEnricherData.ChangeHelper.customChange("*0", 20, "system.attributes.movement.all"),
        ],
      },
    ];
  }

}
