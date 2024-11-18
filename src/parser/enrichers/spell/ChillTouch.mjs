/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ChillTouch extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.generateUnsignedAddChange("healing", 30, "system.traits.di.value"),
        ],
      },
    ];
  }

}
