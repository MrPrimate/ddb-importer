/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ElementalBurst extends DDBEnricherData {
  get activity() {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.elements.elemental-burst",
              types: ["acid", "cold", "fire", "lightning", "thunder"],
            }),
          ],
        },
      },
    };
  }
}
