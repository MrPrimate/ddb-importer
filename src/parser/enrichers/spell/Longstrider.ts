import DDBEnricherData from "../data/DDBEnricherData";

export default class Longstrider extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          durationSeconds: 3600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("10", 30),
        ],
      },
    ];
  }

}
