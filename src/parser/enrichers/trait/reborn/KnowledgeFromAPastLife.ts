import DDBEnricherData from "../../data/DDBEnricherData";

export default class KnowledgeFromAPastLife extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d6",
          name: "Bonus to Roll",
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      type: "race",
      name: "Knowledge from a Past Life",
      max: "@prof",
      period: "lr",
    });

    return {
      uses,
    };
  }

}
