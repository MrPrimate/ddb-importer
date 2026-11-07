import _RagingElements from "./_RagingElements";

/** Raging Elements: Icefury, a Con-based spell attack for Rage Damage d8s of Cold. */
export default class RagingElementsIcefury extends _RagingElements {

  get dieFaces(): number {
    return 8;
  }

  get damageType(): string {
    return "cold";
  }

  override get type(): IDDBActivityType | null {
    return _RagingElements.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Icefury",
      activationType: "bonus",
      targetType: "creature",
      data: {
        range: { units: "ft", value: "30" },
        attack: {
          ability: "con",
          type: { value: "ranged", classification: "spell" },
        },
        damage: {
          includeBase: false,
          parts: this.damageParts,
        },
      },
    };
  }

}
