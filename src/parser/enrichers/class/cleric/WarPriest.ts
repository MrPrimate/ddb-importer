import DDBEnricherData from "../../data/DDBEnricherData";

export default class WarPriest extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "War Priest: Bonus Attack",
      max: "max(1, @abilities.wis.mod)",
      period: "sr",
    });

    return {
      uses,
    };
  }

}
