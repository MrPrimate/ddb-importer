import DDBEnricherData from "../../data/DDBEnricherData";

export default class CompoundCreatorAllsenseInjection extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Allsense Injection",
        activityMatch: "Consume Compound",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.senses.blindsight"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "ATL.detectionModes.blindsight.range"),
        ],
      },
    ];
  }

}
