/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class SpiritShroud extends DDBEnricherMixin {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      damageParts: [
        DDBEnricherMixin.basicDamagePart({ number: 1, denomination: 8, types: ["radiant", "necrotic", "cold"], scalingMode: "half", scalingNumber: "1" }),
      ],
    };
  }

}
