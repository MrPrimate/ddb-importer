import DDBEnricherData from "../../data/DDBEnricherData";

export default class DrunkenTechnique extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "system.attributes.movement.walk"),
        ],
        options: {
          durationSeconds: 4,
        },
      },
    ];
  }

}
