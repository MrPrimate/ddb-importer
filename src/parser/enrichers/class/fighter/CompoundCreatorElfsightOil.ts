import DDBEnricherData from "../../data/DDBEnricherData";

export default class CompoundCreatorElfsightOil extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Elfsight Oil",
        activityMatch: "Consume Compound",
        options: {
          durationSeconds: 28800,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "system.attributes.senses.ranges.darkvision"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.range", "upgrade", 120, 5),
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.visionMode", "override", "darkvision", 5),
        ],
      },
    ];
  }

}
