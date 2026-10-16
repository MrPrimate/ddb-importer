import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Lords' Alliance feat: Standard Bearer (DDB's action) is once per long rest. DDB ships the action
 * with no action cost; the text says a Bonus Action.
 */
export default class LordlyResolve extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Standard Bearer", type: "feat" },
        overrides: {
          activationType: "bonus",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "feat",
        name: "Standard Bearer",
        max: "1",
        period: "lr",
      }),
    };
  }

}
