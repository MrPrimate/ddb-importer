/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PartiallyAmphibious extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      activationType: "special",
      addItemConsume: true,
    };
  }

  get effects() {
    return [
      {
        data: {
          "duration.rounds": 600,
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        "system.uses": {
          spent: 0,
          max: "1",
          recovery: [
            {
              period: "lr",
              type: "recoverAll",
            },
          ],
        },
        "flags.midiProperties.toggleEffect": true,
      },
    };
  }

}
