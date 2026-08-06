import DDBEnricherData from "../../data/DDBEnricherData";

export default class MisfortunesCurseOfTheClumsy extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Curse of the Clumsy",
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "A creature cursed by your Evil Eye moves at least 5 feet on its turn",
      addItemConsume: true,
      itemConsumeTargetName: "Misfortunist",
      itemConsumeValue: "3",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Curse of the Clumsy",
        statuses: ["Prone"],
        options: {
          durationTurns: 1,
          description: "Prone with Speed 0 until the end of its turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("0", 90, "system.attributes.movement.walk"),
        ],
        daeSpecialDurations: ["turnEnd"],
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: { spent: null, max: "", recovery: [] },
        },
      },
    };
  }

}
