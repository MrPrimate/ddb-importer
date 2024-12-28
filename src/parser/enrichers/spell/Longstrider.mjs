/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Longstrider extends DDBEnricherData {

  get effects() {
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
