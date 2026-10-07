import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Magus Class. A Magic action and a charge force a DC 13 Dexterity save from a creature
 * within 30 feet: 6d6 Piercing, half on a success, and the wearer regains Hit Points equal to the
 * Piercing damage dealt. DDB's modifier only gave a damage roll.
 */
export default class NecklaceOfFangs extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bite",
      activationType: "action",
      activationCondition: "You regain Hit Points equal to the Piercing damage dealt",
      targetType: "creature",
      targetCount: 1,
      rangeValue: 30,
      rangeType: "ft",
      addItemConsume: true,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 6, denomination: 6, types: ["piercing"], scalingMode: "none" }),
      ],
      data: {
        save: {
          ability: ["dex"],
          dc: { calculation: "", formula: "13" },
        },
        damage: { onSave: "half" },
      },
    };
  }

}
