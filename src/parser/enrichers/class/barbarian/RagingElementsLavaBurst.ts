import _RagingElements from "./_RagingElements";

/** Raging Elements: Lava Burst, a Dex save (DC 8 + Con mod + PB) for Rage Damage d4s of Fire, half on a success. */
export default class RagingElementsLavaBurst extends _RagingElements {

  get dieFaces(): number {
    return 4;
  }

  get damageType(): string {
    return "fire";
  }

  override get type(): IDDBActivityType | null {
    return _RagingElements.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Lava Burst",
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
