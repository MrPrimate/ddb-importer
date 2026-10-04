import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Living Crucible: a bonus action ends Poisoned on yourself, and once per long rest doing so grants
 * Temporary Hit Points equal to your Fighter level. Poison resistance comes from DDB's modifier.
 */
export default class ToxinTransmutation extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "End Poisoned",
      targetType: "self",
      activationType: "bonus",
      noConsumeTargets: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Gain Temporary Hit Points",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "You end the Poisoned condition on yourself with Toxin Transmutation",
          },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "@classes.fighter.levels", types: ["temphp"] }),
        },
        overrides: {
          targetSelf: true,
          addItemConsume: true,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Gain Temporary Hit Points",
        max: "1",
        period: "lr",
      }),
    };
  }

}
