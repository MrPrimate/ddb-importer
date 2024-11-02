/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class CelestialRevelationRadiantSoul extends DDBEnricherMixin {

  get type() {
    return "damage";
  }

  get activity() {
    const customFormula = foundry.utils.getProperty(this.data, "flags.ddbimporter.type") === "class"
      ? "@abilities.cha.mod"
      : "@prof";
    return {
      activationType: "special",
      damageParts: [
        DDBEnricherMixin.basicDamagePart({
          customFormula,
          type: "radiant",
        }),
      ],
    };
  }

}
