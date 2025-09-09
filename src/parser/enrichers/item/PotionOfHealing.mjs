/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class PotionOfHealing extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      addItemConsume: true,
      activationType: this.is2014 ? "action" : "bonus",
      targetType: "creature",
      data: {
        range: {
          units: "touch",
        },
      },
    };
  }


  get override() {
    if (this.ddbParser.ddbDefinition.sources.some((s) => s.sourceId === 1)) {
      return {
        data: {
          "flags.ddbimporter": {
            is2014: true,
            is2024: false,
          },
          system: {
            source: {
              rules: "2014",
            },
          },
        },
      };
    }
    return {};
  }

}
