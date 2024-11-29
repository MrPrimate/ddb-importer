/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class WarPriest extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get override() {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "War Priest: Bonus Attack",
      max: "max(1, @abilities.wis.mod)",
      period: "sr",
    });

    return {
      data: {
        "system.uses": uses,
      },
    };
  }

}
