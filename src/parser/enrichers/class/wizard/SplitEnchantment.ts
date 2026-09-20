import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Enchanter (AU 2024) level 6: an Enchantment spell that gains targets at higher levels can be
 * cast one level higher, Intelligence-modifier times per long rest.
 * Modelled as slot bookkeeping: the activity spends the slot the spell is cast with and refunds one
 * of the level above, which the player then casts the spell with. One activity with level
 * scaling covers the eight slot pairs (level 1 into 2 up to level 8 into 9). The 2014 School of
 * Enchantment feature (a second target) keeps its DDB shape.
 */
export default class SplitEnchantment extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2024 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : null;
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
      name: "Cast One Level Higher",
      targetType: "self",
      activationType: "special",
      activationCondition: "When you use a spell slot to cast an Enchantment spell that can target an additional creature at a higher level: spend the slot here, then cast the spell with the higher slot this grants",
      addItemConsume: true,
      addConsumptionScalingMax: "7",
      additionalConsumptionTargets: [
        { type: "spellSlots", value: "1", target: "1", scaling: { mode: "level", formula: "" } },
        { type: "spellSlots", value: "-1", target: "2", scaling: { mode: "level", formula: "" } },
      ],
    };
  }

  override get override(): IDDBOverrideData {
    if (this.is2014) return {};
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Split Enchantment",
        max: "max(1, @abilities.int.mod)",
        period: "lr",
      }),
    };
  }

}
