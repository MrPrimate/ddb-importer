import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * On finishing a Short Rest, regain Sorcery Points: 4 in 2014 (once per short rest), up to half the
 * sorcerer level in 2024 (once per long rest, DDB's own use). The first target names the pool so the
 * replaceActivityUses linking resolves it; the second spends the feature's use.
 */
export default class SorcerousRestoration extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: "When you finish a Short Rest",
      noConsumeTargets: true,
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "Sorcery Points",
          value: this.is2014 ? "-4" : "-(floor(@classes.sorcerer.levels / 2))",
          scaling: {
            mode: "",
            formula: "",
          },
        },
        {
          type: "itemUses",
          target: "",
          value: "1",
          scaling: {
            mode: "",
            formula: "",
          },
        },
      ],
    };
  }

  get override(): IDDBOverrideData {
    return {
      retainChildUses: true,
      replaceActivityUses: true,
      uses: this.is2014
        ? this._getUsesWithSpent({
          type: "class",
          name: "Sorcerous Restoration",
          max: "1",
          period: "sr",
        })
        : undefined,
    };
  }

}
