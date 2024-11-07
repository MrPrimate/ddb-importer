/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class SuperiorHuntersPrey extends DDBEnricherMixin {

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
      noTemplate: true,
      data: {
        damage: {
          parts: DDBEnricherMixin.basicDamagePart({ number: 1, denomination, types: ["force"] }),
        },
      },
    };
  }

}