import DDBEnricherData from "../../data/DDBEnricherData";

export default class HoldBreath extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get affect() {
    return {
      targetType: "self",
      activationType: "special",
      data: {
        duration: {
          value: "15",
          units: "minute",
        },
      },
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

}
