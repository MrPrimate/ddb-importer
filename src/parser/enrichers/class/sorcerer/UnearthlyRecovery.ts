import DDBEnricherData from "../../data/DDBEnricherData";

export default class UnearthlyRecovery extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity() {
    return {
      name: "Healing",
      activationType: "bonus",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "floor(@attributes.hp.max / 2)",
          types: ["healing"],
        }),
      },
    };
  }

}

