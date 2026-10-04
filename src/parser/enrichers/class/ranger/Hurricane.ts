import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Rocborne: a Reaction to damage gives you resistance to it, and creatures of your choice within 15
 * feet make a Strength save against your spell save DC or take Bludgeoning damage equal to your Ranger
 * level and fall Prone; half damage and no Prone on a success.
 */
export default class Hurricane extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "reaction",
      activationCondition: "You take damage",
      addItemConsume: true,
      data: {
        range: { override: true, units: "self" },
        target: {
          override: true,
          affects: { type: "creature", choice: true },
          template: { type: "radius", size: "15", units: "ft", contiguous: false },
        },
        save: {
          ability: ["str"],
          dc: { calculation: "spellcasting", formula: "" },
        },
        damage: {
          onSave: "half",
          parts: [DDBEnricherData.basicDamagePart({ customFormula: "@classes.ranger.levels", types: ["bludgeoning"] })],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [{ name: "Hurricane: Prone", statuses: ["Prone"] }];
  }

}
