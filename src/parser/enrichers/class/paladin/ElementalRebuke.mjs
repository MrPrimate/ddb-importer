/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ElementalRebuke extends DDBEnricherData {

  get activity() {
    return {
      activationType: "reaction",
      targetType: "creature",
      data: {
        damage: {
          parts: DDBEnricherData.basicDamagePart({
            number: 2,
            denomination: 10,
            bonus: "@abilities.cha.mod",
            types: ["acid", "cold", "lightning", "thunder"],
          }),
          onSave: "half",
          range: {
            units: "spec",
          },
        },
      },
    };
  }

}
