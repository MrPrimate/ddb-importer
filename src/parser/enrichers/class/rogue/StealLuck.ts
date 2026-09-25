import DDBEnricherData from "../../data/DDBEnricherData";

export default class StealLuck extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  /** Improved Steal Luck (rogue 17) changes the recovery to a Long Rest. */
  get improved(): boolean {
    return this.hasClassFeature({ featureName: "Improved Steal Luck", className: "Rogue" });
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "A creature you can see within 30 feet is about to make a D20 Test with Advantage",
      addItemConsume: true,
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "Jinx Points",
          value: "-1",
          scaling: { mode: "", formula: "" },
        },
      ],
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
      // the subclass scale carries 1 use from level 9 and 3 from 17 (DDBSubClass SPECIAL_ADVANCEMENTS);
      // Improved Steal Luck recovers them on a Long Rest, before that one per Short or Long Rest.
      // A build without character data (compendium) keeps the level 9 recovery.
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Steal Luck",
        max: "@scale.misfortune-bringer.steal-luck",
        period: this.improved ? "lr" : "sr",
      }),
    };
  }

}
