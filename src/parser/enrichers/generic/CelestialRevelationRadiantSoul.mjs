/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class CelestialRevelationRadiantSoul extends DDBEnricherData {

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
        DDBEnricherData.basicDamagePart({
          customFormula,
          type: "radiant",
        }),
      ],
    };
  }

}
