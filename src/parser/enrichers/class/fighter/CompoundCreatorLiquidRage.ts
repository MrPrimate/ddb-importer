import DDBEnricherData from "../../data/DDBEnricherData";

export default class CompoundCreatorLiquidRage extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Liquid Rage",
        activityMatch: "Consume Compound",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.rolls.damage.mwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.rolls.damage.rwak.bonus"),
        ],
      },
    ];
  }

}
