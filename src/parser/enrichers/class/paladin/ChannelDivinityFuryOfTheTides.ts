import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Oath of the Open Sea Fury of the Tides: for a minute, once per turn a weapon hit can push the target
 * 10 feet; pushed into an obstacle or creature, it takes Bludgeoning damage equal to your Charisma
 * modifier. DDB's action keeps the Channel Divinity cost; the push damage spends nothing.
 */
export default class ChannelDivinityFuryOfTheTides extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Tidal Push Damage", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateDamage: true,
          activationOverride: { type: "special", value: 1, condition: "A creature you pushed 10 feet hits an obstacle or another creature" },
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "@abilities.cha.mod", types: ["bludgeoning"] })],
        },
        overrides: { targetType: "creature", targetCount: 1, noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Fury of the Tides",
        activityMatch: "Channel Divinity: Fury of the Tides",
        options: {
          durationSeconds: 60,
          description: "Once per turn, when you hit a creature with a weapon attack, you can push it 10 feet away from you. If it is pushed into an obstacle or another creature, it takes Bludgeoning damage equal to your Charisma modifier.",
        },
      },
    ];
  }

}
