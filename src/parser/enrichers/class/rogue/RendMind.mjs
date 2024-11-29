/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class RendMind extends DDBEnricherData {

  get activity() {
    if (this.is2014) {
      return {
        addItemConsume: true,
      };
    } else {
      return {
        addItemConsume: true,
        data: {
          save: {
            dc: { formula: "", calculation: "dex" },
            ability: ["wis"],
          },
        },
      };
    }
  }

  get effects() {
    return [];
  }

  get additionalActivities() {
    return [];
    //   return this.is2014
    //     ? [

    //     ]
    //     : [
    //       { action: { name: "Psychic Blades: Rend Mind", type: "class" } },
    //     ];
  }

  get override() {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Psychic Blades: Rend Mind",
      max: "1",
      period: "lr",
    });

    return {
      data: {
        "system.uses": uses,
      },
    };
  }

}
