/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class SpiderClimb extends DDBEnricherMixin {

  get effects() {
    return [{
      changes: [
        this.movementChange("@attributes.movement.walk", 20, "system.attributes.movement.climb"),
      ],
    }];
  }

}
