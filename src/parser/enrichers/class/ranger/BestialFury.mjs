/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class BestialFury extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {

    const hasFoeSlayer = this.is2024 && this.hasClassFeature({ featureName: "Foe Slayer", className: "Ranger" });
    const denomination = hasFoeSlayer
      ? 10
      : 6;

    return {
      targetType: "creature",
      data: {
        damage: {
          parts: DDBEnricherData.basicDamagePart({ number: 1, denomination, types: ["force"] }),
        },
      },
    };
  }

}
