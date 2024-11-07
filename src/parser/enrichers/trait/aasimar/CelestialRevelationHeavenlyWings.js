/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class CelestialRevelationHeavenlyWings extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      activationType: "special",
    };
  }

  get effects() {
    return [{
      options: {
        durationSeconds: 60,
      },
      changes: [
        this.movementChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
      ],
    }];
  }

}
