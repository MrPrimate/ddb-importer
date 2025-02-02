/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class MoveAndAttack extends DDBEnricherData {
  get type() {
    return "save";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "bonus",
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
