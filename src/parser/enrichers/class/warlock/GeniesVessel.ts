import DDBEnricherData from "../../data/DDBEnricherData";

export default class GeniesVessel extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
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
