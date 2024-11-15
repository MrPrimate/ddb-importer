/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class RelentlessAvenger extends DDBEnricherData {

  get activity() {
    return {
      name: "Reduce Speed",
      type: "utility",
      targetType: "creature",
    };
  }

  get effects() {
    return [{
      name: "Relentless Avenger: Speed Reduction",
      options: {
        durationSeconds: 6,
      },
      changes: [
        DDBEnricherData.generateOverrideChange("0", 90, "system.attributes.movement.walk"),
      ],
    }];
  }


}
