/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class HeroesFeast extends DDBEnricherData {

  get activity() {
    return {
      data: {
        duration: {
          value: 1,
          units: "day",
          override: true,
        },
      },
    };
  }

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.generateUnsignedAddChange("frightened", 20, "system.traits.ci.value"),
          DDBEnricherData.generateUnsignedAddChange("poisoned", 20, "system.traits.ci.value"),
          DDBEnricherData.generateUnsignedAddChange("poison", 20, "system.traits.di.value"),
        ],
      },
    ];
  }

}
