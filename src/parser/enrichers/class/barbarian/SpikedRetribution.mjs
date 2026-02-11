/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SpikedRetribution extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      type: "damage",
      activationType: "bonus",
      rangeSelf: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "3",
              types: ["piercing"],
            }),
          ],
        },
        range: {
          value: 5,
          units: "ft",
        },
        target: {
          affects: {
            type: "enemy",
          },
        },
      },
    };
  }

}
