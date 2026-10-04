import DDBEnricherData from "../../data/DDBEnricherData";

/** Harvest Domain Bountiful Harvest, Growing: until the end of your next turn, targets add 1d4 to attack rolls and ability checks. */
export default class GrowingBountifulHarvest extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 6,
      targetChoice: true,
      activationType: "action",
      addItemConsume: true,
      itemConsumeTargetName: "channel-divinity",
      data: {
        range: { override: true, value: "60", units: "ft" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Bountiful Harvest: Growing",
        options: { durationSeconds: 12, description: "Add 1d4 to attack rolls and ability checks until the end of the cleric's next turn." },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("+1d4", 20, "system.bonuses.mwak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("+1d4", 20, "system.bonuses.rwak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("+1d4", 20, "system.bonuses.msak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("+1d4", 20, "system.bonuses.rsak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("+1d4", 20, "system.bonuses.abilities.check"),
        ],
      },
    ];
  }

}
