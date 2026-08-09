import DDBEnricherData from "../../data/DDBEnricherData";

export default class HoldBreath extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
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

  override get effects(): IDDBEffectHint[] {
    return [
      {
        data: {
          duration: {
            value: 3600,
            units: "seconds",
          },
        },
      },
    ];
  }

}
