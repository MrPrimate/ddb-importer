import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Shadow Domain (World of Warcraft) and the WoW Priest's Shadow Specialization: a Bonus Action
 * spending Channel Divinity for a 1 minute shadowy form. Void Empowerment's 1d6 Psychic or Necrotic
 * on a slot spell is its own damage activity.
 */
export default class Shadowform extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Shadowform",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      targetType: "self",
      data: {
        duration: { units: "minute", value: "1" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Void Empowerment",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateDamage: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "You cast a spell with a spell slot that deals Psychic or Necrotic damage while in Shadowform",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["psychic", "necrotic"] }),
          ],
        },
        overrides: {
          noConsumeTargets: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shadowform",
        activityMatch: "Shadowform",
        options: {
          durationSeconds: 60,
          description: "In Dim Light or Darkness you can take the Hide action as a Bonus Action. When you cast a slot spell dealing Psychic or Necrotic damage, add 1d6 to one damage roll. Ends early if you are Incapacitated or deal Radiant damage with a spell.",
        },
      },
    ];
  }

}
