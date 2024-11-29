/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class RagingStormDesert extends DDBEnricherData {
  get type() {
    return "save";
  }

  get activity() {
    return {
      type: "save",
      activationType: "reaction",
      targetType: "creature",
      rangeSelf: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "floor(@classes.barbarian.levels / 2)",
              types: ["fire"],
            }),
          ],
        },
        save: {
          ability: ["dex"],
          dc: {
            calculation: "con",
            formula: "",
          },
        },
        target: {
          affects: {
            count: "1",
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
          prompt: false,
        },
      },
    };
  }

}
