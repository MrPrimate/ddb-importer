/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DraconicFlight extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Draconic Flight",
        options: {
          durationSeconds: 600,
        },
        changes: [
          this.movementChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
      },
    ];
  }

}
