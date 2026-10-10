import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Sidereal Cabal level 14. A creature within 60 feet rolling with Advantage or Disadvantage rolls
 * a third d20. Once per Short or Long Rest; Starfinder's Weave Destiny (level 20) makes it three
 * uses, one back on a Short Rest and all on a Long Rest.
 */
export default class SealFate extends DDBEnricherData {

  get hasWeaveDestiny(): boolean {
    return this.hasClassFeature({ featureName: "Starfinder", className: "Magus" });
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Seal Fate",
      activationType: "special",
      activationCondition: "A creature you can see within 60 feet makes a roll with Advantage or Disadvantage; it rolls three d20s",
      targetType: "creature",
      targetCount: 1,
      rangeValue: 60,
      rangeType: "ft",
      addItemConsume: true,
    };
  }

  override get override(): IDDBOverrideData {
    const spent = this._getSpentValue("class", "Seal Fate") ?? 0;
    return {
      uses: this.hasWeaveDestiny
        ? {
          spent,
          max: "3",
          recovery: [
            { period: "lr", type: "recoverAll", formula: undefined },
            { period: "sr", type: "formula", formula: "1" },
          ],
        }
        : {
          spent,
          max: "1",
          recovery: [{ period: "sr", type: "recoverAll", formula: undefined }],
        },
    };
  }

}
