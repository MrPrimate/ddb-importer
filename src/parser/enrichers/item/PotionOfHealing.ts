import DDBEnricherData from "../data/DDBEnricherData";

export default class PotionOfHealing extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
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


  get override(): IDDBOverrideData {
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
