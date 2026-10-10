import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Barrow Guard Spectral Shrieking: a creature Grappled by Soul Reaper takes Psychic damage equal to
 * your proficiency bonus at the start of its turn, and a Reaction can spend a Draugr Die to add its roll.
 */
export default class TombCastellanSpectralShrieking extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Spectral Shrieking",
      targetType: "creature",
      targetCount: 1,
      noTemplate: true,
      activationType: "special",
      activationCondition: "A creature Grappled by your Soul Reaper starts its turn",
      noConsumeTargets: true,
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ customFormula: "@prof", types: ["psychic"] })],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Spectral Shrieking: Draugr Die",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateDamage: true,
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "@scale.barrow-guard.death-knight", types: ["psychic"] })],
          activationOverride: { type: "reaction", value: 1, condition: "Spectral Shrieking damages a creature" },
        },
        overrides: {
          targetType: "creature",
          targetCount: 1,
          noTemplate: true,
          addItemConsume: true,
          itemConsumeTargetName: "death-knight",
        },
      },
    ];
  }

}
