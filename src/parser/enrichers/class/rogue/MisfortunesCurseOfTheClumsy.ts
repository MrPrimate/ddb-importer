import DDBEnricherData from "../../data/DDBEnricherData";

export default class MisfortunesCurseOfTheClumsy extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
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

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Curse of the Clumsy",
        statuses: ["Prone"],
        options: {
          durationTurns: 1,
          description: "Prone with Speed 0 until the end of its turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 90),
        ],
        daeSpecialDurations: ["turnEnd"],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: { spent: null, max: "", recovery: [] },
        },
      },
    };
  }

}
