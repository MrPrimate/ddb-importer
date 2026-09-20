import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Perfected Armor (Armorer, 2014): the Guardian reaction pull and the Infiltrator lightning
 * launcher rider both key off the same proficiency-bonus pool per long rest. DDB ships no
 * action, so the feature imported with nothing usable. The 2024 printing is passive.
 */
export default class PerfectedArmor extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.is2014) return null;
    return {
      name: "Perfected Armor",
      activationType: "reaction",
      activationCondition: "Guardian: a Huge or smaller creature you can see ends its turn within 30 feet (Strength save or be pulled); Infiltrator: a creature hit by your Lightning Launcher",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 30,
      addItemConsume: true,
    };
  }

  override get override(): IDDBOverrideData | null {
    if (!this.is2014) return null;
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: this.ddbParser.originalName,
        max: "@prof",
        period: "lr",
      }),
    };
  }

}
