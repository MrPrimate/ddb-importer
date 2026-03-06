import DDBEnricherData from "../../data/DDBEnricherData";

export default class UndyingSentinel extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
      addItemConsume: true,
      targetType: "self",
      activationType: "special",
      activationCondition: "Reduced to 0 HP",
      data: {
        healing: DDBEnricherData.basicDamagePart({ customFormula: "3 * @classes.paladin.levels", types: ["healing"] }),
      },
    };
  }

}
