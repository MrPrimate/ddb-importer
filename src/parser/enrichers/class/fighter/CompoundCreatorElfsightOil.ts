import DDBEnricherData from "../../data/DDBEnricherData";

export default class CompoundCreatorElfsightOil extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Elfsight Oil",
        activityMatch: "Consume Compound",
        options: {
          durationSeconds: 28800,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "system.attributes.senses.darkvision"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.range", "upgrade", 120, 5),
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.visionMode", "override", "darkvision", 5),
        ],
      },
    ];
  }

}
