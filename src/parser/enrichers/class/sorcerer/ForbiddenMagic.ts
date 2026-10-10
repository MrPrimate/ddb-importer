import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Apocalypse Sorcery: casting a Sorcerer spell with a slot can take one cost. Excessive deals Force
 * damage of twice the slot level to you, Pyrrhic lowers your Hit Point maximum by four times it, and
 * Inexorable costs an Exhaustion level when the spell ends. Nothing records the slot, so the scaling
 * step is the slot level minus one. dnd5e 5.2 has no "maximum" damage type (any other type comes off
 * current Hit Points), so Pyrrhic only rolls the reduction for the player to apply.
 */
export default class ForbiddenMagic extends DDBEnricherData {

  static selfDamage(name: string, multiplier: number, damageType: string, condition: string): IDDBActivityData {
    return {
      name,
      targetType: "self",
      rangeSelf: true,
      activationType: "special",
      activationCondition: condition,
      data: {
        consumption: {
          targets: [],
          scaling: { allowed: true, max: "9" },
        },
        damage: {
          parts: [ForbiddenMagic.selfDamagePart(multiplier, damageType)],
        },
      },
    };
  }

  static selfDamagePart(multiplier: number, damageType: string): I5eDamagePart {
    return DDBEnricherData.basicDamagePart({
      customFormula: `${multiplier}`,
      types: [damageType],
      scalingMode: "whole",
      scalingFormula: `${multiplier}`,
    });
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return ForbiddenMagic.selfDamage("Excessive", 2, "force", "You cast a Sorcerer spell without its costly Material component (ignores Resistance and Immunity)");
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Pyrrhic",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateRoll: true,
          rollOverride: {
            prompt: false,
            visible: true,
            name: "Hit Point Maximum Reduction",
            formula: "4 + (4 * @scaling)",
          },
        },
        overrides: {
          name: "Pyrrhic",
          targetType: "self",
          rangeSelf: true,
          activationType: "special",
          activationCondition: "Your Sorcerer spell's attack automatically hits as a Critical Hit; your Hit Point maximum drops by the roll until you finish a Long Rest",
          data: {
            consumption: {
              targets: [],
              scaling: { allowed: true, max: "9" },
            },
          },
        },
      },
      {
        init: {
          name: "Inexorable",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "Taking damage can't break Concentration on the spell; gain 1 Exhaustion level when it ends",
          },
        },
        overrides: {
          targetSelf: true,
        },
      },
    ];
  }

}
