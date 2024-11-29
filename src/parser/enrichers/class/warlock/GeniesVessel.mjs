/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class GeniesVessel extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    const types = [];
    if (this.ddbParser.originalName.includes("Dao")) types.push("bludgeoning");
    else if (this.ddbParser.originalName.includes("Djinni")) types.push("thunder");
    else if (this.ddbParser.originalName.includes("Efreeti")) types.push("fire");
    else if (this.ddbParser.originalName.includes("Marid")) types.push("cold");
    return {
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@prof",
              types,
            }),
          ],
        },
      },
    };
  }
}
