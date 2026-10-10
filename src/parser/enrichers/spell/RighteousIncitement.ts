import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Magus Class cantrip. DDB lists the Radiant and Psychic dice together, but the Psychic
 * damage only lands if the target does not attack the caster before the end of its next turn, so
 * it is a separate activity.
 */
export default class RighteousIncitement extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      splitDamage: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Incitement Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          partialDamageParts: [1],
          activationOverride: { type: "special", value: null, condition: "The target failed the save and did not attack you before the end of its next turn" },
        },
        overrides: {
          noeffect: true,
        },
      },
    ];
  }

}
