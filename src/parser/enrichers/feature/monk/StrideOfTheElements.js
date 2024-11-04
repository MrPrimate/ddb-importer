/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class StrideOfTheElements extends DDBEnricherMixin {

  get effects() {
    return [
      this.movementChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
      this.movementChange("@attributes.movement.walk", 20, "system.attributes.movement.swim"),
    ];
  }

}
