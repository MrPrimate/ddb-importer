import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Conjurer (AU 2024): a native teleport on the Transposition Distance scale (30 ft, 60 ft at
 * level 6) with Intelligence-modifier uses. The 2014 School of Conjuration feature keeps its
 * DDB defaults.
 */
export default class BenignTransposition extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2024 ? DDBEnricherData.ACTIVITY_TYPES.TELEPORT : null;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return this.is2014;
  }

  override get addAutoAdditionalActivities(): boolean {
    return this.is2014;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    return {
      name: "Benign Transposition",
      activationType: "bonus",
      overrideActivation: true,
      addItemConsume: true,
      data: {
        range: { override: true, value: "@scale.conjurer.benign-transposition", units: "ft", special: "" },
        target: {
          override: true,
          prompt: false,
          affects: { count: "1", type: "self" },
          template: {},
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    if (this.is2014) return {};
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Benign Transposition",
        max: "max(1, @abilities.int.mod)",
        period: "lr",
      }),
    };
  }

}
