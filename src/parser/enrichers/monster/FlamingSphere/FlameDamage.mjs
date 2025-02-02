/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FlameDamage extends DDBEnricherData {
  get type() {
    return "save";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Any creature that ends its turn within 5 feet of the sphere ",
      data: {
        range: {
          units: "ft",
          value: "5",
        },
        save: {
          ability: ["dex"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              bonus: "",
              types: ["fire"],
            }),
          ],
        },
      },
    };
  }

}
