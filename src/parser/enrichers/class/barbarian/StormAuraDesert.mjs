/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class StormAuraDesert extends DDBEnricherData {
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
              customFormula: "@scale.storm-herald.storm-aura-desert",
              types: ["fire"],
            }),
          ],
        },
        target: {
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
      },
    };
  }

}
