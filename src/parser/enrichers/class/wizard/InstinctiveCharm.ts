import Generic from "../Generic";

/**
 * Enchanter (AU 2024) level 10: the DDB reaction save is kept as built, and the once-per-long-rest
 * use comes back when an Enchantment spell is cast with a slot, so the buy-back is its own
 * activity. The 2014 School of Enchantment feature has no buy-back and keeps its DDB shape.
 * Extends Generic so the DDB action matching that builds the save still runs.
 */
export default class InstinctiveCharm extends Generic {

  override get addToDefaultAdditionalActivities(): boolean {
    return this.is2024;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    // the DDB action shares the feature's name, so the enricher also runs on the action copy;
    // the buy-back must only be added once, on the feature
    if (this.is2014 || this.isAction) return [];
    return [
      {
        init: {
          name: "Restore Use",
          type: Generic.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          activationOverride: { type: "special", value: null, condition: "After casting an Enchantment spell with a spell slot" },
        },
        overrides: {
          targetType: "self",
          addItemConsume: true,
          itemConsumeValue: "-1",
        },
      },
    ];
  }

}
