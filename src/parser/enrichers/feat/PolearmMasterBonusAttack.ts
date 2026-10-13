import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The opposite-end attack: "Polearm Master - Bonus Attack" (2014) and "Pole Strike" (2024). DDB
 * sends the 2024 action as a general action, which the parser builds as damage with no attack roll.
 * The d4 replaces the weapon's die and the ability modifier still applies; a feat's attack has no
 * base weapon damage to carry it, so the part names `@mod` itself.
 */
export default class PolearmMasterBonusAttack extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
      activationType: "bonus",
      targetType: "creature",
      data: {
        range: {
          value: 10,
          units: "ft",
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 4,
              bonus: "@mod",
              types: ["bludgeoning"],
            }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [];
  }

  override get override(): IDDBOverrideData | null {
    return null;
  }
}
