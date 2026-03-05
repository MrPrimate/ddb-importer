import DDBEnricherData from "../../data/DDBEnricherData";

export default class FaithfulSummons extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get activity(): IDDBActivityData {
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

  get override(): IDDBOverrideData {
    const uses = this._getSpellUsesWithSpent({
      type: "class",
      name: "Faithful Summons",
    });
    return {
      uses,
      data: {
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
