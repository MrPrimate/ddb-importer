/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SneakAttack extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      noTemplate: true,
      data: {
        "range.units": "spec",
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.rogue.sneak-attack",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }
}
