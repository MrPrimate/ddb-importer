/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CosmicOmen extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "reaction",
      addItemConsume: true,
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d6",
          name: "Weal or Woe Roll",
        },
      },
    };
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.retainOriginalConsumption": true,
        system: {
          uses: {
            spent: null,
            max: "@abilities.wis.mod",
            reovery: [{ period: "lr", type: 'recoverAll', formula: "" }],
          },
        },
      },
    };
  }

}
