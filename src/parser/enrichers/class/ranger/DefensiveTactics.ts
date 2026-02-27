import DDBEnricherData from "../../data/DDBEnricherData";

export default class DefensiveTactics extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Choice",
      addItemConsume: true,
      targetType: "self",
      activationType: "special",
      activationCondition: "Finish a short or long rest",
    };
  }

  get effects() {
    return [
      {
        name: "Escape the Horde",
        data: {
          "flags.ddbimporter.activityMatch": "Choice",
        },
      },
      {
        name: "Multiattack Defense",
        data: {
          "flags.ddbimporter.activityMatch": "Choice",
        },
      },
    ];
  }

  get override() {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [
          { period: "sr", type: 'recoverAll', formula: undefined },
        ],
      },
      retainOriginalConsumption: true,
    };
  }

}
