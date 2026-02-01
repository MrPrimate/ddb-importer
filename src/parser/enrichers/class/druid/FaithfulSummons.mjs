/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FaithfulSummons extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get activity() {
    return {
      addItemConsume: true,
      activationType: "special",
      noTemplate: true,
      data: {
        duration: {
          units: "hour",
          value: "1",
        },
        profiles: [
          {
            "count": "4",
            "cr": "2",
            "types": [
              "beast",
            ],
          },
        ],
        summon: {
          "prompt": true,
          "mode": "cr",
        },
        range: {
          units: "ft",
          value: "20",
        },
        target: {
          affects: {
            "count": "4",
            "type": "space",
          },
        },
      },
    };
  }

  get override() {
    const uses = this._getSpellUsesWithSpent({
      type: "class",
      name: "Faithful Summons",
    });
    return {
      data: {
        system: {
          uses,
        },
        flags: {
          ddbimporter: {
            disposition: {
              match: true,
            },
          },
        },
      },
    };
  }
}
