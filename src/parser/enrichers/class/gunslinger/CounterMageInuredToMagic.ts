import DDBEnricherData from "../../data/DDBEnricherData";

export default class CounterMageInuredToMagic extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "reaction",
      activationCondition: "You fail a saving throw against a spell or magical effect",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d6",
          name: "Saving Throw Bonus",
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        name: "Inured to Magic",
      },
    };
  }

}
