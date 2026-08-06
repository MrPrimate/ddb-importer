import DDBEnricherData from "../../data/DDBEnricherData";

export default class Blindsight extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blindsight",
        options: {
          durationSeconds: 600,
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
