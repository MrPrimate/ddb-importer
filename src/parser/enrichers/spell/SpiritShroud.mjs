/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SpiritShroud extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["radiant", "necrotic", "cold"], scalingMode: "half", scalingNumber: "1" }),
      ],
    };
  }

  get effects() {
    return [{
      name: "Surrounded by a Spirit Shroud",
    }];
  }

}
