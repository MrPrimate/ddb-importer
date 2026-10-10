import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Eldritch Domain: an attempt to read your thoughts fails, and the reader makes a Wisdom save against
 * your spell save DC or takes Psychic damage equal to your Cleric level. The resistance and the save
 * advantages come from DDB's modifiers.
 */
export default class OtherworldlyCalm extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Thought Reader's Backlash",
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "A creature tries to read your thoughts",
      data: {
        save: {
          ability: ["wis"],
          dc: { calculation: "spellcasting", formula: "" },
        },
        damage: {
          onSave: "none",
          parts: [
            DDBEnricherData.basicDamagePart({ customFormula: "@classes.cleric.levels", types: ["psychic"] }),
          ],
        },
      },
    };
  }

}
