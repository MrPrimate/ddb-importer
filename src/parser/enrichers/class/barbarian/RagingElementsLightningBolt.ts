import _RagingElements from "./_RagingElements";

/** Raging Elements: Lightning Bolt, a Dex save (DC 8 + Con mod + PB) for Rage Damage d6s of Lightning, half on a success. */
export default class RagingElementsLightningBolt extends _RagingElements {

  get dieFaces(): number {
    return 6;
  }

  get damageType(): string {
    return "lightning";
  }

  override get type(): IDDBActivityType | null {
    return _RagingElements.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Lightning Bolt",
      activationType: "bonus",
      targetType: "creature",
      data: {
        range: { units: "ft", value: "30" },
        save: {
          ability: ["dex"],
          dc: { calculation: "con", formula: "" },
        },
        damage: {
          onSave: "half",
          parts: this.damageParts,
        },
      },
    };
  }

}
