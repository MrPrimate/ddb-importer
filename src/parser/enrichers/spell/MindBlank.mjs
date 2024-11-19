/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class MindBlank extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.generateUnsignedAddChange("psychic", 20, "system.traits.di.value"),
        ],
      },
    ];
  }

}
