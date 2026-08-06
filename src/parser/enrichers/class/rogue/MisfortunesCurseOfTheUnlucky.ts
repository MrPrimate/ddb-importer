import DDBEnricherData from "../../data/DDBEnricherData";

export default class MisfortunesCurseOfTheUnlucky extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Curse of the Unlucky",
      targetType: "creature",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Misfortunist",
      itemConsumeValue: "3",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Curse of the Unlucky",
        options: {
          description: "Subtract 1d4 from this creature's attack rolls and saving throws while it remains cursed by the rogue's Evil Eye.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d4", 20, "system.bonuses.mwak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d4", 20, "system.bonuses.rwak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d4", 20, "system.bonuses.msak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d4", 20, "system.bonuses.rsak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("-1d4", 20, "system.bonuses.abilities.save"),
        ],
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
