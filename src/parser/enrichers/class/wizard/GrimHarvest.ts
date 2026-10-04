import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * School of Necromancy: killing a creature with a spell of 1st level or higher heals twice the
 * spell's level, three times for a Necromancy spell. Nothing records the killing spell, so each
 * activity scales on its own: the user picks the spell level as the scaling step (step 0 is 1st
 * level). Both spend the feature's single use, which refills on every turn ("once per turn", not
 * only the wizard's own turn).
 */
export default class GrimHarvest extends DDBEnricherData {

  static healingActivity(multiplier: number): IDDBActivityData {
    return {
      targetType: "self",
      rangeSelf: true,
      activationType: "special",
      activationCondition: "Once per turn, you kill one or more creatures (not constructs or undead) with a spell of 1st level or higher",
      addItemConsume: true,
      data: {
        consumption: {
          scaling: {
            allowed: true,
            max: "8",
          },
        },
        healing: GrimHarvest.healingPart(multiplier),
      },
    };
  }

  static healingPart(multiplier: number): I5eDamagePart {
    return DDBEnricherData.basicDamagePart({
      customFormula: `${multiplier}`,
      types: ["healing"],
      scalingMode: "whole",
      scalingFormula: `${multiplier}`,
    });
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      ...GrimHarvest.healingActivity(2),
      name: "Spell Kill",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Necromancy Spell Kill",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          generateHealing: true,
          healingPart: GrimHarvest.healingPart(3),
        },
        overrides: GrimHarvest.healingActivity(3),
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [{ period: "turn", type: "recoverAll" }],
      },
    };
  }

}
