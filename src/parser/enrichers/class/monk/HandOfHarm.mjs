/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HandOfHarm extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Hand of Harm",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.monk.martial-arts.die",
              type: "necrotic",
            }),
          ],
        },
      },
    };
  }

}
