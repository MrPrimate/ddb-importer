import DDBEnricherData from "../../data/DDBEnricherData";

export default class KnowledgeFromAPastLife extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
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

  get override(): IDDBOverrideData {
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
