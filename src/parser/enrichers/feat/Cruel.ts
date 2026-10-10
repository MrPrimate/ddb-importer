import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Cruel: proficiency bonus d6 cruelty dice, one per turn. Spent for extra damage (the activity), or
 * rolled for a saving throw penalty or an Intimidation bonus (the plain roll).
 */
export default class Cruel extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cruelty Die Damage",
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "You deal damage to a creature (one cruelty die per turn)",
      addItemConsume: true,
      data: {
        damage: { parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6 })] },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Cruelty Die",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateRoll: true,
          rollOverride: { name: "Cruelty Die", formula: "1d6", prompt: false, visible: true },
          activationOverride: {
            type: "special",
            value: 1,
            condition: "A creature saves against you (subtract) or you make an Intimidation check (add)",
          },
        },
        overrides: { addItemConsume: true },
      },
    ];
  }

}
