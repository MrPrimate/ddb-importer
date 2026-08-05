import DDBEnricherData from "../data/DDBEnricherData";

export default class GreaterDisciplineCelerity extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      addItemConsume: true,
      itemConsumeTargetName: "Blood Potency",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Celerity: Supernatural Speed",
        options: {
          durationRounds: 1,
          description: "Your Speed is doubled and you have a +3 bonus to AC until the start of your next turn.",
        },
        daeSpecialDurations: ["turnStartSource"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("3", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.multiplyChange("2", 30, "system.attributes.movement.walk"),
        ],
      },
    ];
  }

}
