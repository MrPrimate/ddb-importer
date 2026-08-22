import DDBEnricherData from "../../data/DDBEnricherData";

export default class MisfortunesCurseOfTheUnlucky extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Curse of the Unlucky",
      targetType: "creature",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Misfortunist",
      itemConsumeValue: "3",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Curse of the Unlucky",
        options: {
          description: "Subtract 1d4 from this creature's attack rolls and saving throws while it remains cursed by the rogue's Evil Eye.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d4", 20, "system.rolls.attack.mwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d4", 20, "system.rolls.attack.rwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d4", 20, "system.rolls.attack.msak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d4", 20, "system.rolls.attack.rsak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d4", 20, "system.rolls.ability.save.bonus"),
        ],
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
