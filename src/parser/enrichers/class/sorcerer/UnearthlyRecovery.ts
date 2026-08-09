import DDBEnricherData from "../../data/DDBEnricherData";

export default class UnearthlyRecovery extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
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

