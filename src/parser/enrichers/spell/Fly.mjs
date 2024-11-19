/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Fly extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.generateUpgradeChange("60", 20, "system.attributes.movement.fly"),
        ],
      },
    ];
  }

}