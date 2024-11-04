/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class RelentlessAvenger extends DDBEnricherMixin {

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
        DDBEnricherMixin.generateOverrideChange("0", 90, "system.attributes.movement.walk"),
      ],
    }];
  }


}
