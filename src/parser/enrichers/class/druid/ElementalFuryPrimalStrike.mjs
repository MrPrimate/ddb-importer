/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ElementalFuryPrimalStrike extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      activationOverride: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.druid.elemental-fury",
              types: ["cold", "fire", "lighting", "thunder"],
            }),
          ],
        },
      },
    };
  }
}
