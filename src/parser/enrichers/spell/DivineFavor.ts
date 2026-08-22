import DDBEnricherData from "../data/DDBEnricherData";

export default class DivineFavor extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      overrideTarget: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4[radiant]", 0, "system.rolls.damage.mwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4[radiant]", 0, "system.rolls.damage.rwak.bonus"),
        ],
      },
    ];
  }

}
