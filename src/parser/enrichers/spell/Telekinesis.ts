import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Telekinesis: moving a creature is a Strength save against the spell save DC; DDB ships the spell as a bare utility.
 */
export default class Telekinesis extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Move Creature or Object",
      targetType: "creatureOrObject",
      targetCount: 1,
      data: {
        save: {
          ability: ["str"],
          dc: { calculation: "spellcasting", formula: "" },
        },
      },
    };
  }

}
