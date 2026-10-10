import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Crimson Dynasty: spend the Blood Well to add 1d8 to the damage or healing one target receives. It
 * refills on a long rest or when a creature takes 10 or more Necrotic damage from you at once.
 */
export default class BloodWell extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Add to Damage",
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "You deal damage to a creature",
      addItemConsume: true,
      data: {
        damage: { parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8 })] },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Add to Healing",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateHealing: true,
          healingPart: DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["healing"] }),
          activationOverride: { type: "special", value: 1, condition: "You restore Hit Points to a creature" },
        },
        overrides: {
          targetType: "creature",
          targetCount: 1,
          addItemConsume: true,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Blood Well",
        max: "1",
        period: "lr",
      }),
    };
  }

}
