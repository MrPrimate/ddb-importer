/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Slow extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.generateSignedAddChange("-2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.generateSignedAddChange("-2", 20, "system.abilities.dex.bonuses.save"),
          DDBEnricherData.generateCustomChange("/2", 20, "system.attributes.movement.all"),
        ],
      },
    ];
  }

}