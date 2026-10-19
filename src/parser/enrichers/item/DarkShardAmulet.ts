import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Casting an unknown Warlock cantrip hinges on a DC 10 Intelligence (Arcana) check, and the use is
 * spent whether or not it succeeds.
 */
export default class DarkShardAmulet extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Unknown Spell",
      activationType: "action",
      activationCondition: "Cast a Warlock cantrip you don't know (a casting time of an action)",
      overrideActivation: true,
      addItemConsume: true,
      targetType: "self",
      data: {
        check: {
          ability: "int",
          associated: ["arc"],
          dc: { calculation: "", formula: "10" },
        },
      },
    };
  }

}
