/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class HeroesFeast extends DDBEnricherMixin {

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
          DDBEnricherMixin.generateUnsignedAddChange("frightened", 20, "system.traits.ci.value"),
          DDBEnricherMixin.generateUnsignedAddChange("poisoned", 20, "system.traits.ci.value"),
          DDBEnricherMixin.generateUnsignedAddChange("poison", 20, "system.traits.di.value"),
        ],
      },
    ];
  }

}
