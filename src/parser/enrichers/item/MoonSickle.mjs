/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class MoonSickle extends DDBEnricherData {

  get effects() {
    return [
      {
        noCreate: true,
        changes: [
          DDBEnricherData.generateUnsignedAddChange("+4", 20, "system.bonuses.heal.damage"),
        ],
      },
    ];
  }

}
