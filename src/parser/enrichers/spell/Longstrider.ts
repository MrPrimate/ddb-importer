import DDBEnricherData from "../data/DDBEnricherData";

export default class Longstrider extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          durationSeconds: 3600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.customChange("+10", 30, "system.attributes.movement.all"),
        ],
      },
    ];
  }

}
