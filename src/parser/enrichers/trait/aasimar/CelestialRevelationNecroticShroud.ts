import DDBEnricherData from "../../data/DDBEnricherData";

export default class CelestialRevelationNecroticShroud extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      targetType: "enemy",
      data: {
        save: {
          ability: ["cha"],
          dc: {
            calculation: "cha",
            formula: "",
          },
        },
      },
    };
  }

}
