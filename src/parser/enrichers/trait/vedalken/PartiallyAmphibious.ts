import DDBEnricherData from "../../data/DDBEnricherData";

export default class PartiallyAmphibious extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      targetType: "self",
      activationType: "special",
      addItemConsume: true,
    };
  }

  get effects(): IDDBEffectHint[] {
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
      uses: {
        spent: null,
        max: "1",
        recovery: [
          {
            period: "lr",
            type: "recoverAll",
          },
        ],
      },
      data: {
        "flags.midiProperties.toggleEffect": true,
      },
    };
  }

}
