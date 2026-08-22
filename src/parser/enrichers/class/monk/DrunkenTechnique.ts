import DDBEnricherData from "../../data/DDBEnricherData";

export default class DrunkenTechnique extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "system.attributes.movement.speeds.walk"),
        ],
        options: {
          durationSeconds: 4,
        },
      },
    ];
  }

}
