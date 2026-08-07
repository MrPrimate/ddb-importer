import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Curse of Strahd. The axe's restricted-attack variants parse as four wordy
 * duplicates; collapse them into a plain attack, a plant-specific attack, and
 * the thorn damage the wielder takes.
 */
export default class YesterHillAxe extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Attack vs Plant",
          activationCondition: "The axe hits a plant, whether an ordinary plant or a plant creature",
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
              types: ["slashing"],
            }),
          ],
        },
      },
      {
        init: {
          name: "Thorns",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateTarget: true,
          generateActivation: true,
          noeffect: true,
          allowCritical: false,
          activationOverride: {
            type: "special",
            value: null,
            condition: "You grasp the axe",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              bonus: "1",
              types: ["piercing"],
            }),
          ],
        },
        overrides: {
          targetType: "self",
          rangeSelf: true,
          noConsumeTargets: true,
        },
      },
    ];
  }

}
