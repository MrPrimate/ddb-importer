import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlazingRevival extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Healing",
      activationType: "special",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "floor(@attributes.hp.max / 2)",
          types: ["healing"],
        }),
      },
    };
  }

}

