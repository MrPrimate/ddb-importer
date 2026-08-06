import DDBEnricherData from "../../data/DDBEnricherData";

export default class RefractionShield extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Refraction Shield",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Sorcery Points",
      itemConsumeValue: "3",
      data: {
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Shield Flash Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
        },
        overrides: {
          noConsumeTargets: true,
          targetType: "creature",
          activationType: "special",
          activationCondition: "A creature within 5 feet of you hits you with a melee attack",
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 2,
                  denomination: 8,
                  types: ["radiant", "necrotic"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Refraction Shield",
        activityMatch: "Refraction Shield",
        options: {
          durationSeconds: 600,
          description: "When a creature within 5 feet hits you with a melee attack, it takes 2d8 Radiant damage (light-shifted) or 2d8 Necrotic damage (dark-shifted). Ends if you fall unconscious or after 10 minutes.",
        },
      },
    ];
  }

}
