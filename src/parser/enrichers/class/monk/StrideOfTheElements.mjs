/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class StrideOfTheElements extends DDBEnricherData {

  get effects() {
    return [
      this.movementChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
      this.movementChange("@attributes.movement.walk", 20, "system.attributes.movement.swim"),
    ];
  }

}
