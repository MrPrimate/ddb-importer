import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Airbag (OTFY): a reaction that reduces the triggering Bludgeoning, Piercing or Slashing damage by
 * 1d6, plus 1d6 per slot level above 1. The roll is the amount to take off the damage before it is
 * applied, so it is a plain roll rather than healing.
 */
export default class Airbag extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Reduce Damage",
      targetType: "creature",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "(1 + @scaling.increase)d6",
          name: "Damage Reduced",
        },
      },
    };
  }

}
