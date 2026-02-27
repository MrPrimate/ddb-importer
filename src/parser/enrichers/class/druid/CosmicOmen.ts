import DDBEnricherData from "../../data/DDBEnricherData";

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
      uses: {
        spent: null,
        max: "@abilities.wis.mod",
        recovery: [{ period: "lr", type: 'recoverAll', formula: "" }],
      },
      retainOriginalConsumption: true,
    };
  }

}
