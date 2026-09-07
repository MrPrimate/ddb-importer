import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Arcane Archer. In the AU 2024 printing the chosen shot options hang directly off this feature,
 * so the default action match would pile every option's activity onto the pool; instead the pool
 * gets one "Arcane Shot" utility that spends a use, mirroring the 2014 shape. DDB's own
 * "Arcane Shot (Use)" action carries the Intelligence-modifier uses without the minimum of one,
 * so the uses are set here. The 2014 printing keeps its DDB defaults.
 */
export default class ArcaneShot extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2024 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : null;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    return {
      name: "Arcane Shot",
      activationType: "special",
      noTemplate: true,
      addItemConsume: true,
    };
  }

  override get useDefaultAdditionalActivities(): boolean {
    return this.is2014;
  }

  override get addAutoAdditionalActivities(): boolean {
    return this.is2014;
  }

  override get clearAutoEffects(): boolean {
    return this.is2024;
  }

  override get override(): IDDBOverrideData {
    if (this.is2014) return {};
    return {
      uses: {
        spent: null,
        max: "max(1, @abilities.int.mod)",
        recovery: [{ period: "sr", type: "recoverAll" }],
      },
    };
  }

}
