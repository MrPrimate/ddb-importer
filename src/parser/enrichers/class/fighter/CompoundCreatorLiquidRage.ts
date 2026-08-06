import DDBEnricherData from "../../data/DDBEnricherData";

export default class CompoundCreatorLiquidRage extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Liquid Rage",
        activityMatch: "Consume Compound",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.bonuses.rwak.damage"),
        ],
      },
    ];
  }

}
