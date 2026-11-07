import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Path of the Spiritual Guardian (World of Warcraft) and the WoW Shaman's Enhancement
 * Specialization: while raging, a creature hit by a weapon or Unarmed Strike suffers a chosen spirit
 * effect. Strike is an extra 1d4 Cold, Fire or Lightning; Distract gives it Disadvantage on attacks
 * against others until the start of the barbarian's next turn; Hinder (the Slow mastery) is text.
 */
export default class SpiritualProtectors extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Strike",
      activationType: "special",
      activationCondition: "While raging, you hit a creature with a weapon or an Unarmed Strike",
      targetType: "creature",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["cold", "fire", "lightning"] }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Distract", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "While raging, you hit a creature with a weapon or an Unarmed Strike",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Spiritual Protectors: Distracted",
        activityMatch: "Distract",
        options: {
          transfer: false,
          expiry: "sourceStart",
          description: "Disadvantage on attack rolls against targets other than the barbarian (or another Barbarian with this feature).",
        },
      },
    ];
  }

}
