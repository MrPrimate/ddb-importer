import DDBEnricherData from "../../data/DDBEnricherData";

export default class WarPriest extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get override() {
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
