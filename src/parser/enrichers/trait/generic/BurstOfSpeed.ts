import DDBEnricherData from "../../data/DDBEnricherData";

export default class BurstOfSpeed extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "On your turn",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Burst of Speed",
        options: {
          durationTurns: 1,
          description: "Your Speed increases by 30 feet until the end of the turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("30", 30, "system.attributes.movement.walk"),
        ],
      },
    ];
  }

}
