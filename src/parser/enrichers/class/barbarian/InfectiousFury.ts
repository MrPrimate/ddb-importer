import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Infectious Fury (Path of the Beast, 2014): on a natural-weapon hit the target makes a Wisdom
 * save against a Constitution-based DC; on a failure it either takes 2d12 psychic damage or is
 * compelled to attack another creature. DDB ships a damage-only action, so the save is missing.
 */
export default class InfectiousFury extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: "When you hit a creature with your natural weapons while raging",
      targetType: "creature",
      targetCount: 1,
      rangeSelf: true,
      addItemConsume: true,
      data: {
        save: {
          ability: ["wis"],
          dc: {
            calculation: "con",
            formula: "",
          },
        },
        damage: {
          onSave: "none",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 12,
              types: ["psychic"],
            }),
          ],
        },
      },
    };
  }

}
