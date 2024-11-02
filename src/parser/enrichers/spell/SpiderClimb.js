/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class SpiderClimb extends DDBEnricherMixin {

  get effect() {
    return {
      changes: [
        this.movementChange("@attributes.movement.walk", 20, "system.attributes.movement.climb"),
      ],
    };
  }

}
