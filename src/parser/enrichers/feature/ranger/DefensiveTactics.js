/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class DefensiveTactics extends DDBEnricherMixin {

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
      data: {
        "flags.ddbimporter.retainOriginalConsumption": true,
        "system.uses": {
          value: "0",
          max: "1",
          recovery: [
            { period: "sr", type: 'recoverAll', formula: undefined },
          ],
        },
      },
    };
  }

}
