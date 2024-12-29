/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HandOfHealing extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Hand of Healing",
      activationType: "special",
      targetType: "creature",
      data: {
        "range.units": "touch",
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.monk.martial-arts.die + @abilities.wis.mod",
          type: "healing",
        }),
      },
    };
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.skipScale": true,
      },
    };
  }

}
