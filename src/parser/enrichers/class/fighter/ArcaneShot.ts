import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Arcane Archer. The AU 2024 printing ships no limitedUse and no "Arcane Shot" action, and the
 * chosen shot options hang directly off this feature, so the default action match would pile
 * every option's activity onto the pool. The 2014 printing keeps its DDB defaults.
 */
export default class ArcaneShot extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2024 ? DDBEnricherData.ACTIVITY_TYPES.NONE : null;
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
