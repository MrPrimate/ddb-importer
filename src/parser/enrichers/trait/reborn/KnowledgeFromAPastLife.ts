import DDBEnricherData from "../../data/DDBEnricherData";

/** Reborn: a d6 added to a check, spending a use; it triggers off the check, so it is no action. */
export default class KnowledgeFromAPastLife extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
      activationType: "special",
      activationCondition: this.is2014
        ? "After seeing the d20 on an ability check that uses a skill"
        : "When you fail an ability check",
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
